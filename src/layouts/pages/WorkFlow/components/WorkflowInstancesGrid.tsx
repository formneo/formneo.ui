/**
 * WorkflowInstancesGrid - Form alanlarına göre dinamik kolonlu grid
 *
 * WorkflowDetail ve ProcessHub'da kullanılacak ortak bileşen.
 * Form şemasından alanları çıkarır, label ve component tipine göre değerleri render eder.
 */
import React, { useState, useEffect, useMemo } from "react";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { Box, Typography, Chip, IconButton, Tooltip, Paper } from "@mui/material";
import * as MuiIcons from "@mui/icons-material";
import { ProcessHubApi } from "api/generated";
import getConfiguration from "confiuration";
import { extractFieldsFromFormDesign } from "../utils/formDesignFields";
import type { FormDesignField } from "../utils/formDesignFields";
import type { ProcessHubItemDto } from "api/generated";
import type { GridColumnSchema, GridSchema } from "../types/gridSchema";

export interface WorkflowInstancesGridProps {
  /** Workflow definition ID (GUID) */
  workflowId: string;
  /** Form design JSON string veya object - alanları çıkarmak için (gridSchema yoksa kullanılır) */
  formDesign: string | object | null;
  /** Kaydedilmiş grid şeması - varsa formDesign yerine bu kullanılır */
  gridSchema?: GridSchema | null;
  /** ProcessHub viewType - menüden gelen view id (örn: "all", "my", "approval") */
  viewType?: string;
  /** Satıra tıklandığında - runtime'a yönlendirme için */
  onRowClick?: (row: ProcessHubItemDto) => void;
  /** Geri dönüş path (örn: "/WorkFlowList/detail/xxx" veya "/process-hub") */
  returnTo?: string;
  /** Yükseklik (px) */
  height?: number;
}

/** GridColumnSchema veya FormDesignField ile formatlama */
function formatCellValue(
  value: any,
  field: FormDesignField | GridColumnSchema
): string | React.ReactNode {
  if (value === null || value === undefined) return "-";

  // Select/Radio: value -> label dönüşümü
  if (field.values && field.values.length > 0) {
    const found = field.values.find(
      (opt) =>
        opt.value === value ||
        String(opt.value) === String(value) ||
        (Array.isArray(value) && value.includes(opt.value))
    );
    if (found) return found.label;
    // Multiselect
    if (Array.isArray(value)) {
      return value
        .map(
          (v) => field.values?.find((o) => o.value === v || String(o.value) === String(v))?.label ?? v
        )
        .join(", ");
    }
  }

  const valueEditorType = "valueEditorType" in field ? field.valueEditorType : (field as GridColumnSchema).valueEditorType;
  const fieldType = "type" in field ? field.type : (field as GridColumnSchema).type;

  // Checkbox
  if (valueEditorType === "checkbox") {
    const boolVal = value === true || value === "true" || value === 1;
    return boolVal ? "Evet" : "Hayır";
  }

  // Tarih / Datetime formatı
  const editorTypeStr = String(valueEditorType ?? "");
  if (fieldType === "date" || editorTypeStr === "date" || editorTypeStr === "datetime") {
    try {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        const hasTime = String(value).length > 10 || editorTypeStr === "datetime";
        return hasTime
          ? d.toLocaleString("tr-TR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })
          : d.toLocaleDateString("tr-TR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            });
      }
    } catch {}
  }

  // Number/Currency
  if (fieldType === "number" || valueEditorType === "number") {
    const num = Number(value);
    if (!isNaN(num)) {
      return num.toLocaleString("tr-TR");
    }
  }

  return String(value);
}

/** GridColumnSchema'yı FormDesignField formatına çevir (formatCellValue uyumluluğu) */
function schemaToFieldLike(col: GridColumnSchema): FormDesignField & GridColumnSchema {
  return {
    name: col.fieldKey,
    label: col.label,
    type: col.type || "string",
    valueEditorType: (col.valueEditorType as FormDesignField["valueEditorType"]) || "text",
    operators: [],
    values: col.values,
    ...col,
  };
}

export default function WorkflowInstancesGrid({
  workflowId,
  formDesign,
  gridSchema,
  viewType = "all",
  onRowClick,
  returnTo,
  height = 400,
}: WorkflowInstancesGridProps): JSX.Element {
  const [gridData, setGridData] = useState<ProcessHubItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageInfo, setPageInfo] = useState({ total: 0, page: 0, pageSize: 25 });

  // Kolonlar: gridSchema varsa onu kullan, yoksa formDesign'dan çıkar
  const formFields = useMemo(() => {
    if (gridSchema && gridSchema.length > 0) {
      return gridSchema.map(schemaToFieldLike);
    }
    return extractFieldsFromFormDesign(formDesign);
  }, [formDesign, gridSchema]);

  // Grid verilerini çek
  useEffect(() => {
    if (!workflowId || !viewType) {
      setGridData([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const conf = getConfiguration();
        const api = new ProcessHubApi(conf);
        const response = await api.apiProcessHubDataGet(
          workflowId,
          viewType,
          pageInfo.page + 1,
          pageInfo.pageSize
        );
        const data = response.data;
        setGridData(data?.data || []);
        setPageInfo({
          total: data?.totalCount || 0,
          page: (data?.page || 1) - 1,
          pageSize: data?.pageSize || pageInfo.pageSize,
        });
      } catch (error) {
        console.error("Grid verisi yüklenirken hata:", error);
        setGridData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [workflowId, viewType, pageInfo.page, pageInfo.pageSize]);

  // Dinamik kolonlar: form alanları + sabit kolonlar
  const columns: GridColDef[] = useMemo(() => {
    const cols: GridColDef[] = [];

    // Form alanlarından dinamik kolonlar
    formFields.forEach((field) => {
      cols.push({
        field: `formData_${field.name}`,
        headerName: field.label,
        flex: 1,
        minWidth: 140,
        renderCell: (params: GridRenderCellParams) => {
          const row = params.row as ProcessHubItemDto;
          let formDataObj: Record<string, any> = {};
          try {
            if (row.formData) {
              formDataObj = typeof row.formData === "string" ? JSON.parse(row.formData) : row.formData;
            }
          } catch {}
          const value = formDataObj[field.name];
          return (
            <Typography variant="body2" noWrap title={String(value ?? "")}>
              {formatCellValue(value, field)}
            </Typography>
          );
        },
      });
    });

    // Sabit kolonlar
    cols.push({
      field: "currentNodeName",
      headerName: "Güncel Adım",
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value || "Başlangıç"}
          size="small"
          variant="outlined"
          color="primary"
        />
      ),
    });
    cols.push({
      field: "workFlowStatusText",
      headerName: "Durum",
      width: 130,
      renderCell: (params: GridRenderCellParams) => {
        const status = params.value || "Beklemede";
        const color =
          status.includes("Tamamlan") || status.includes("Onaylan")
            ? "success"
            : status.includes("Red") || status.includes("İptal")
            ? "error"
            : status.includes("Bekl")
            ? "warning"
            : "default";
        return <Chip label={status} size="small" color={color} />;
      },
    });
    cols.push({
      field: "createdDate",
      headerName: "Oluşturma",
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="caption">
          {params.value ? new Date(params.value).toLocaleDateString("tr-TR") : "-"}
        </Typography>
      ),
    });
    cols.push({
      field: "actions",
      headerName: "",
      width: 80,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title="Görüntüle">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              if (onRowClick) onRowClick(params.row as ProcessHubItemDto);
            }}
          >
            <MuiIcons.Visibility fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    });

    return cols;
  }, [formFields, onRowClick]);

  // Satır verilerini formData alanlarıyla zenginleştir (DataGrid field eşlemesi için)
  const rows = useMemo(() => {
    return gridData.map((row) => {
      const enriched = { ...row };
      formFields.forEach((field) => {
        let formDataObj: Record<string, any> = {};
        try {
          if (row.formData) {
            formDataObj =
              typeof row.formData === "string" ? JSON.parse(row.formData) : row.formData;
          }
        } catch {}
        (enriched as any)[`formData_${field.name}`] = formDataObj[field.name];
      });
      return enriched;
    });
  }, [gridData, formFields]);

  const handleRowClick = (params: { row: ProcessHubItemDto }) => {
    if (onRowClick) {
      onRowClick(params.row);
    }
  };

  return (
    <Paper sx={{ height, overflow: "hidden" }} variant="outlined">
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        pageSizeOptions={[10, 25, 50, 100]}
        paginationModel={{
          page: pageInfo.page,
          pageSize: pageInfo.pageSize,
        }}
        onPaginationModelChange={(model) => {
          setPageInfo((prev) => ({
            ...prev,
            page: model.page,
            pageSize: model.pageSize,
          }));
        }}
        rowCount={pageInfo.total}
        paginationMode="server"
        onRowClick={handleRowClick}
        sx={{
          border: "none",
          "& .MuiDataGrid-cell": { borderBottom: "1px solid #f0f0f0" },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#f8f9fa",
            borderBottom: "2px solid #e0e0e0",
            fontWeight: 600,
          },
          "& .MuiDataGrid-row": { cursor: "pointer" },
          "& .MuiDataGrid-cell:focus": { outline: "none" },
        }}
        localeText={{
          noRowsLabel: "Kayıt bulunamadı",
          noResultsOverlayLabel: "Sonuç bulunamadı",
        }}
      />
    </Paper>
  );
}
