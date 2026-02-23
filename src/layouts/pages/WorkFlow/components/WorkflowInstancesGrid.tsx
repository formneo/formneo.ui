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
  /** Kaydedilmiş grid şeması - varsa formDesign yerine bu kullanılır (API dataGridSchema önceliklidir) */
  gridSchema?: GridSchema | null;
  /** ProcessHub viewType - menüden gelen view id (örn: "all", "my", "approval") */
  viewType?: string;
  /** Satıra tıklandığında - runtime'a yönlendirme için (görüntüle) */
  onRowClick?: (row: ProcessHubItemDto) => void;
  /** Durum Taslak iken düzenleme için (Edit butonu) */
  onEditClick?: (row: ProcessHubItemDto) => void;
  /** İşlemler kolonuna ek butonlar (örn: Süreç Geçmişi) */
  renderExtraActions?: (params: GridRenderCellParams) => React.ReactNode;
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

const VALID_VALUE_EDITOR_TYPES: FormDesignField["valueEditorType"][] = ["text", "number", "date", "time", "select", "radio", "checkbox", "multiselect"];

function toValidValueEditorType(v: string | undefined): FormDesignField["valueEditorType"] {
  return (v && VALID_VALUE_EDITOR_TYPES.includes(v as FormDesignField["valueEditorType"]))
    ? (v as FormDesignField["valueEditorType"])
    : "text";
}

/** fieldKey'dan veri anahtarını çıkar - "formId.fieldKey" -> "fieldKey" veya "fieldKey" */
function getDataKey(fieldKey: string): string {
  const lastDot = fieldKey.lastIndexOf(".");
  return lastDot >= 0 ? fieldKey.slice(lastDot + 1) : fieldKey;
}

/** GridColumnSchema'yı FormDesignField formatına çevir (formatCellValue uyumluluğu) */
function schemaToFieldLike(col: GridColumnSchema): FormDesignField & GridColumnSchema & { dataKey: string } {
  return {
    ...col,
    name: col.fieldKey,
    dataKey: getDataKey(col.fieldKey),
    label: col.label,
    type: col.type || "string",
    valueEditorType: toValidValueEditorType(col.valueEditorType),
    operators: [],
    values: col.values,
  };
}

export default function WorkflowInstancesGrid({
  workflowId,
  formDesign,
  gridSchema,
  viewType = "all",
  onRowClick,
  onEditClick,
  renderExtraActions,
  returnTo,
  height = 400,
}: WorkflowInstancesGridProps): JSX.Element {
  const [gridData, setGridData] = useState<ProcessHubItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageInfo, setPageInfo] = useState({ total: 0, page: 0, pageSize: 25 });
  /** API'den gelen grid şeması (dataGridSchema) - öncelikli kaynak */
  const [gridSchemaFromApi, setGridSchemaFromApi] = useState<GridSchema | null>(null);

  // Kolonlar: API'den gelen dataGridSchema > props gridSchema > formDesign
  const formFields = useMemo(() => {
    const schema = gridSchemaFromApi ?? gridSchema;
    if (schema && schema.length > 0) {
      return schema.map(schemaToFieldLike);
    }
    return extractFieldsFromFormDesign(formDesign);
  }, [formDesign, gridSchema, gridSchemaFromApi]);

  // Grid verilerini çek
  useEffect(() => {
    if (!workflowId || !viewType) {
      setGridData([]);
      setGridSchemaFromApi(null);
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
        // dataGridSchema JSON string olarak gelir - parse et
        if (data?.dataGridSchema) {
          try {
            const parsed = JSON.parse(data.dataGridSchema) as GridSchema;
            if (Array.isArray(parsed) && parsed.length > 0) {
              setGridSchemaFromApi(parsed);
            } else {
              setGridSchemaFromApi(null);
            }
          } catch {
            setGridSchemaFromApi(null);
          }
        } else {
          setGridSchemaFromApi(null);
        }
      } catch (error) {
        console.error("Grid verisi yüklenirken hata:", error);
        setGridData([]);
        setGridSchemaFromApi(null);
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
      const dataKey = "dataKey" in field ? (field as any).dataKey : field.name;
      cols.push({
        field: `formData_${field.name}`,
        headerName: field.label,
        flex: 1,
        minWidth: 140,
        renderCell: (params: GridRenderCellParams) => {
          const row = params.row as any;
          // API form alanlarını row.formData veya row kökünde döndürebilir
          let formDataObj: Record<string, any> = {};
          try {
            if (row.formData) {
              formDataObj = typeof row.formData === "string" ? JSON.parse(row.formData) : row.formData;
            } else {
              formDataObj = row; // Flat yapı: alanlar doğrudan row'da
            }
          } catch {}
          const value = formDataObj[field.name] ?? formDataObj[dataKey];
          return (
            <Typography variant="body2" noWrap title={String(value ?? "")}>
              {formatCellValue(value, field)}
            </Typography>
          );
        },
      });
    });

    // Sabit kolonlar (API _prefix ile de döndürebilir)
    cols.push({
      field: "workFlowStatusText",
      headerName: "Durum",
      width: 130,
      renderCell: (params: GridRenderCellParams) => {
        const row = params.row as any;
        const status = params.value ?? row._workFlowStatusText ?? row.workFlowStatusText ?? "Beklemede";
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
      renderCell: (params: GridRenderCellParams) => {
        const row = params.row as any;
        const val = params.value ?? row._createdDate ?? row.createdDate;
        return (
          <Typography variant="caption">
            {val ? new Date(val).toLocaleDateString("tr-TR") : "-"}
          </Typography>
        );
      },
    });
    cols.push({
      field: "actions",
      headerName: "",
      width: 140,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        const row = params.row as any;
        const status = row._workFlowStatusText ?? row.workFlowStatusText ?? "";
        const isTaslak = String(status).toLowerCase().includes("taslak");
        return (
          <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
            {renderExtraActions?.(params)}
            {isTaslak && onEditClick ? (
              <Tooltip title="Düzenle">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditClick(params.row as ProcessHubItemDto);
                  }}
                >
                  <MuiIcons.Edit fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : onRowClick ? (
              <Tooltip title="Görüntüle">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRowClick(params.row as ProcessHubItemDto);
                  }}
                >
                  <MuiIcons.Visibility fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : null}
          </Box>
        );
      },
    });

    return cols;
  }, [formFields, onRowClick, onEditClick, renderExtraActions]);

  // Satır verilerini formData alanlarıyla zenginleştir (DataGrid field eşlemesi için)
  const rows = useMemo(() => {
    return gridData.map((row, index) => {
      const r = row as any;
      const enriched = { ...row };
      formFields.forEach((field) => {
        const dataKey = "dataKey" in field ? (field as any).dataKey : field.name;
        let formDataObj: Record<string, any> = {};
        try {
          if (row.formData) {
            formDataObj =
              typeof row.formData === "string" ? JSON.parse(row.formData) : row.formData;
          } else {
            formDataObj = r;
          }
        } catch {}
        const value = formDataObj[field.name] ?? formDataObj[dataKey];
        (enriched as any)[`formData_${field.name}`] = value;
      });
      // API _prefix ile döndürüyorsa standart alanlara map et
      if (r._workFlowStatusText !== undefined) (enriched as any).workFlowStatusText = r._workFlowStatusText;
      if (r._createdDate !== undefined) (enriched as any).createdDate = r._createdDate;
      if (!r.id && !r.workflowHeadId && !r.workflowItemId && !r._workflowHeadId && !r._workflowItemId) {
        (enriched as any).__gridRowId = `row-${index}`;
      }
      return enriched;
    });
  }, [gridData, formFields]);

  // API bazen id döndürmeyebilir - workflowHeadId/workflowItemId kullan (MUI DataGrid zorunluluğu)
  const getRowId = (row: any) =>
    row.id ?? row.workflowHeadId ?? row.workflowItemId ?? row._workflowHeadId ?? row._workflowItemId ?? row.__gridRowId;

  const handleRowClick = (params: { row: ProcessHubItemDto }) => {
    if (onRowClick) {
      onRowClick(params.row);
    }
  };

  return (
    <Paper sx={{ height, overflow: "hidden" }} variant="outlined">
      <DataGrid
        rows={rows}
        getRowId={getRowId}
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
