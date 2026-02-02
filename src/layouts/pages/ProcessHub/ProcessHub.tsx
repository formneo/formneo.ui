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
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Collapse,
  Badge,
  Divider,
  Button,
  Tooltip,
  Avatar,
  Stack,
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Receipt as ReceiptIcon,
  BeachAccess as BeachAccessIcon,
  Lightbulb as LightbulbIcon,
  Work as WorkIcon,
  ShoppingCart as ShoppingCartIcon,
  Build as BuildIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Assignment as AssignmentIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

// Süreç kategorileri tipi
interface ProcessCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  subCategories: {
    id: string;
    name: string;
    icon: React.ReactNode;
    count?: number;
    badge?: string;
  }[];
  workflowKey?: string; // İlgili workflow key
}

// Süreç kategorileri tanımı
const processCategories: ProcessCategory[] = [
  {
    id: "expense",
    name: "Masraf Talebi",
    icon: <ReceiptIcon />,
    color: "#667eea",
    workflowKey: "expense-request",
    subCategories: [
      { id: "my-requests", name: "Benim Taleplerim", icon: <PersonIcon />, count: 5 },
      { id: "pending-approval", name: "Onay Bekleyenler", icon: <HourglassEmptyIcon />, count: 3, badge: "new" },
      { id: "all-records", name: "Tüm Kayıtlar (Admin)", icon: <AssignmentIcon />, count: 45 },
    ],
  },
  {
    id: "leave",
    name: "İzin Talebi",
    icon: <BeachAccessIcon />,
    color: "#f093fb",
    workflowKey: "leave-request",
    subCategories: [
      { id: "my-requests", name: "Benim Taleplerim", icon: <PersonIcon />, count: 2 },
      { id: "pending-approval", name: "Onay Bekleyenler", icon: <HourglassEmptyIcon />, count: 1 },
      { id: "all-records", name: "Tüm Kayıtlar", icon: <AssignmentIcon />, count: 28 },
    ],
  },
  {
    id: "suggestion",
    name: "Öneri Süreci",
    icon: <LightbulbIcon />,
    color: "#feca57",
    workflowKey: "suggestion",
    subCategories: [
      { id: "records", name: "Kayıtlar", icon: <AssignmentIcon />, count: 12 },
    ],
  },
  {
    id: "purchase",
    name: "Satın Alma Talebi",
    icon: <ShoppingCartIcon />,
    color: "#48dbfb",
    workflowKey: "purchase-request",
    subCategories: [
      { id: "my-requests", name: "Benim Taleplerim", icon: <PersonIcon />, count: 3 },
      { id: "pending-approval", name: "Onay Bekleyenler", icon: <HourglassEmptyIcon />, count: 7 },
      { id: "all-records", name: "Tüm Kayıtlar", icon: <AssignmentIcon />, count: 67 },
    ],
  },
  {
    id: "maintenance",
    name: "Bakım Onarım Talebi",
    icon: <BuildIcon />,
    color: "#ff6b6b",
    workflowKey: "maintenance-request",
    subCategories: [
      { id: "my-requests", name: "Benim Taleplerim", icon: <PersonIcon />, count: 1 },
      { id: "pending-approval", name: "Onay Bekleyenler", icon: <HourglassEmptyIcon />, count: 4 },
      { id: "all-records", name: "Tüm Kayıtlar", icon: <AssignmentIcon />, count: 89 },
    ],
  },
];

const DRAWER_WIDTH = 320;

// Örnek veri - Gerçek uygulamada API'den gelecek
const generateMockData = (categoryId: string, subCategoryId: string) => {
  const statuses = ["Onay Bekliyor", "Onaylandı", "Reddedildi", "Taslak"];
  const statusColors: Record<string, "warning" | "success" | "error" | "default"> = {
    "Onay Bekliyor": "warning",
    "Onaylandı": "success",
    "Reddedildi": "error",
    "Taslak": "default",
  };
  
  return Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
    requestId: `${categoryId.toUpperCase()}-${1000 + i}`,
    title: `${categoryId === "expense" ? "Masraf" : categoryId === "leave" ? "İzin" : "Öneri"} Talebi #${i + 1}`,
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
    creator: `Kullanıcı ${Math.floor(Math.random() * 10) + 1}`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    statusColor: statusColors[statuses[Math.floor(Math.random() * statuses.length)]],
    amount: categoryId === "expense" ? `${(Math.random() * 5000 + 100).toFixed(2)} ₺` : null,
    date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString("tr-TR"),
    priority: ["Düşük", "Orta", "Yüksek"][Math.floor(Math.random() * 3)],
  }));
};

export default function ProcessHub(): JSX.Element {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get("category") || "expense"
  );
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>(
    searchParams.get("subCategory") || "my-requests"
  );
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    expense: true,
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Grid verileri
  const rows = generateMockData(selectedCategory, selectedSubCategory);

  // URL parametrelerini güncelle
  useEffect(() => {
    setSearchParams({ category: selectedCategory, subCategory: selectedSubCategory });
  }, [selectedCategory, selectedSubCategory]);

  // Kategori genişlet/daralt
  const handleToggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // Kategori seç
  const handleSelectCategory = (categoryId: string, subCategoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedSubCategory(subCategoryId);
    setMobileOpen(false); // Mobilde drawer'ı kapat
  };

  // Yeni talep oluştur
  const handleNewRequest = () => {
    const category = processCategories.find((c) => c.id === selectedCategory);
    if (category?.workflowKey) {
      navigate(`/workflows/runtime/new?workflow=${category.workflowKey}`);
    }
  };

  // Seçili kategori ve alt kategoriyi bul
  const currentCategory = processCategories.find((c) => c.id === selectedCategory);
  const currentSubCategory = currentCategory?.subCategories.find((s) => s.id === selectedSubCategory);

  // DataGrid sütun tanımları
  const columns: GridColDef[] = [
    {
      field: "requestId",
      headerName: "Talep No",
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          size="small"
          sx={{ fontWeight: 600, fontSize: "11px" }}
        />
      ),
    },
    {
      field: "title",
      headerName: "Başlık",
      flex: 1,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.description}
          </Typography>
        </Box>
      ),
    },
    {
      field: "creator",
      headerName: "Oluşturan",
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar sx={{ width: 28, height: 28, fontSize: "12px", bgcolor: currentCategory?.color }}>
            {params.value.charAt(0)}
          </Avatar>
          <Typography variant="caption">{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: "amount",
      headerName: "Tutar",
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight={600} color="primary">
          {params.value || "-"}
        </Typography>
      ),
    },
    {
      field: "priority",
      headerName: "Öncelik",
      width: 120,
      renderCell: (params: GridRenderCellParams) => {
        const colors: Record<string, "error" | "warning" | "success"> = {
          "Yüksek": "error",
          "Orta": "warning",
          "Düşük": "success",
        };
        return (
          <Chip
            label={params.value}
            size="small"
            color={colors[params.value as string]}
            sx={{ fontWeight: 600, fontSize: "10px" }}
          />
        );
      },
    },
    {
      field: "status",
      headerName: "Durum",
      width: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          size="small"
          color={params.row.statusColor}
          sx={{ fontWeight: 600, fontSize: "11px" }}
        />
      ),
    },
    {
      field: "date",
      headerName: "Tarih",
      width: 120,
    },
    {
      field: "actions",
      headerName: "İşlemler",
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Görüntüle">
            <IconButton size="small" onClick={() => navigate(`/workflows/runtime/${params.row.id}`)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Düzenle">
            <IconButton size="small">
              <EditIcon fontSize="small" />
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
            <CloseIcon />
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
        {processCategories.map((category) => (
          <React.Fragment key={category.id}>
            {/* Ana Kategori */}
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => handleToggleCategory(category.id)}
                sx={{
                  py: 1.5,
                  px: 2,
                  "&:hover": {
                    backgroundColor: "rgba(102, 126, 234, 0.08)",
                  },
                }}
              >
                <ListItemIcon sx={{ color: category.color, minWidth: 40 }}>
                  {category.icon}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2" fontWeight={600}>
                      {category.name}
                    </Typography>
                  }
                />
                {expandedCategories[category.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </ListItemButton>
            </ListItem>

            {/* Alt Kategoriler */}
            <Collapse in={expandedCategories[category.id]} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {category.subCategories.map((subCat) => (
                  <ListItemButton
                    key={subCat.id}
                    sx={{
                      pl: 6,
                      py: 1,
                      backgroundColor:
                        selectedCategory === category.id && selectedSubCategory === subCat.id
                          ? "rgba(102, 126, 234, 0.12)"
                          : "transparent",
                      borderLeft:
                        selectedCategory === category.id && selectedSubCategory === subCat.id
                          ? `3px solid ${category.color}`
                          : "3px solid transparent",
                      "&:hover": {
                        backgroundColor: "rgba(102, 126, 234, 0.08)",
                      },
                    }}
                    onClick={() => handleSelectCategory(category.id, subCat.id)}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: category.color }}>
                      {subCat.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="caption" fontWeight={500}>
                            {subCat.name}
                          </Typography>
                          {subCat.count !== undefined && (
                            <Chip
                              label={subCat.count}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: "10px",
                                fontWeight: 700,
                                backgroundColor: category.color,
                                color: "white",
                              }}
                            />
                          )}
                          {subCat.badge === "new" && (
                            <Chip
                              label="Yeni"
                              size="small"
                              color="error"
                              sx={{ height: 18, fontSize: "9px" }}
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
            <Divider sx={{ my: 0.5 }} />
          </React.Fragment>
        ))}
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
      <MDBox py={3} sx={{ height: "calc(100vh - 120px)", overflow: "hidden" }}>
        <Box sx={{ display: "flex", gap: 3, height: "100%" }}>
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
            <MenuIcon />
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
              px: { xs: 2, sm: 0 },
              height: "100%",
              overflow: "auto",
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
            {/* Header */}
            <Paper
              sx={{
                p: 3,
                mb: 3,
                borderRadius: "16px",
                background: `linear-gradient(135deg, ${currentCategory?.color}22 0%, ${currentCategory?.color}11 100%)`,
                border: `1px solid ${currentCategory?.color}33`,
                boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <Box sx={{ color: currentCategory?.color }}>{currentCategory?.icon}</Box>
                    <Typography variant="h4" fontWeight={700}>
                      {currentCategory?.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {currentSubCategory?.name}
                    {currentSubCategory?.count !== undefined && (
                      <Chip
                        label={`${currentSubCategory.count} kayıt`}
                        size="small"
                        sx={{ ml: 1, height: 22 }}
                      />
                    )}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 1 }}>
                  <Tooltip title="Filtrele">
                    <IconButton>
                      <FilterListIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Ara">
                    <IconButton>
                      <SearchIcon />
                    </IconButton>
                  </Tooltip>
                  <MDButton
                    variant="gradient"
                    color="info"
                    startIcon={<AddIcon />}
                    onClick={handleNewRequest}
                  >
                    Yeni Talep
                  </MDButton>
                </Box>
              </Box>
            </Paper>

            {/* DataGrid */}
            {rows.length > 0 ? (
              <Paper
                sx={{
                  height: 650,
                  width: "100%",
                  borderRadius: "16px",
                  border: "1px solid #e0e0e0",
                  overflow: "hidden",
                  boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
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
                  "& .MuiDataGrid-row:hover": {
                    backgroundColor: `${currentCategory?.color}11`,
                  },
                }}
              >
                <DataGrid
                  rows={rows}
                  columns={columns}
                  loading={loading}
                  pageSizeOptions={[10, 25, 50, 100]}
                  initialState={{
                    pagination: {
                      paginationModel: { pageSize: 25, page: 0 },
                    },
                    columns: {
                      columnVisibilityModel: {
                        amount: selectedCategory === "expense",
                      },
                    },
                  }}
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
                    // Satıra tıklandığında detay sayfasına git
                    console.log("Row clicked:", params.row);
                  }}
                  localeText={{
                    // Türkçe çeviriler
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
                    toolbarFiltersTooltipHide: "Filtreleri gizle",
                    toolbarFiltersTooltipShow: "Filtreleri göster",
                    toolbarExport: "Dışa Aktar",
                    toolbarExportLabel: "Dışa aktar",
                    toolbarExportCSV: "CSV olarak indir",
                    toolbarExportPrint: "Yazdır",
                    columnsPanelTextFieldLabel: "Sütun bul",
                    columnsPanelTextFieldPlaceholder: "Sütun başlığı",
                    columnsPanelDragIconLabel: "Sütunu yeniden sırala",
                    columnsPanelShowAllButton: "Tümünü göster",
                    columnsPanelHideAllButton: "Tümünü gizle",
                    filterPanelAddFilter: "Filtre ekle",
                    filterPanelDeleteIconLabel: "Sil",
                    filterPanelOperator: "Operatör",
                    filterPanelOperatorAnd: "Ve",
                    filterPanelOperatorOr: "Veya",
                    filterPanelColumns: "Sütunlar",
                    filterPanelInputLabel: "Değer",
                    filterPanelInputPlaceholder: "Filtre değeri",
                    filterOperatorContains: "içerir",
                    filterOperatorEquals: "eşittir",
                    filterOperatorStartsWith: "ile başlar",
                    filterOperatorEndsWith: "ile biter",
                    filterOperatorIs: "eşittir",
                    filterOperatorNot: "eşit değildir",
                    filterOperatorAfter: "sonra",
                    filterOperatorOnOrAfter: "veya sonra",
                    filterOperatorBefore: "önce",
                    filterOperatorOnOrBefore: "veya önce",
                    filterOperatorIsEmpty: "boş",
                    filterOperatorIsNotEmpty: "dolu",
                    columnMenuLabel: "Menü",
                    columnMenuShowColumns: "Sütunları göster",
                    columnMenuFilter: "Filtrele",
                    columnMenuHideColumn: "Gizle",
                    columnMenuUnsort: "Sıralamayı kaldır",
                    columnMenuSortAsc: "Artan sırala",
                    columnMenuSortDesc: "Azalan sırala",
                    footerRowSelected: (count) =>
                      count !== 1
                        ? `${count.toLocaleString()} satır seçildi`
                        : `${count.toLocaleString()} satır seçildi`,
                    footerTotalRows: "Toplam Satır:",
                    MuiTablePagination: {
                      labelRowsPerPage: "Sayfa başına satır:",
                      labelDisplayedRows: ({ from, to, count }) =>
                        `${from}-${to} / ${count !== -1 ? count : `${to}'dan fazla`}`,
                    },
                  }}
                />
              </Paper>
            ) : (
              // Boş State
              <Paper
                sx={{
                  p: 8,
                  textAlign: "center",
                  borderRadius: "16px",
                  border: "2px dashed #e0e0e0",
                }}
              >
                <Box sx={{ color: currentCategory?.color, mb: 2, fontSize: 48 }}>
                  {currentCategory?.icon}
                </Box>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Henüz kayıt bulunmuyor
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  İlk talebi oluşturarak başlayın
                </Typography>
                <MDButton
                  variant="gradient"
                  color="info"
                  startIcon={<AddIcon />}
                  onClick={handleNewRequest}
                >
                  Yeni Talep Oluştur
                </MDButton>
              </Paper>
            )}
          </Box>
        </Box>
      </MDBox>
    </DashboardLayout>
  );
}
