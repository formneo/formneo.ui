/**
 * 🏢 FormNeo - Süreç Merkezi View
 * Belirli bir workflow ve view tipi için veri görüntüleme sayfası
 */

import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import * as MuiIcons from "@mui/icons-material";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import { ProcessHubApi } from "api/generated/api";
import getConfiguration from "confiuration";

export default function ProcessHubView(): JSX.Element {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [pageInfo, setPageInfo] = useState({ total: 0, page: 0, pageSize: 25 });

  // URL'den parametreleri al
  const workflowId = searchParams.get("workflowId");
  const viewType = searchParams.get("viewType");

  // Backend'den veri çek
  useEffect(() => {
    console.log("📍 ProcessHubView useEffect triggered:", { workflowId, viewType, pageInfo });
    
    if (!workflowId || !viewType) {
      console.warn("⚠️ workflowId veya viewType eksik:", { workflowId, viewType });
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        console.log("🚀 API çağrısı başlatılıyor:", {
          workflowId,
          viewType,
          page: pageInfo.page + 1,
          pageSize: pageInfo.pageSize,
        });
        
        // ProcessHubApi kullanarak veri çekme
        const conf = getConfiguration();
        const api = new ProcessHubApi(conf);
        const response = await api.apiProcessHubDataGet(
          workflowId || undefined,
          viewType || undefined,
          pageInfo.page + 1, // Backend 1-based pagination
          pageInfo.pageSize
        );
        
        console.log("✅ API yanıtı alındı:", response.data);
        
        const data = response.data;
        setRows(data.data || []);
        setPageInfo({
          total: data.totalCount || 0,
          page: (data.page || 1) - 1, // MUI DataGrid 0-based
          pageSize: data.pageSize || pageInfo.pageSize,
        });
        
      } catch (error: any) {
        console.error("❌ Veri yüklenirken hata:", error);
        const errorMessage = error.response?.data?.message || "Veri yüklenirken bir hata oluştu";
        console.error(errorMessage);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [workflowId, viewType, pageInfo.page, pageInfo.pageSize]);

  // DataGrid kolonları - Minimal tasarım: Sadece gerekli bilgiler (detaylar zaten tıklayınca görünecek)
  const columns: GridColDef[] = [
    {
      field: "title",
      headerName: "Başlık",
      flex: 1,
      minWidth: 300,
    },
    {
      field: "status",
      headerName: "Durum",
      width: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value || "Beklemede"}
          size="small"
          color={params.value === "Onaylandı" ? "success" : "warning"}
        />
      ),
    },
    {
      field: "createdAt",
      headerName: "Oluşturma Tarihi",
      width: 160,
    },
    {
      field: "actions",
      headerName: "İşlemler",
      width: 100,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Görüntüle">
            <IconButton size="small" onClick={() => console.log("View:", params.row.id)}>
              <MuiIcons.Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Box sx={{ maxWidth: 1200, mx: "auto" }}>
          {/* Header */}
          <Paper
            sx={{
              p: 3,
              mb: 3,
              borderRadius: "16px",
              background: "linear-gradient(135deg, #667eea22 0%, #667eea11 100%)",
              border: "1px solid #667eea33",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                  Süreç Görünümü
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Workflow ID: {workflowId || "Belirtilmemiş"}
                  <br />
                  View Type: {viewType || "Belirtilmemiş"}
                </Typography>
              </Box>
              <MDButton
                variant="outlined"
                color="secondary"
                startIcon={<MuiIcons.ArrowBack />}
                onClick={() => navigate("/process-hub")}
              >
                Geri Dön
              </MDButton>
            </Box>
          </Paper>

          {/* DataGrid Area */}
          <Paper
            sx={{
              height: 650,
              width: "100%",
              borderRadius: "16px",
              border: "1px solid #e0e0e0",
              overflow: "hidden",
              "& .MuiDataGrid-root": {
                border: "none",
              },
              "& .MuiDataGrid-cell": {
                borderBottom: "1px solid #f0f0f0",
              },
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "#f8f9fa",
                borderBottom: "2px solid #e0e0e0",
                fontWeight: 700,
              },
            }}
          >
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
                setPageInfo((prev) => ({ ...prev, page: model.page, pageSize: model.pageSize }));
              }}
              rowCount={pageInfo.total}
              paginationMode="server"
              checkboxSelection
              disableRowSelectionOnClick
              sx={{
                "& .MuiDataGrid-cell:focus": {
                  outline: "none",
                },
                "& .MuiDataGrid-row": {
                  cursor: "pointer",
                },
              }}
              onRowClick={(params) => {
                console.log("Satıra tıklandı:", params.row);
              }}
              localeText={{
                noRowsLabel: "Kayıt bulunamadı",
                noResultsOverlayLabel: "Sonuç bulunamadı",
                toolbarDensity: "Yoğunluk",
                toolbarDensityLabel: "Yoğunluk",
                toolbarDensityCompact: "Kompakt",
                toolbarDensityStandard: "Standart",
                toolbarDensityComfortable: "Rahat",
                toolbarColumns: "Sütunlar",
                toolbarColumnsLabel: "Sütunları seç",
                toolbarFilters: "Filtreler",
                toolbarFiltersLabel: "Filtreleri göster",
                columnMenuLabel: "Menü",
                columnMenuShowColumns: "Sütunları göster",
                columnMenuFilter: "Filtrele",
                columnMenuHideColumn: "Gizle",
                columnMenuUnsort: "Sıralamayı kaldır",
                columnMenuSortAsc: "Artan sırala",
                columnMenuSortDesc: "Azalan sırala",
                footerRowSelected: (count) =>
                  count !== 1 ? `${count} satır seçildi` : `${count} satır seçildi`,
                footerTotalRows: "Toplam Satır:",
                MuiTablePagination: {
                  labelRowsPerPage: "Sayfa başına:",
                  labelDisplayedRows: ({ from, to, count }) =>
                    `${from}-${to} / ${count !== -1 ? count : `${to}&apos;dan fazla`}`,
                },
              }}
            />
          </Paper>
        </Box>
      </MDBox>
    </DashboardLayout>
  );
}

