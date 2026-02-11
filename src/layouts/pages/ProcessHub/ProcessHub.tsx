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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Grid,
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
  FormDataApi,
  ProcessHubApi,
  WorkFlowApi,
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
  
  // History Dialog State
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedWorkflowForHistory, setSelectedWorkflowForHistory] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState<any>(null);

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

  // Yeni talep oluştur - currentWorkflow state'inden sonra tanımlanacak

  // Seçili kategori ve view'ı bul
  const currentCategory = menuData.find((c) => c.id === selectedCategory);
  
  // selectedSubCategory format: "workflowId_viewId"
  const [workflowId, viewId] = selectedSubCategory.split('_');
  
  // ✅ Workflow'u bul - searchParams'tan gelen workflowGuid kullanarak da deneyebiliriz
  const workflowGuidFromParams = searchParams.get("workflowId");
  let currentWorkflow = currentCategory?.children?.find((w) => w.id === workflowId);
  
  // Eğer workflowId ile bulunamadıysa, workflowGuid ile dene
  if (!currentWorkflow && workflowGuidFromParams) {
    currentWorkflow = currentCategory?.children?.find((w) => w.workflowGuid === workflowGuidFromParams);
  }
  
  const currentView = currentWorkflow?.views?.find((v) => v.id === viewId);
  
  // Debug: Buton disabled durumu için kontrol
  console.log("🔍 Buton Disabled Durumu Kontrolü:", {
    selectedCategory,
    selectedSubCategory,
    workflowId,
    viewId,
    workflowGuidFromParams,
    hasCategoryChildren: !!currentCategory?.children,
    childrenCount: currentCategory?.children?.length || 0,
    childrenIds: currentCategory?.children?.map(c => c.id),
    childrenWorkflowGuids: currentCategory?.children?.map(c => c.workflowGuid),
    currentWorkflow: currentWorkflow?.label,
    hasWorkflowGuid: !!currentWorkflow?.workflowGuid,
    workflowGuid: currentWorkflow?.workflowGuid,
    buttonDisabled: !currentWorkflow?.workflowGuid,
  });

  // History Dialog Aç - ProcessHubApi kullanarak
  const handleOpenHistory = async (workflowHeadId: string) => {
    setHistoryDialogOpen(true);
    setHistoryLoading(true);
    
    try {
      const conf = getConfiguration();
      const api = new ProcessHubApi(conf);
      
      // ✅ Yeni GetHistory metodunu kullan
      const response = await api.apiProcessHubHistoryWorkflowHeadIdGet(workflowHeadId);
      
      console.log("✅ History API yanıtı:", response.data);
      setHistoryData(response.data);
    } catch (error: any) {
      console.error("❌ History yüklenirken hata:", error);
      setHistoryData(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  // History Dialog Kapat
  const handleCloseHistory = () => {
    setHistoryDialogOpen(false);
    setSelectedWorkflowForHistory(null);
    setHistoryData(null);
  };

  /**
   * WorkflowMyTasks handleWorkflowClick ile birebir aynı - satırdan alır
   */
  const handleWorkflowClick = async (row: any) => {
    try {
      const conf = getConfiguration();
      const workflowApi = new WorkFlowApi(conf);

      const workflowItemId = row.currentWorkflowItemId || row.workflowItemId || row.id;
      if (!workflowItemId) {
        alert("Görev detayı alınamadı: WorkflowItemId bulunamadı");
        return;
      }

      const response = await workflowApi.apiWorkFlowGetTaskDetailByWorkflowItemIdWorkflowitemWorkflowItemIdTaskDetailGet(workflowItemId);
      const taskDetail = response.data;

      const isFormTask = taskDetail.formItemId !== null && taskDetail.formItemId !== undefined;
      const isUserTask = taskDetail.approveItemId !== null && taskDetail.approveItemId !== undefined;
      const taskType = taskDetail.taskType || taskDetail.nodeType || "";
      const isFormTaskByType = taskType?.toLowerCase().includes("form") || taskDetail.nodeType?.toLowerCase() === "formtasknode";
      const isUserTaskByType = taskType?.toLowerCase().includes("user") || taskDetail.nodeType?.toLowerCase() === "usertasknode";
      const finalIsFormTask = isFormTask || (isFormTaskByType && !isUserTask);
      const finalIsUserTask = isUserTask || (isUserTaskByType && !isFormTask);

      const workflowInstanceId = taskDetail.workflowItemId || row.currentWorkflowItemId || row.workflowItemId || workflowItemId || row.id;
      const task = { ...row, workflowItemId, workflowHeadId: row.id };

      if (finalIsFormTask) {
        navigate(`/workflows/runtime/${workflowInstanceId}`, {
          state: {
            workflowInstance: {
              id: workflowInstanceId,
              workflowId: taskDetail.workflowHeadId || task.workflowHeadId || "",
              workflowName: task.workflowName || "İş Akışı",
              formId: taskDetail.formId || task.formId || "",
              formName: task.formName || "Form",
              taskId: taskDetail.formItemId || task.id,
              taskType: "formTask",
              formDesign: taskDetail.formDesign || task.formDesign,
              formData: taskDetail.formData,
              workflowItemId: taskDetail.workflowItemId || workflowItemId,
            },
            task: task,
            taskDetail: taskDetail,
          },
        });
      } else if (finalIsUserTask) {
        navigate(`/workflows/runtime/${workflowInstanceId}`, {
          state: {
            workflowInstance: {
              id: workflowInstanceId,
              workflowId: taskDetail.workflowHeadId || task.workflowHeadId || "",
              workflowName: task.workflowName || "İş Akışı",
              formId: taskDetail.formId || task.formId || "",
              formName: task.formName || "Kullanıcı Görevi",
              taskId: taskDetail.approveItemId || task.id,
              taskType: "userTask",
              workflowItemId: taskDetail.workflowItemId || workflowItemId,
              approveUser: taskDetail.approveUser,
              approveUserNameSurname: taskDetail.approveUserNameSurname,
              approverStatus: taskDetail.approverStatus,
            },
            task: task,
            taskDetail: taskDetail,
          },
        });
      } else {
        console.warn("Görev tipi belirlenemedi, varsayılan olarak runtime'a yönlendiriliyor");
        navigate(`/workflows/runtime/${workflowInstanceId}`, {
          state: {
            workflowInstance: {
              id: workflowInstanceId,
              workflowId: task.workflowHeadId || "",
              workflowName: task.workflowName || "İş Akışı",
              formId: task.formId || "",
              formName: task.formName || "Form",
              taskId: task.id,
              taskType: task.type,
              formDesign: task.formDesign,
            },
            task: task,
            taskDetail: taskDetail,
          },
        });
      }
    } catch (error: any) {
      console.error("Görev detayı çekilirken hata:", error);
      alert("Görev detayı alınamadı. Lütfen tekrar deneyin.");
    }
  };

  // Yeni talep oluştur - currentWorkflow'u kullan
  const handleNewRequest = async () => {
    console.log("🔵 Yeni Talep butonuna basıldı", {
      currentWorkflow: currentWorkflow?.label,
      hasWorkflowGuid: !!currentWorkflow?.workflowGuid,
      hasFormId: !!currentWorkflow?.formId,
    });

    if (!currentWorkflow) {
      console.error("❌ Workflow bulunamadı");
      alert("Workflow bulunamadı. Lütfen bir view seçin.");
      return;
    }

    if (!currentWorkflow.workflowGuid) {
      console.error("❌ Workflow GUID eksik");
      alert("Bu workflow için GUID tanımlanmamış");
      return;
    }

    try {
      const conf = getConfiguration();
      const workflowApi = new WorkFlowDefinationApi(conf);
      const formApi = new FormDataApi(conf);

      // ✅ Workflow detayını çek (initScript API'den dönüyor)
      const workflowDetail = await workflowApi.apiWorkFlowDefinationIdGet(currentWorkflow.workflowGuid);
      const workflowData = workflowDetail.data as any;

      let formId: string | null = workflowData?.formId || currentWorkflow.formId || null;
      let formName: string = "";
      
      // ✅ InitScript'i direkt API'den al (parse etmeye gerek yok)
      let initScript: string | null = workflowData?.initScript || null;

      console.log("✅ WorkFlowDefinationApi'den initScript alındı:", {
        hasInitScript: !!initScript,
        initScriptLength: initScript?.length || 0,
        initScriptPreview: initScript ? initScript.substring(0, 100) + "..." : "YOK",
      });

      // Eğer workflow'da formId yoksa, defination'dan bul
      if (!formId && workflowData?.defination) {
        try {
          const parsedDefination = JSON.parse(workflowData.defination);
          const formNode = parsedDefination.nodes?.find(
            (n: any) =>
              n.type === "formNode" &&
              (n.data?.selectedFormId || n.data?.formId)
          );
          
          if (formNode && (formNode.data?.selectedFormId || formNode.data?.formId)) {
            formId = formNode.data.selectedFormId || formNode.data.formId;
            formName =
              formNode.data.selectedFormName ||
              formNode.data.formName ||
              formNode.data.name ||
              "";
          }
        } catch (error) {
          console.warn("Defination parse edilemedi:", error);
        }
      }

      // Form bilgisini çek
      if (formId) {
        try {
          const formResponse = await formApi.apiFormDataIdGet(formId);
          formName = formResponse.data?.formName || formName;
        } catch (error) {
          console.warn(`Form ${formId} çekilemedi:`, error);
        }
      }

      if (!formId) {
        alert("Bu workflow için form tanımlanmamış!");
        return;
      }

      // ✅ Form sayfasına yönlendir
      navigate(`/workflows/runtime/new`, {
        state: {
          workflowInstance: {
            workflowId: currentWorkflow.workflowGuid,
            workflowName: currentWorkflow.label || "İş Akışı",
            formId: formId,
            formName: formName,
            defination: workflowData?.defination || null,
            initScript: initScript, // ✅ API'den gelen initScript (yeni workflow için)
          },
          isNewInstance: true,
        },
      });
      
      console.log("🚀 Yeni workflow başlatılıyor:", {
        workflowId: currentWorkflow.workflowGuid,
        workflowName: currentWorkflow.label,
        formId,
        formName,
        hasInitScript: !!initScript,
        initScriptLength: initScript?.length || 0,
      });
    } catch (error) {
      console.error("Workflow başlatılırken hata:", error);
      alert("Workflow başlatılırken bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };
  
  // Renk ve icon helper'ları
  const getCategoryColor = (index: number) => categoryColors[index % categoryColors.length];
  const currentCategoryIndex = menuData.findIndex((c) => c.id === selectedCategory);
  const currentColor = currentCategoryIndex >= 0 ? getCategoryColor(currentCategoryIndex) : categoryColors[0];

  // DataGrid kolonları - Minimal tasarım: Sadece gerekli bilgiler (detaylar zaten history'de görünüyor)
  const gridColumns: GridColDef[] = [
    {
      field: "formName",
      headerName: "Form Adı",
      flex: 1,
      minWidth: 250,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight={500}>
          {params.value || "Form Adı Yok"}
        </Typography>
      ),
    },
    {
      field: "currentNodeName",
      headerName: "Güncel Adım",
      width: 160,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value || "Başlangıç"}
          size="small"
          variant="outlined"
          color="primary"
        />
      ),
    },
    {
      field: "workFlowStatusText",
      headerName: "Durum",
      width: 140,
      renderCell: (params: GridRenderCellParams) => {
        const status = params.value || "Beklemede";
        const color = 
          status.includes("Tamamlan") || status.includes("Onaylan") ? "success" :
          status.includes("Red") || status.includes("İptal") ? "error" :
          status.includes("Bekl") ? "warning" : "default";
        
        return (
          <Chip
            label={status}
            size="small"
            color={color}
          />
        );
      },
    },
    {
      field: "createdDate",
      headerName: "Oluşturma Tarihi",
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="caption">
          {params.value ? new Date(params.value).toLocaleDateString("tr-TR") : "-"}
        </Typography>
      ),
    },
    {
      field: "actions",
      headerName: "İşlemler",
      width: 100,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Görüntüle">
            <IconButton 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                handleWorkflowClick(params.row);
              }}
            >
              <MuiIcons.Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Süreç Geçmişi">
            <IconButton 
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                // History dialog'unu aç
                if (params.row.id) {
                  setSelectedWorkflowForHistory(params.row);
                  handleOpenHistory(params.row.id);
                }
              }}
            >
              <MuiIcons.History fontSize="small" />
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
                  <Tooltip title={!currentWorkflow?.workflowGuid ? "Lütfen önce bir workflow seçin" : "Yeni talep oluştur"}>
                    <span>
                      <MDButton
                        variant="gradient"
                        color="info"
                        startIcon={<MuiIcons.Add />}
                        onClick={handleNewRequest}
                        disabled={!currentWorkflow?.workflowGuid}
                      >
                        Yeni Talep
                      </MDButton>
                    </span>
                  </Tooltip>
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
                    handleWorkflowClick(params.row);
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

        {/* History Dialog */}
        <Dialog
          open={historyDialogOpen}
          onClose={handleCloseHistory}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              maxHeight: "80vh",
            },
          }}
        >
          <DialogTitle
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: 1,
              py: 2,
            }}
          >
            <MuiIcons.History />
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Süreç Geçmişi
              </Typography>
              {selectedWorkflowForHistory && (
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  {selectedWorkflowForHistory.workflowName || selectedWorkflowForHistory.formName || "İş Akışı"}
                </Typography>
              )}
            </Box>
            <Box sx={{ flex: 1 }} />
            <IconButton
              onClick={handleCloseHistory}
              sx={{ color: "white" }}
              size="small"
            >
              <MuiIcons.Close />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ p: 2.5, mt: 1 }}>
            {historyLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
                <CircularProgress />
              </Box>
            ) : !historyData ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                Süreç geçmişi bulunamadı.
              </Alert>
            ) : (
              <Box>
                {/* Süreç Bilgileri - Compact Card */}
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 2.5, 
                    mb: 2.5, 
                    background: "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)",
                    border: "1px solid #e0e0e0",
                    borderRadius: 3 
                  }}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box 
                          sx={{ 
                            width: 36, 
                            height: 36, 
                            borderRadius: 2, 
                            bgcolor: "#667eea",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white"
                          }}
                        >
                          <MuiIcons.Work />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: "0.7rem" }}>
                            Workflow Adı
                          </Typography>
                          <Typography variant="body2" fontWeight={600} sx={{ fontSize: "0.9rem" }}>
                            {historyData.headInfo?.workflowName || "İş Akışı"}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box 
                          sx={{ 
                            width: 36, 
                            height: 36, 
                            borderRadius: 2, 
                            bgcolor: "#10b981",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white"
                          }}
                        >
                          <MuiIcons.Description />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: "0.7rem" }}>
                            Form Adı
                          </Typography>
                          <Typography variant="body2" fontWeight={600} sx={{ fontSize: "0.9rem" }}>
                            {historyData.headInfo?.formName || "-"}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} display="flex" alignItems="center" gap={0.5} sx={{ fontSize: "0.7rem" }}>
                          <MuiIcons.Person sx={{ fontSize: 14 }} />
                          Başlatan
                        </Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ mt: 0.25, fontSize: "0.8rem" }}>
                          {historyData.headInfo?.startedBy || "Bilinmiyor"}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} display="flex" alignItems="center" gap={0.5} sx={{ fontSize: "0.7rem" }}>
                          <MuiIcons.Schedule sx={{ fontSize: 14 }} />
                          Başlangıç Tarihi
                        </Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ mt: 0.25, fontSize: "0.8rem" }}>
                          {historyData.headInfo?.startedDate 
                            ? new Date(historyData.headInfo.startedDate).toLocaleDateString("tr-TR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "-"
                          }
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} display="flex" alignItems="center" gap={0.5} sx={{ fontSize: "0.7rem" }}>
                          <MuiIcons.Info sx={{ fontSize: 14 }} />
                          Durum
                        </Typography>
                        {(() => {
                          const status = (historyData.headInfo?.workFlowStatus || "")?.toLowerCase();
                          const statusText = (historyData.headInfo?.workFlowStatusText || "")?.toLowerCase();
                          
                          // WorkflowStatus enum: NotStarted, InProgress, Completed, Pending, SendBack
                          let icon, color, label;
                          
                          if (status === "completed" || statusText.includes("tamamlan")) {
                            icon = <MuiIcons.CheckCircle fontSize="small" />;
                            color = "#10b981";
                            label = "Tamamlandı";
                          } else if (status === "inprogress" || statusText.includes("devam")) {
                            icon = <MuiIcons.Autorenew fontSize="small" />;
                            color = "#3b82f6";
                            label = "Devam Ediyor";
                          } else if (status === "pending" || statusText.includes("bekle")) {
                            icon = <MuiIcons.Schedule fontSize="small" />;
                            color = "#f59e0b";
                            label = "Bekliyor";
                          } else if (status === "sendback" || statusText.includes("geri")) {
                            icon = <MuiIcons.ReplyAll fontSize="small" />;
                            color = "#ef4444";
                            label = "Geri Gönderildi";
                          } else {
                            icon = <MuiIcons.Circle fontSize="small" />;
                            color = "#9ca3af";
                            label = "Başlamadı";
                          }
                          
                          return (
                            <Chip
                              icon={icon}
                              label={historyData.headInfo?.workFlowStatusText || label}
                              size="medium"
                              sx={{ 
                                mt: 0.5, 
                                fontWeight: 600,
                                bgcolor: "white",
                                color: color,
                                border: `1.5px solid ${color}30`,
                                boxShadow: `0 2px 8px ${color}15`,
                                "& .MuiChip-icon": {
                                  color: color
                                }
                              }}
                            />
                          );
                        })()}
                      </Box>
                    </Grid>
                  </Grid>

           
                </Paper>

                {/* Süreç Adımları Timeline - Compact */}
                {historyData.historyItems && historyData.historyItems.length > 0 ? (
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight={600} sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: "0.95rem" }}>
                        <MuiIcons.Timeline sx={{ color: "#667eea", fontSize: 20 }} />
                        Süreç Geçmişi
                      </Typography>
                      <Chip 
                        label={`${historyData.totalItemCount || historyData.historyItems.length} Adım`}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: "0.7rem",
                          borderColor: "#667eea30",
                          color: "#667eea"
                        }}
                        variant="outlined"
                      />
                    </Box>
                    
                    {/* Custom Timeline - Compact & Modern */}
                    <Box sx={{ position: "relative" }}>
                      {/* Timeline Vertical Line - Subtle */}
                      <Box
                        sx={{
                          position: "absolute",
                          left: 17,
                          top: 10,
                          bottom: 10,
                          width: 2,
                          background: "linear-gradient(180deg, #f0f0f0 0%, #e8e8e8 100%)",
                          zIndex: 0,
                          borderRadius: 1,
                        }}
                      />
                      
                      {historyData.historyItems.map((item: any, index: number) => {
                        // WorkflowStatus enum: NotStarted, InProgress, Completed, Pending, SendBack
                        const status = item.nodeStatus?.toLowerCase() || "";
                        const statusText = item.nodeStatusText?.toLowerCase() || "";
                        
                        let stepColor, stepGradient, cardBg, statusIcon, statusLabel, statusColor;
                        
                        if (status === "completed" || statusText.includes("tamamlan")) {
                          // Completed - Soft Green
                          stepColor = "#10b981";
                          stepGradient = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
                          cardBg = "rgba(236, 253, 245, 0.6)";
                          statusIcon = <MuiIcons.CheckCircle fontSize="small" />;
                          statusLabel = "Tamamlandı";
                          statusColor = "#059669";
                        } else if (status === "inprogress" || statusText.includes("devam")) {
                          // InProgress - Soft Blue
                          stepColor = "#3b82f6";
                          stepGradient = "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)";
                          cardBg = "rgba(239, 246, 255, 0.6)";
                          statusIcon = <MuiIcons.Autorenew fontSize="small" />;
                          statusLabel = "Devam Ediyor";
                          statusColor = "#2563eb";
                        } else if (status === "pending" || statusText.includes("bekle")) {
                          // Pending - Soft Amber
                          stepColor = "#f59e0b";
                          stepGradient = "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)";
                          cardBg = "rgba(254, 243, 199, 0.6)";
                          statusIcon = <MuiIcons.Schedule fontSize="small" />;
                          statusLabel = "Bekliyor";
                          statusColor = "#d97706";
                        } else if (status === "sendback" || statusText.includes("geri")) {
                          // SendBack - Soft Red
                          stepColor = "#ef4444";
                          stepGradient = "linear-gradient(135deg, #f87171 0%, #ef4444 100%)";
                          cardBg = "rgba(254, 242, 242, 0.6)";
                          statusIcon = <MuiIcons.ReplyAll fontSize="small" />;
                          statusLabel = "Geri Gönderildi";
                          statusColor = "#dc2626";
                        } else {
                          // NotStarted - Soft Gray
                          stepColor = "#9ca3af";
                          stepGradient = "linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)";
                          cardBg = "rgba(249, 250, 251, 0.6)";
                          statusIcon = <MuiIcons.Circle fontSize="small" />;
                          statusLabel = "Başlamadı";
                          statusColor = "#6b7280";
                        }
                        
                        const isCompleted = status === "completed" || statusText.includes("tamamlan");
                        const isPending = status === "pending" || statusText.includes("bekle");
                        const isLast = index === historyData.historyItems.length - 1;
                        
                        return (
                          <Box 
                            key={item.id || index} 
                            sx={{ 
                              position: "relative", 
                              pl: 6,
                              pb: isLast ? 0 : 1.5,
                              zIndex: 1,
                            }}
                          >
                            {/* Timeline Icon Circle - Compact */}
                            <Box
                              sx={{
                                position: "absolute",
                                left: 0,
                                top: 4,
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                background: stepGradient,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                boxShadow: isPending 
                                  ? `0 0 0 3px ${stepColor}15, 0 3px 10px ${stepColor}20`
                                  : `0 2px 6px ${stepColor}15`,
                                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                                zIndex: 2,
                                backdropFilter: "blur(10px)",
                                border: `2px solid rgba(255, 255, 255, 0.9)`,
                                animation: isPending ? "softPulse 3s ease-in-out infinite" : "none",
                                "@keyframes softPulse": {
                                  "0%, 100%": {
                                    boxShadow: `0 0 0 3px ${stepColor}15, 0 3px 10px ${stepColor}20`,
                                    transform: "scale(1)",
                                  },
                                  "50%": {
                                    boxShadow: `0 0 0 5px ${stepColor}10, 0 4px 12px ${stepColor}15`,
                                    transform: "scale(1.05)",
                                  },
                                },
                              }}
                            >
                              <Box sx={{ fontSize: 18 }}>{statusIcon}</Box>
                            </Box>

                            {/* Content Card - Compact Glassmorphism */}
                            <Paper 
                              elevation={0}
                              sx={{ 
                                p: 2,
                                background: cardBg,
                                backdropFilter: "blur(20px)",
                                border: `1px solid ${stepColor}20`,
                                borderRadius: 2.5,
                                position: "relative",
                                overflow: "hidden",
                                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                                "&:hover": {
                                  transform: "translateX(4px)",
                                  background: `${cardBg}`,
                                  boxShadow: `0 4px 20px ${stepColor}12`,
                                  borderColor: `${stepColor}30`,
                                },
                                "&::before": {
                                  content: '""',
                                  position: "absolute",
                                  left: 0,
                                  top: 0,
                                  bottom: 0,
                                  width: 3,
                                  background: stepGradient,
                                  opacity: isPending ? 1 : 0.6,
                                  transition: "opacity 0.3s ease",
                                }
                              }}
                            >
                              {/* Header - Compact */}
                              <Box sx={{ mb: 1.5 }}>
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography 
                                      variant="subtitle1" 
                                      fontWeight={600} 
                                      sx={{ 
                                        color: "#1a1a1a",
                                        fontSize: "0.95rem",
                                        letterSpacing: "-0.01em",
                                        lineHeight: 1.3,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                      }}
                                    >
                                      {item.nodeName || `Adım ${index + 1}`}
                                    </Typography>
                                    
                                    {/* Task Type - Inline */}
                                    {(item.nodeType?.toLowerCase().includes("form") || 
                                      item.nodeType?.toLowerCase().includes("user") || 
                                      item.nodeType?.toLowerCase().includes("approval")) && (
                                      <Typography 
                                        variant="caption" 
                                        sx={{ 
                                          color: "text.disabled",
                                          fontSize: "0.7rem",
                                          display: "block",
                                          mt: 0.25
                                        }}
                                      >
                                        {item.nodeType?.toLowerCase().includes("form") ? "📝 Form Görevi" : "👤 Onay Görevi"}
                                      </Typography>
                                    )}
                                  </Box>
                                  
                                  {/* Minimal Status Badge */}
                                  <Chip
                                    icon={statusIcon}
                                    label={item.nodeStatusText || statusLabel}
                                    size="small"
                                    sx={{
                                      bgcolor: "white",
                                      color: statusColor,
                                      fontWeight: 600,
                                      fontSize: "0.7rem",
                                      height: 24,
                                      border: `1px solid ${stepColor}30`,
                                      boxShadow: `0 1px 3px ${stepColor}08`,
                                      "& .MuiChip-icon": {
                                        color: statusColor,
                                        fontSize: 14
                                      }
                                    }}
                                  />
                                </Box>
                              </Box>

                              {/* Kimde Bekliyor - Pending Users (Küçük kutucuklar) */}
                              {isPending && item.pendingWithUsers && item.pendingWithUsers.length > 0 && (
                                <Box
                                  sx={{
                                    mt: 1,
                                    p: 1,
                                    borderRadius: 1.5,
                                    bgcolor: "rgba(255,255,255,0.6)",
                                    border: `1px solid ${stepColor}25`,
                                  }}
                                >
                                  <Typography variant="caption" fontWeight={600} sx={{ fontSize: "0.65rem", color: statusColor, display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                                    <MuiIcons.PersonOutline sx={{ fontSize: 12 }} />
                                    Kimde bekliyor?
                                  </Typography>
                                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                    {item.pendingWithUsers.map((u: any, idx: number) => (
                                      <Tooltip
                                        key={u.userId || idx}
                                        title={`${u.userName} • ${u.position || "-"} • ${u.department || "-"}`}
                                        arrow
                                        placement="top"
                                      >
                                        <Box
                                          sx={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 0.5,
                                            px: 1,
                                            py: 0.35,
                                            borderRadius: 1,
                                            border: `1px solid ${stepColor}40`,
                                            bgcolor: "white",
                                            cursor: "default",
                                            transition: "background-color 0.2s",
                                            "&:hover": { bgcolor: `${stepColor}08` },
                                          }}
                                        >
                                          <MuiIcons.Person sx={{ fontSize: 12, color: statusColor }} />
                                          <Box sx={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                                            <Typography component="span" sx={{ fontWeight: 600, fontSize: "0.7rem" }}>
                                              {u.userName}
                                            </Typography>
                                            <Typography component="span" sx={{ fontSize: "0.6rem", color: "text.secondary" }}>
                                              {[u.position, u.department].filter(Boolean).join(" · ") || "-"}
                                            </Typography>
                                          </Box>
                                        </Box>
                                      </Tooltip>
                                    ))}
                                  </Box>
                                </Box>
                              )}

                              {/* Tarih Bilgileri - Ultra Compact */}
                              <Box 
                                sx={{ 
                                  display: "flex", 
                                  alignItems: "center",
                                  flexWrap: "wrap", 
                                  gap: 1.5,
                                  pt: 1.5,
                                  mt: 1.5,
                                  borderTop: "1px solid rgba(0,0,0,0.05)"
                                }}
                              >
                                {item.createdDate && (
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                    <MuiIcons.Schedule sx={{ fontSize: 14, color: stepColor, opacity: 0.7 }} />
                                    <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem" }}>
                                      {new Date(item.createdDate).toLocaleString("tr-TR", {
                                        day: "2-digit",
                                        month: "short",
                                        hour: "2-digit",
                                        minute: "2-digit"
                                      })}
                                    </Typography>
                                  </Box>
                                )}
                                {item.updatedDate && (
                                  <>
                                    <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.7rem" }}>
                                      →
                                    </Typography>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                      <MuiIcons.CheckCircleOutline sx={{ fontSize: 14, color: stepColor, opacity: 0.7 }} />
                                      <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem" }}>
                                        {new Date(item.updatedDate).toLocaleString("tr-TR", {
                                          day: "2-digit",
                                          month: "short",
                                          hour: "2-digit",
                                          minute: "2-digit"
                                        })}
                                      </Typography>
                                    </Box>
                                  </>
                                )}
                              </Box>
                            </Paper>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                ) : (
                  <Alert 
                    severity="info" 
                    icon={<MuiIcons.InfoOutlined />}
                    sx={{ borderRadius: 2 }}
                  >
                    Henüz süreç adımı bulunmamaktadır.
                  </Alert>
                )}
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid #e0e0e0" }}>
            <Button onClick={handleCloseHistory} variant="contained" color="primary">
              Kapat
            </Button>
          </DialogActions>
        </Dialog>
      </MDBox>
    </DashboardLayout>
  );
}
