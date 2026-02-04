/**
 * 🏢 FormNeo - Süreç Merkezi
 * Kategorize edilmiş iş süreçleri yönetim merkezi
 */

import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Paper,
  IconButton,
  Collapse,
  Divider,
  Tooltip,
  CircularProgress,
  Chip,
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import * as MuiIcons from "@mui/icons-material";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";
import { 
  WorkFlowDefinationApi,
  ProcessHubApi,
  WorkFlowMenuResponseDto,
  WorkFlowMenuGroupDto,
  WorkFlowMenuItemDto,
  WorkFlowMenuViewDto,
} from "api/generated/api";
import getConfiguration from "confiuration";

// Icon mapping helper - API'den gelen string icon ismini MUI icon'a çevir
const getIconComponent = (iconName?: string | null): React.ReactNode => {
  if (!iconName) return <MuiIcons.Work />;
  
  // Icon name'i MUI format'a çevir (örn: "Receipt" -> ReceiptIcon)
  const formattedName = iconName.endsWith('Icon') ? iconName : `${iconName}Icon`;
  const IconComponent = (MuiIcons as any)[formattedName] || (MuiIcons as any)[iconName];
  
  return IconComponent ? <IconComponent /> : <MuiIcons.Work />;
};

// View icon mapping - view id'ye göre icon
const getViewIcon = (viewId?: string | null): React.ReactNode => {
  if (!viewId) return <MuiIcons.Assignment />;
  
  if (viewId.includes('my') || viewId.includes('requests')) {
    return <MuiIcons.Person />;
  }
  if (viewId.includes('approval') || viewId.includes('pending')) {
    return <MuiIcons.HourglassEmpty />;
  }
  if (viewId.includes('all') || viewId.includes('records')) {
    return <MuiIcons.Assignment />;
  }
  
  return <MuiIcons.Assignment />;
};

// Renk paleti - kategori renkleri için
const categoryColors = [
  "#667eea", "#f093fb", "#feca57", "#48dbfb", "#ff6b6b",
  "#4ecdc4", "#a8e6cf", "#ffd93d", "#6c5ce7", "#fd79a8"
];

const DRAWER_WIDTH = 320;

export default function ProcessHub(): JSX.Element {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [menuData, setMenuData] = useState<WorkFlowMenuGroupDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get("category") || ""
  );
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>(
    searchParams.get("subCategory") || ""
  );
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedWorkflows, setExpandedWorkflows] = useState<Record<string, boolean>>({});
  const [mobileOpen, setMobileOpen] = useState(false);
  const [gridData, setGridData] = useState<any[]>([]);
  const [gridLoading, setGridLoading] = useState(false);
  const [pageInfo, setPageInfo] = useState({ total: 0, page: 0, pageSize: 25 });

  // API'den menü yapısını yükle
  useEffect(() => {
    const loadMenuStructure = async () => {
      try {
        setLoading(true);
        const conf = getConfiguration();
        const api = new WorkFlowDefinationApi(conf);
        const response = await api.apiWorkFlowDefinationMenuStructureGet();
        const menus = response.data.menus || [];
        setMenuData(menus);
        
        // İlk kategori, workflow ve view'ı varsayılan olarak seç ve aç
        if (menus.length > 0) {
          const firstCategory = menus[0];
          const firstCategoryId = firstCategory.id || "";
          const firstWorkflow = firstCategory.children?.[0];
          const firstWorkflowId = firstWorkflow?.id || "";
          const firstView = firstWorkflow?.views?.[0];
          const firstSubCategoryId = firstWorkflow && firstView 
            ? `${firstWorkflow.id}_${firstView.id}` 
            : "";
          
          // Kategori ve ilk workflow'u aç
          setExpandedCategories({ [firstCategoryId]: true });
          setExpandedWorkflows({ [firstWorkflowId]: true });
          
          if (!selectedCategory) {
            setSelectedCategory(firstCategoryId);
          }
          if (!selectedSubCategory && firstSubCategoryId) {
            setSelectedSubCategory(firstSubCategoryId);
          }
        }
      } catch (error) {
        console.error("Menü yapısı yüklenirken hata:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMenuStructure();
  }, []);

  // Grid verilerini yükle (workflowId ve viewType varsa)
  useEffect(() => {
    const workflowIdParam = searchParams.get("workflowId");
    const viewTypeParam = searchParams.get("viewType");

    if (!workflowIdParam || !viewTypeParam) {
      // Parametreler yoksa grid'i temizle
      setGridData([]);
      return;
    }

    const fetchGridData = async () => {
      try {
        setGridLoading(true);
        
        console.log("🚀 Grid API çağrısı başlatılıyor:", {
          workflowId: workflowIdParam,
          viewType: viewTypeParam,
          page: pageInfo.page + 1,
          pageSize: pageInfo.pageSize,
        });
        
        // ProcessHubApi kullanarak veri çekme
        const conf = getConfiguration();
        const api = new ProcessHubApi(conf);
        const response = await api.apiProcessHubDataGet(
          workflowIdParam || undefined,
          viewTypeParam || undefined,
          pageInfo.page + 1, // Backend 1-based pagination
          pageInfo.pageSize
        );
        
        console.log("✅ Grid API yanıtı alındı:", response.data);
        
        const data = response.data;
        setGridData(data.data || []);
        setPageInfo({
          total: data.totalCount || 0,
          page: (data.page || 1) - 1, // MUI DataGrid 0-based
          pageSize: data.pageSize || pageInfo.pageSize,
        });
        
      } catch (error: any) {
        console.error("❌ Grid verisi yüklenirken hata:", error);
        setGridData([]);
      } finally {
        setGridLoading(false);
      }
    };

    fetchGridData();
  }, [searchParams.get("workflowId"), searchParams.get("viewType"), pageInfo.page, pageInfo.pageSize]);

  // Kategori genişlet/daralt
  const handleToggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // Workflow genişlet/daralt
  const handleToggleWorkflow = (workflowId: string) => {
    setExpandedWorkflows((prev) => ({
      ...prev,
      [workflowId]: !prev[workflowId],
    }));
  };

  // View seç - URL parametreleri otomatik güncellenecek (useEffect ile)
  const handleSelectView = (categoryId: string, workflowViewId: string, workflowGuid?: string, viewId?: string) => {
    setSelectedCategory(categoryId);
    setSelectedSubCategory(workflowViewId);
    setMobileOpen(false);
    
    // URL parametrelerini güncelle (aynı sayfada kal)
    const params: any = {
      category: categoryId,
      subCategory: workflowViewId,
    };
    
    if (workflowGuid) params.workflowId = workflowGuid;
    if (viewId) params.viewType = viewId;
    
    setSearchParams(params);
  };

  // Yeni talep oluştur
  const handleNewRequest = () => {
    // selectedSubCategory format: "workflowId_viewId"
    const [workflowId] = selectedSubCategory.split('_');
    const category = menuData.find((c) => c.id === selectedCategory);
    const workflow = category?.children?.find((item) => item.id === workflowId);
    if (workflow?.workflowGuid) {
      navigate(`/workflows/runtime/new?workflowId=${workflow.workflowGuid}`);
    }
  };

  // Seçili kategori ve view'ı bul
  const currentCategory = menuData.find((c) => c.id === selectedCategory);
  
  // selectedSubCategory format: "workflowId_viewId"
  const [workflowId, viewId] = selectedSubCategory.split('_');
  const currentWorkflow = currentCategory?.children?.find((w) => w.id === workflowId);
  const currentView = currentWorkflow?.views?.find((v) => v.id === viewId);
  
  // Renk ve icon helper'ları
  const getCategoryColor = (index: number) => categoryColors[index % categoryColors.length];
  const currentCategoryIndex = menuData.findIndex((c) => c.id === selectedCategory);
  const currentColor = currentCategoryIndex >= 0 ? getCategoryColor(currentCategoryIndex) : categoryColors[0];

  // DataGrid kolonları
  const gridColumns: GridColDef[] = [
    {
      field: "id",
      headerName: "ID",
      width: 100,
    },
    {
      field: "title",
      headerName: "Başlık",
      flex: 1,
      minWidth: 250,
    },
    {
      field: "status",
      headerName: "Durum",
      width: 150,
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
      width: 180,
    },
    {
      field: "actions",
      headerName: "İşlemler",
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Görüntüle">
            <IconButton size="small" onClick={() => console.log("View:", params.row)}>
              <MuiIcons.Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Düzenle">
            <IconButton size="small" onClick={() => console.log("Edit:", params.row)}>
              <MuiIcons.Edit fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];


  // Sidebar içeriği
  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Sidebar Header */}
      <Box
        sx={{
          p: 3,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="h5" fontWeight={700}>
            📂 Süreçler
          </Typography>
          <IconButton
            sx={{ color: "white", display: { sm: "none" } }}
            onClick={() => setMobileOpen(false)}
          >
            <MuiIcons.Close />
          </IconButton>
        </Box>
        <Typography variant="caption" sx={{ opacity: 0.9 }}>
          İş süreçlerinizi yönetin
        </Typography>
      </Box>

      {/* Kategori Listesi */}
      <List 
        sx={{ 
          flex: 1, 
          overflowY: "auto", 
          py: 1,
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "#f1f1f1",
            borderRadius: "10px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#c1c1c1",
            borderRadius: "10px",
            "&:hover": {
              backgroundColor: "#a8a8a8",
            },
          },
        }}
      >
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : menuData.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Henüz süreç tanımlı değil
            </Typography>
          </Box>
        ) : (
          menuData.map((category, categoryIndex) => {
            const categoryColor = getCategoryColor(categoryIndex);
            const categoryIcon = getIconComponent(category.icon);

            return (
              <React.Fragment key={category.id}>
                {/* Ana Kategori */}
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => handleToggleCategory(category.id || "")}
                    sx={{
                      py: 1.5,
                      px: 2,
                      "&:hover": {
                        backgroundColor: "rgba(102, 126, 234, 0.08)",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: categoryColor, minWidth: 40 }}>
                      {categoryIcon}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={600}>
                          {category.label}
                        </Typography>
                      }
                    />
                    {expandedCategories[category.id || ""] ? (
                      <MuiIcons.ExpandLess />
                    ) : (
                      <MuiIcons.ExpandMore />
                    )}
                  </ListItemButton>
                </ListItem>

                {/* Workflow'lar (Nested) */}
                <Collapse in={expandedCategories[category.id || ""]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {category.children?.map((workflow) => {
                      const workflowIcon = getIconComponent(workflow.icon);

                      return (
                        <React.Fragment key={workflow.id}>
                          {/* Workflow Header */}
                          <ListItemButton
                            onClick={() => handleToggleWorkflow(workflow.id || "")}
                            sx={{
                              pl: 4,
                              py: 1.5,
                              "&:hover": {
                                backgroundColor: "rgba(102, 126, 234, 0.05)",
                              },
                            }}
                          >
                            <ListItemIcon sx={{ color: categoryColor, minWidth: 36 }}>
                              {workflowIcon}
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography variant="body2" fontWeight={600} fontSize="13px">
                                  {workflow.label}
                                </Typography>
                              }
                            />
                            {expandedWorkflows[workflow.id || ""] ? (
                              <MuiIcons.ExpandLess fontSize="small" />
                            ) : (
                              <MuiIcons.ExpandMore fontSize="small" />
                            )}
                          </ListItemButton>

                          {/* Views (Alt kategoriler) */}
                          <Collapse in={expandedWorkflows[workflow.id || ""]} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                              {workflow.views?.map((view) => {
                                const viewId = `${workflow.id}_${view.id}`;
                                const viewIcon = getViewIcon(view.id);
                                const isSelected =
                                  selectedCategory === category.id && selectedSubCategory === viewId;

                                return (
                                  <ListItemButton
                                    key={viewId}
                                    sx={{
                                      pl: 8,
                                      py: 0.75,
                                      backgroundColor: isSelected
                                        ? "rgba(102, 126, 234, 0.12)"
                                        : "transparent",
                                      borderLeft: isSelected
                                        ? `3px solid ${categoryColor}`
                                        : "3px solid transparent",
                                      "&:hover": {
                                        backgroundColor: "rgba(102, 126, 234, 0.08)",
                                      },
                                    }}
                                    onClick={() => 
                                      handleSelectView(
                                        category.id || "", 
                                        viewId, 
                                        workflow.workflowGuid, 
                                        view.id
                                      )
                                    }
                                  >
                                    <ListItemIcon sx={{ minWidth: 32, color: categoryColor }}>
                                      {viewIcon}
                                    </ListItemIcon>
                                    <ListItemText
                                      primary={
                                        <Typography variant="caption" fontWeight={500}>
                                          {view.label}
                                        </Typography>
                                      }
                                    />
                                  </ListItemButton>
                                );
                              })}
                            </List>
                          </Collapse>
                        </React.Fragment>
                      );
                    })}
                  </List>
                </Collapse>
                <Divider sx={{ my: 0.5 }} />
              </React.Fragment>
            );
          })
        )}
      </List>

      {/* Sidebar Footer */}
      <Box sx={{ p: 2, borderTop: "1px solid #e0e0e0" }}>
        <Paper
          sx={{
            p: 2,
            backgroundColor: "#f8f9fa",
            border: "1px solid #e0e0e0",
            borderRadius: 2,
          }}
        >
          <Typography variant="caption" color="text.secondary" gutterBottom>
            💡 İpucu
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
            Hızlı erişim için sol menüden kategori seçin
          </Typography>
        </Paper>
      </Box>
    </Box>
  );

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox 
        sx={{ 
          position: "fixed",
          top: 74, // navbar height
          left: 0,
          right: 0,
          bottom: 0,
          overflow: "hidden",
        }}
      >
        <Box sx={{ display: "flex", gap: 3, height: "100%", p: 3 }}>
          {/* Mobile Menu Button */}
          <IconButton
            sx={{
              position: "fixed",
              top: 80,
              left: 16,
              zIndex: 1200,
              display: { sm: "none" },
              backgroundColor: "white",
              boxShadow: 2,
              "&:hover": { backgroundColor: "white" },
            }}
            onClick={() => setMobileOpen(true)}
          >
            <MuiIcons.Menu />
          </IconButton>

          {/* Sidebar - Desktop */}
          <Box
            sx={{
              display: { xs: "none", sm: "block" },
              width: DRAWER_WIDTH,
              flexShrink: 0,
              height: "100%",
            }}
          >
            <Paper
              elevation={2}
              sx={{
                width: DRAWER_WIDTH,
                height: "100%",
                borderRadius: "16px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {drawerContent}
            </Paper>
          </Box>

          {/* Sidebar - Mobile */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{
              keepMounted: true, // Better mobile performance
            }}
            sx={{
              display: { xs: "block", sm: "none" },
              "& .MuiDrawer-paper": {
                width: DRAWER_WIDTH,
                boxSizing: "border-box",
              },
            }}
          >
            {drawerContent}
          </Drawer>

          {/* Ana İçerik */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              minWidth: 0,
              minHeight: 0,
              px: { xs: 2, sm: 0 },
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <Paper
              sx={{
                p: 3,
                mb: 3,
                borderRadius: "16px",
                background: `linear-gradient(135deg, ${currentColor}22 0%, ${currentColor}11 100%)`,
                border: `1px solid ${currentColor}33`,
                boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <Box sx={{ color: currentColor }}>{getIconComponent(currentCategory?.icon)}</Box>
                    <Typography variant="h4" fontWeight={700}>
                      {currentWorkflow?.label || currentCategory?.label || "Süreç Merkezi"}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {currentView?.label || ""}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 1 }}>
                  <Tooltip title="Filtrele">
                    <IconButton>
                      <MuiIcons.FilterList />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Ara">
                    <IconButton>
                      <MuiIcons.Search />
                    </IconButton>
                  </Tooltip>
                  <MDButton
                    variant="gradient"
                    color="info"
                    startIcon={<MuiIcons.Add />}
                    onClick={handleNewRequest}
                  >
                    Yeni Talep
                  </MDButton>
                </Box>
              </Box>
            </Paper>

            {/* DataGrid - Workflow verilerini göster */}
            {searchParams.get("workflowId") && searchParams.get("viewType") ? (
              <Paper
                sx={{
                  flex: 1,
                  minHeight: 0,
                  borderRadius: "16px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <DataGrid
                  rows={gridData}
                  columns={gridColumns}
                  loading={gridLoading}
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
                    flex: 1,
                    border: "none",
                    "& .MuiDataGrid-cell": {
                      borderBottom: "1px solid #f0f0f0",
                    },
                    "& .MuiDataGrid-columnHeaders": {
                      backgroundColor: "#f8f9fa",
                      borderBottom: "2px solid #e0e0e0",
                      fontWeight: 700,
                    },
                    "& .MuiDataGrid-row:hover": {
                      backgroundColor: `${currentColor}11`,
                    },
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
                    toolbarColumns: "Sütunlar",
                    toolbarFilters: "Filtreler",
                    columnMenuLabel: "Menü",
                    columnMenuShowColumns: "Sütunları göster",
                    columnMenuFilter: "Filtrele",
                    columnMenuHideColumn: "Gizle",
                    columnMenuSortAsc: "Artan sırala",
                    columnMenuSortDesc: "Azalan sırala",
                    footerRowSelected: (count) => `${count} satır seçildi`,
                    MuiTablePagination: {
                      labelRowsPerPage: "Sayfa başına:",
                      labelDisplayedRows: ({ from, to, count }) =>
                        `${from}-${to} / ${count !== -1 ? count : `${to}+`}`,
                    },
                  }}
                />
              </Paper>
            ) : (
              // Boş durum - Henüz view seçilmemiş
              <Paper
                sx={{
                  p: 6,
                  textAlign: "center",
                  borderRadius: "16px",
                  border: "2px dashed #e0e0e0",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: 1,
                }}
              >
                <Box sx={{ color: currentColor, mb: 3, fontSize: 64 }}>
                  <MuiIcons.TouchApp />
                </Box>
                <Typography variant="h5" gutterBottom fontWeight={700}>
                  Sol Menüden Bir View Seçin
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  Verileri görüntülemek için sol taraftaki menüden bir kategori seçin
                </Typography>
              </Paper>
            )}
          </Box>
        </Box>
      </MDBox>
    </DashboardLayout>
  );
}
