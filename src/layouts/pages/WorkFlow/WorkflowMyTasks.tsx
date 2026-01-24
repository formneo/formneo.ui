import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Grid,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  Badge,
  LinearProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Assignment as AssignmentIcon,
  AccessTime as AccessTimeIcon,
  PlayArrow as PlayArrowIcon,
  AddCircle as AddCircleIcon,
  List as ListIcon,
  Search as SearchIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassEmptyIcon,
  TrendingUp as TrendingUpIcon,
  Inbox as InboxIcon,
  Speed as SpeedIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { DataGrid, GridColDef, GridRowParams } from "@mui/x-data-grid";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import { WorkFlowDefinationApi, FormDataApi, WorkFlowApi, UserApi, MyTasksDto, FormTaskItemDto, UserTaskItemDto, FormItemStatus, ApproverStatus, TaskFormDto } from "api/generated";
import getConfiguration from "confiuration";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

/**
 * ✅ Workflow Runtime - Kullanıcının Görevleri
 * 
 * Bu sayfa iki ana bölümden oluşur:
 * 
 * 1. DEVAM EDEN GÖREVLERİM:
 *    - Kullanıcıya atanmış devam eden workflow instance'ları
 *    - Form adı, workflow adı, durum, tarih bilgileri
 *    - Tıklayınca form açılır ve workflow devam eder
 * 
 * 2. YENİ SÜREÇ BAŞLAT:
 *    - Tüm tanımlı workflow'ları listeler
 *    - Form ile başlayan workflow'lar gösterilir
 *    - Tıklayınca yeni instance oluşturulur ve form açılır
 */

interface WorkflowTask {
  id: string;
  workflowItemId?: string;
  workflowHeadId?: string;
  shortId?: string | null;
  type: "formTask" | "userTask";
  formId?: string | null;
  formName?: string;
  workflowName?: string;
  message?: string | null;
  status: "pending" | "in-progress" | "completed" | "cancelled";
  createdDate?: string;
  uniqNumber?: number;
  // FormTask için
  formDesign?: string | null;
  formTaskMessage?: string | null;
  formDescription?: string | null;
  formUser?: string | null; // FormTask için sürecin kimin üzerinde olduğu
  formUserNameSurname?: string | null; // FormTask için sürecin kimin üzerinde olduğu (isim)
  // UserTask için
  approveUser?: string | null;
  approveUserNameSurname?: string | null;
}

function WorkflowMyTasks() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0); // 0: Süreç Takibi, 1: Onay Listem
  const [workflowTasks, setWorkflowTasks] = useState<WorkflowTask[]>([]);
  const [availableWorkflows, setAvailableWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingWorkflows, setLoadingWorkflows] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "in-progress" | "completed">("all");
  const [workflowSearchQuery, setWorkflowSearchQuery] = useState("");
  
  // Dashboard Metrikleri
  const startedCount = workflowTasks.length;
  const inProgressCount = workflowTasks.filter(t => t.status === "in-progress").length;
  const pendingCount = workflowTasks.filter(t => t.status === "pending").length;

  useEffect(() => {
    if (activeTab === 0) {
      fetchWorkflowInstances();
    } else {
      fetchAvailableWorkflows();
    }
  }, [activeTab]);

  /**
   * ✅ Kullanıcıya atanmış workflow görevlerini çek
   * /api/WorkFlow/GetMyTasks/my-tasks endpoint'ini kullanır
   */
  const fetchWorkflowInstances = async () => {
    setLoading(true);
    try {
      const conf = getConfiguration();
      const workflowApi = new WorkFlowApi(conf);

      // ✅ API'den kullanıcının görevlerini çek
      const response = await workflowApi.apiWorkFlowGetMyTasksMyTasksGet();
      const myTasks: MyTasksDto = response.data || {};

      const tasks: WorkflowTask[] = [];

      // FormTask'ları ekle
      if (myTasks.formTasks && Array.isArray(myTasks.formTasks)) {
        myTasks.formTasks.forEach((formTask: FormTaskItemDto) => {
          // FormItemStatus: 0=Pending, 1=InProgress, 2=Completed
          let status: "pending" | "in-progress" | "completed" | "cancelled" = "pending";
          if (formTask.formItemStatus === FormItemStatus.NUMBER_2) {
            status = "completed";
          } else if (formTask.formItemStatus === FormItemStatus.NUMBER_1) {
            status = "in-progress";
          } else {
            status = "pending";
          }

          // FormTask için form bilgisi - workFlowHead yoksa formTask'tan al
          const formTaskFormId = formTask.formId || null;
          // workFlowHead varsa ondan al, yoksa formTask'tan al
          const formTaskFormName = formTask.workFlowHead?.workFlowDefination?.form?.formName || 
                                  formTask.formDescription || 
                                  formTask.formTaskMessage || 
                                  "Form Görevi";
          const workflowName = formTask.workFlowHead?.workflowName || "İş Akışı";
          
          // ✅ FormTask için sürecin kimin üzerinde olduğu bilgisi
          // NOT: Backend'de FormTaskItemDto'ya formUser/formUserNameSurname eklenirse buraya eklenecek
          // Şimdilik workFlowHead.createUser kullanılıyor (workflow'u oluşturan kullanıcı)
          const formUser = (formTask as any).formUser || 
                          formTask.workFlowHead?.createUser || 
                          null;
          const formUserNameSurname = (formTask as any).formUserNameSurname || null;

          tasks.push({
            id: formTask.id || "",
            workflowItemId: formTask.workflowItemId,
            workflowHeadId: formTask.workflowHeadId,
            shortId: formTask.shortId,
            type: "formTask",
            formId: formTaskFormId,
            formName: formTaskFormName,
            workflowName: workflowName,
            message: formTask.formTaskMessage || formTask.formDescription || null,
            status,
            createdDate: formTask.createdDate,
            uniqNumber: formTask.uniqNumber,
            formDesign: formTask.formDesign,
            formTaskMessage: formTask.formTaskMessage,
            formDescription: formTask.formDescription,
            formUser: formUser,
            formUserNameSurname: formUserNameSurname,
          });
        });
      }

      // UserTask'ları ekle
      if (myTasks.userTasks && Array.isArray(myTasks.userTasks)) {
        myTasks.userTasks.forEach((userTask: UserTaskItemDto) => {
          // ApproverStatus: 0=Pending, 1=InProgress, 2=Approved, 3=Rejected
          let status: "pending" | "in-progress" | "completed" | "cancelled" = "pending";
          if (userTask.approverStatus === ApproverStatus.NUMBER_2 || userTask.approverStatus === ApproverStatus.NUMBER_3) {
            status = "completed";
          } else if (userTask.approverStatus === ApproverStatus.NUMBER_1) {
            status = "in-progress";
          } else {
            status = "pending";
          }

          // UserTask için form bilgisi - workFlowHead yoksa varsayılan değerler kullan
          const formId = userTask.workFlowHead?.workFlowDefination?.formId || null;
          const formName = userTask.workFlowHead?.workFlowDefination?.form?.formName || 
                          "Kullanıcı Görevi";
          const workflowName = userTask.workFlowHead?.workflowName || "İş Akışı";

          tasks.push({
            id: userTask.id || "",
            workflowItemId: userTask.workflowItemId,
            workflowHeadId: userTask.workflowHeadId,
            shortId: userTask.shortId,
            type: "userTask",
            formId: formId,
            formName: formName,
            workflowName: workflowName,
            message: null,
            status,
            createdDate: userTask.createdDate,
            uniqNumber: userTask.uniqNumber,
            approveUser: userTask.approveUser,
            approveUserNameSurname: userTask.approveUserNameSurname,
          });
        });
      }

      setWorkflowTasks(tasks);
    } catch (error) {
      console.error("Workflow görevleri çekilirken hata:", error);
      setWorkflowTasks([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * ✅ Mevcut workflow'ları çek (yeni süreç başlatmak için)
   * 
   * Workflow tablosundaki tüm workflow'ları listeler.
   * Sadece temel bilgileri çeker, detay tıklayınca çekilecek.
   */
  const fetchAvailableWorkflows = async () => {
    setLoadingWorkflows(true);
    try {
      const conf = getConfiguration();
      const workflowApi = new WorkFlowDefinationApi(conf);

      // ✅ Sadece temel workflow listesini çek (defination çekilmiyor)
      const workflowsResponse = await workflowApi.apiWorkFlowDefinationGet();
      const workflows = workflowsResponse.data || [];

      console.log("📋 Toplam workflow sayısı:", workflows.length);

      // Sadece temel bilgileri döndür (formId ve formName tıklayınca çekilecek)
      const workflowsList = workflows.map((workflow: any) => ({
          id: workflow.id,
          workflowName: workflow.workflowName || "İsimsiz Workflow",
        formId: null as string | null, // Tıklayınca çekilecek
        formName: null as string | null, // Tıklayınca çekilecek
        hasForm: null as boolean | null, // Tıklayınca belirlenecek
      }));

      console.log(`📊 Toplam ${workflowsList.length} workflow listelendi`);
      setAvailableWorkflows(workflowsList);
    } catch (error) {
      console.error("Workflow'lar çekilirken hata:", error);
    } finally {
      setLoadingWorkflows(false);
    }
  };

  /**
   * ✅ Devam eden workflow görevine tıklandığında API'den detay çek ve form/userTask göster
   */
  const handleWorkflowClick = async (task: WorkflowTask) => {
    try {
      const conf = getConfiguration();
      const workflowApi = new WorkFlowApi(conf);

      // workflowItemId'yi al (task'tan veya id'den)
      const workflowItemId = task.workflowItemId || task.id;
      
      if (!workflowItemId) {
        console.error("WorkflowItemId bulunamadı");
        alert("Görev detayı alınamadı: WorkflowItemId bulunamadı");
        return;
      }

      // ✅ API'den görev detayını çek
      const response = await workflowApi.apiWorkFlowGetTaskDetailByWorkflowItemIdWorkflowitemWorkflowItemIdTaskDetailGet(workflowItemId);
      const taskDetail: TaskFormDto = response.data;

      console.log("✅ Görev detayı alındı:", taskDetail);

      // ✅ taskType veya nodeType'a göre formTask mı userTask mı belirle
      const isFormTask = taskDetail.formItemId !== null && taskDetail.formItemId !== undefined;
      const isUserTask = taskDetail.approveItemId !== null && taskDetail.approveItemId !== undefined;
      
      // Alternatif olarak taskType veya nodeType'a bak
      const taskType = taskDetail.taskType || taskDetail.nodeType || "";
      const isFormTaskByType = taskType?.toLowerCase().includes("form") || taskDetail.nodeType?.toLowerCase() === "formtasknode";
      const isUserTaskByType = taskType?.toLowerCase().includes("user") || taskDetail.nodeType?.toLowerCase() === "usertasknode";

      // Son karar: önce itemId'lere bak, yoksa type'a bak
      const finalIsFormTask = isFormTask || (isFormTaskByType && !isUserTask);
      const finalIsUserTask = isUserTask || (isUserTaskByType && !isFormTask);

      // ✅ workflowItemId kullanılmalı (workflowHeadId değil)
      const workflowInstanceId = taskDetail.workflowItemId || task.workflowItemId || workflowItemId || task.id;

      // ✅ FormTask ise runtime sayfasına yönlendir
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
      } 
      // ✅ UserTask ise userTask sayfasına yönlendir (veya runtime'da userTask göster)
      else if (finalIsUserTask) {
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
      } 
      // ✅ Belirlenemezse runtime'a git (mevcut mantık)
      else {
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
    } catch (error) {
      console.error("Görev detayı çekilirken hata:", error);
      alert("Görev detayı alınamadı. Lütfen tekrar deneyin.");
    }
  };

  /**
   * ✅ Yeni workflow için form göster
   * 
   * Tıklayınca workflow detayını çeker, formId'yi bulur ve başlatır.
   */
  const handleStartNewWorkflow = async (workflow: any) => {
    try {
      const conf = getConfiguration();
      const workflowApi = new WorkFlowDefinationApi(conf);
      const formApi = new FormDataApi(conf);

      // ✅ Workflow detayını çek (defination dahil)
      const workflowDetail = await workflowApi.apiWorkFlowDefinationIdGet(workflow.id);
      const workflowData = workflowDetail.data as any;
      
      let formId: string | null = workflowData?.formId || null;
      let formName: string = "";

      // Eğer workflow'da formId yoksa, defination'dan node'lardan bul
      if (!formId && workflowData?.defination) {
        try {
          const parsedDefination = JSON.parse(workflowData.defination);
          const formNode = parsedDefination.nodes?.find(
            (n: any) =>
              n.type === "formNode" &&
              (n.data?.selectedFormId || n.data?.formId)
          );
          if (formNode?.data?.selectedFormId || formNode?.data?.formId) {
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
          workflowId: workflow.id,
          workflowName: workflow.workflowName,
          formId: formId,
          formName: formName,
          defination: workflowData?.defination || null, // ✅ Defination'ı da gönder
        },
        isNewInstance: true,
      },
    });
    } catch (error) {
      console.error("Workflow başlatılırken hata:", error);
      alert("Workflow başlatılırken bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  /**
   * ✅ Durum rengi
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "warning";
      case "in-progress":
        return "info";
      case "completed":
        return "success";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  /**
   * ✅ Durum metni
   */
  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Beklemede";
      case "in-progress":
        return "Devam Ediyor";
      case "completed":
        return "Tamamlandı";
      case "cancelled":
        return "İptal Edildi";
      default:
        return status;
    }
  };

  /**
   * ✅ Filtrelenmiş görevler
   */
  const filteredTasks =
    filter === "all"
      ? workflowTasks
      : workflowTasks.filter((task) => task.status === filter);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={0} pb={2} px={3}>
        {/* Modern Header - Kompakt */}
        <Box 
          sx={{ 
            mb: 2,
            mt: -2,
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            background: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
            padding: 1.5,
            borderRadius: 2,
            boxShadow: "0 2px 12px rgba(37, 99, 235, 0.25)",
          }}
        >
          <Box>
            <Typography 
              variant="h6" 
              fontWeight={700} 
              sx={{ 
                color: "#ffffff", 
                mb: 0,
                textShadow: "0 2px 4px rgba(0,0,0,0.2)",
              }}
            >
              İş Süreci Yönetimi
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: "#ffffff",
                fontWeight: 500,
                textShadow: "0 1px 3px rgba(0,0,0,0.2)",
                display: "block",
                mt: 0.25,
              }}
            >
              Süreçlerinizi takip edin ve yeni iş akışları başlatın
            </Typography>
          </Box>
          <MDButton
            variant="contained"
            color="white"
            size="small"
            startIcon={<AddCircleIcon sx={{ fontSize: 18 }} />}
            onClick={() => setActiveTab(1)}
            sx={{
              bgcolor: "white",
              color: "#2563eb",
              fontWeight: 700,
              px: 2,
              py: 0.75,
              fontSize: "0.813rem",
              borderRadius: 1.5,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              "&:hover": {
                bgcolor: "#f8fafc",
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              },
              transition: "all 0.2s ease",
            }}
          >
            Yeni Süreç Başlat
          </MDButton>
        </Box>

        {/* Dashboard Özet Kartları - Kompakt */}
        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          {/* Başlatılan Süreç Sayısı */}
          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                borderRadius: 2,
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                border: "1px solid #e2e8f0",
                transition: "all 0.2s ease",
                "&:hover": {
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.12)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <CardContent sx={{ py: 2, px: 2.5 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="caption" color="textSecondary" sx={{ mb: 0.5, fontWeight: 500, display: "block" }}>
                      Başlatılan Süreçler
                    </Typography>
                    <Typography variant="h4" fontWeight={700} sx={{ color: "#2563eb", mb: 0.25 }}>
                      {startedCount}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#10b981", display: "flex", alignItems: "center", gap: 0.5, fontSize: "0.7rem" }}>
                      <TrendingUpIcon sx={{ fontSize: 12 }} />
                      Toplam süreç
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
                    }}
                  >
                    <PlayArrowIcon sx={{ fontSize: 28, color: "#2563eb" }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Devam Eden İşler */}
          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                borderRadius: 2,
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                border: "1px solid #fef3c7",
                transition: "all 0.2s ease",
                "&:hover": {
                  boxShadow: "0 4px 12px rgba(245, 158, 11, 0.12)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <CardContent sx={{ py: 2, px: 2.5 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="caption" color="textSecondary" sx={{ mb: 0.5, fontWeight: 500, display: "block" }}>
                      Devam Eden İşler
                    </Typography>
                    <Typography variant="h4" fontWeight={700} sx={{ color: "#f59e0b", mb: 0.25 }}>
                      {inProgressCount}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#f59e0b", display: "flex", alignItems: "center", gap: 0.5, fontSize: "0.7rem" }}>
                      <SpeedIcon sx={{ fontSize: 12 }} />
                      Aktif süreçler
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                    }}
                  >
                    <HourglassEmptyIcon sx={{ fontSize: 28, color: "#f59e0b" }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Bekleyen Görevler */}
          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                borderRadius: 2,
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                border: "1px solid #fecdd3",
                transition: "all 0.2s ease",
                "&:hover": {
                  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.12)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <CardContent sx={{ py: 2, px: 2.5 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="caption" color="textSecondary" sx={{ mb: 0.5, fontWeight: 500, display: "block" }}>
                      Bekleyen Görevler
                    </Typography>
                    <Typography variant="h4" fontWeight={700} sx={{ color: "#ef4444", mb: 0.25 }}>
                      {pendingCount}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#ef4444", display: "flex", alignItems: "center", gap: 0.5, fontSize: "0.7rem" }}>
                      <InboxIcon sx={{ fontSize: 12 }} />
                      Onay bekliyor
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "linear-gradient(135deg, #fecdd3 0%, #fca5a5 100%)",
                    }}
                  >
                    <AssignmentIcon sx={{ fontSize: 28, color: "#ef4444" }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Modern Tab Navigasyonu - Kompakt */}
        <Box sx={{ borderBottom: 2, borderColor: "#e2e8f0", mb: 2.5 }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              minHeight: "unset",
              "& .MuiTabs-indicator": {
                backgroundColor: "#2563eb",
                height: 3,
                borderRadius: "3px 3px 0 0",
              },
            }}
          >
            <Tab
              icon={<ListIcon sx={{ fontSize: 20 }} />}
              iconPosition="start"
              label="Süreç Takibi (Benim Başlattıklarım)"
              sx={{ 
                textTransform: "none", 
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#64748b",
                minHeight: "unset",
                "&.Mui-selected": {
                  color: "#2563eb",
                },
                px: 2.5,
                py: 1.5,
              }}
            />
            <Tab
              icon={
                <Badge 
                  badgeContent={pendingCount} 
                  color="error"
                  sx={{
                    "& .MuiBadge-badge": {
                      fontSize: "0.65rem",
                      height: 16,
                      minWidth: 16,
                      fontWeight: 700,
                    },
                  }}
                >
                  <InboxIcon sx={{ fontSize: 20 }} />
                </Badge>
              }
              iconPosition="start"
              label="Onay Listem (Inbox)"
              sx={{ 
                textTransform: "none", 
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#64748b",
                minHeight: "unset",
                "&.Mui-selected": {
                  color: "#2563eb",
                },
                px: 2.5,
                py: 1.5,
              }}
            />
          </Tabs>
        </Box>

        {/* Süreç Takibi Sekmesi */}
        {activeTab === 0 && (
          <>
            {/* Modern Filtreler */}
            <Box sx={{ mb: 2, display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              <Chip
                label="Tümü"
                onClick={() => setFilter("all")}
                sx={{
                  bgcolor: filter === "all" ? "#2563eb" : "#f1f5f9",
                  color: filter === "all" ? "white" : "#64748b",
                  fontWeight: 600,
                  px: 2,
                  "&:hover": {
                    bgcolor: filter === "all" ? "#1e40af" : "#e2e8f0",
                  },
                }}
                clickable
              />
              <Chip
                label="Beklemede"
                onClick={() => setFilter("pending")}
                icon={<HourglassEmptyIcon sx={{ fontSize: 18, color: filter === "pending" ? "white" : "#f59e0b" }} />}
                sx={{
                  bgcolor: filter === "pending" ? "#f59e0b" : "#fef3c7",
                  color: filter === "pending" ? "white" : "#92400e",
                  fontWeight: 600,
                  px: 2,
                  "&:hover": {
                    bgcolor: filter === "pending" ? "#d97706" : "#fde68a",
                  },
                }}
                clickable
              />
              <Chip
                label="Devam Ediyor"
                onClick={() => setFilter("in-progress")}
                icon={<SpeedIcon sx={{ fontSize: 18, color: filter === "in-progress" ? "white" : "#3b82f6" }} />}
                sx={{
                  bgcolor: filter === "in-progress" ? "#3b82f6" : "#dbeafe",
                  color: filter === "in-progress" ? "white" : "#1e3a8a",
                  fontWeight: 600,
                  px: 2,
                  "&:hover": {
                    bgcolor: filter === "in-progress" ? "#2563eb" : "#bfdbfe",
                  },
                }}
                clickable
              />
              <Chip
                label="Tamamlandı"
                onClick={() => setFilter("completed")}
                icon={<CheckCircleIcon sx={{ fontSize: 18, color: filter === "completed" ? "white" : "#10b981" }} />}
                sx={{
                  bgcolor: filter === "completed" ? "#10b981" : "#d1fae5",
                  color: filter === "completed" ? "white" : "#065f46",
                  fontWeight: 600,
                  px: 2,
                  "&:hover": {
                    bgcolor: filter === "completed" ? "#059669" : "#a7f3d0",
                  },
                }}
                clickable
              />
            </Box>

            {/* Modern Workflow Görev Listesi */}
            <Card 
              sx={{ 
                borderRadius: 2,
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                border: "1px solid #e2e8f0",
              }}
            >
              <CardContent sx={{ py: 2 }}>
                <div style={{ height: 500, width: "100%" }}>
                  <DataGrid
                    rows={filteredTasks}
                    columns={[
                      {
                        field: "formName",
                        headerName: "Süreç Adı",
                        width: 250,
                        flex: 1,
                        renderCell: (params) => (
                          <Box>
                            <Typography variant="body2" fontWeight={700} sx={{ color: "#1e293b", mb: 0.5 }}>
                            {params.value || "Görev"}
                  </Typography>
                            <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.75rem" }}>
                              {params.row.workflowName}
                            </Typography>
                          </Box>
                        ),
                      },
                      {
                        field: "shortId",
                        headerName: "Süreç ID",
                        width: 120,
                        renderCell: (params) => (
                              <Chip 
                            label={params.value || "-"}
                                size="small" 
                            sx={{
                              bgcolor: "#f1f5f9",
                              color: "#475569",
                              fontWeight: 600,
                              fontFamily: "monospace",
                            }}
                          />
                        ),
                      },
                      {
                        field: "status",
                        headerName: "Şu Anki Adım & Durum",
                        width: 220,
                        flex: 1,
                        renderCell: (params) => {
                          const statusConfig = {
                            "pending": { 
                              color: "#f59e0b", 
                              bg: "#fef3c7", 
                              text: "Beklemede",
                              icon: <HourglassEmptyIcon sx={{ fontSize: 16 }} />,
                              progress: 25
                            },
                            "in-progress": { 
                              color: "#3b82f6", 
                              bg: "#dbeafe", 
                              text: "Devam Ediyor",
                              icon: <SpeedIcon sx={{ fontSize: 16 }} />,
                              progress: 60
                            },
                            "completed": { 
                              color: "#10b981", 
                              bg: "#d1fae5", 
                              text: "Tamamlandı",
                              icon: <CheckCircleIcon sx={{ fontSize: 16 }} />,
                              progress: 100
                            },
                            "cancelled": { 
                              color: "#ef4444", 
                              bg: "#fecdd3", 
                              text: "İptal",
                              icon: <InfoIcon sx={{ fontSize: 16 }} />,
                              progress: 0
                            },
                          };
                          const config = statusConfig[params.value as keyof typeof statusConfig] || statusConfig["pending"];
                          
                          return (
                            <Box sx={{ width: "100%" }}>
                              <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                                {config.icon}
                                <Typography 
                                  variant="caption" 
                                  fontWeight={600}
                                  sx={{ color: config.color }}
                                >
                                  {config.text}
                              </Typography>
                          </Box>
                              <LinearProgress
                                variant="determinate"
                                value={config.progress}
                                sx={{
                                  height: 6,
                                  borderRadius: 3,
                                  bgcolor: config.bg,
                                  "& .MuiLinearProgress-bar": {
                                    bgcolor: config.color,
                                    borderRadius: 3,
                                  },
                                }}
                              />
                            </Box>
                          );
                        },
                      },
                      {
                        field: "createdDate",
                        headerName: "Tarih",
                        width: 160,
                        renderCell: (params) =>
                          params.value ? (
                            <Box>
                              <Typography variant="body2" fontWeight={600} sx={{ color: "#475569" }}>
                                {format(new Date(params.value), "dd MMM yyyy", { locale: tr })}
                              </Typography>
                              <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                                {format(new Date(params.value), "HH:mm", { locale: tr })}
                            </Typography>
                          </Box>
                          ) : (
                            "-"
                          ),
                      },
                      {
                        field: "actions",
                        headerName: "Hızlı İşlemler",
                        width: 200,
                        sortable: false,
                        renderCell: (params) => (
                          <Box display="flex" gap={1}>
                            <Tooltip title="Detayları Görüntüle">
                        <MDButton
                          variant="gradient"
                          color="info"
                            size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                              handleWorkflowClick(params.row);
                          }}
                                sx={{
                                  minWidth: "auto",
                                  px: 2,
                                  py: 0.75,
                                  fontWeight: 600,
                                  fontSize: "0.75rem",
                                  borderRadius: 2,
                                  textTransform: "none",
                                  boxShadow: "none",
                                  "&:hover": {
                                    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
                                    transform: "translateY(-2px)",
                                  },
                                  transition: "all 0.2s ease",
                                }}
                              >
                                {params.row.type === "formTask" ? "Detay" : "Onayla"}
                        </MDButton>
                            </Tooltip>
                            <Tooltip title="Bilgi">
                              <IconButton
                                size="small"
                                sx={{
                                  bgcolor: "#f1f5f9",
                                  "&:hover": {
                                    bgcolor: "#e2e8f0",
                                  },
                                }}
                              >
                                <InfoIcon sx={{ fontSize: 18, color: "#64748b" }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        ),
                      },
                    ]}
                    loading={loading}
                    onRowClick={(params: GridRowParams) => handleWorkflowClick(params.row)}
                    pageSizeOptions={[10, 25, 50, 100]}
                    initialState={{
                      pagination: {
                        paginationModel: { pageSize: 25 },
                      },
                    }}
                    sx={{
                      border: "none",
                      "& .MuiDataGrid-columnHeaders": {
                        bgcolor: "#f8fafc",
                        borderRadius: 2,
                        borderBottom: "2px solid #e2e8f0",
                        "& .MuiDataGrid-columnHeaderTitle": {
                          fontWeight: 700,
                          color: "#1e293b",
                          fontSize: "0.875rem",
                        },
                      },
                      "& .MuiDataGrid-row": {
                        borderBottom: "1px solid #f1f5f9",
                        "&:hover": {
                        cursor: "pointer",
                          bgcolor: "#f8fafc",
                          transform: "scale(1.001)",
                        },
                        "&.Mui-selected": {
                          bgcolor: "#eff6ff !important",
                          "&:hover": {
                            bgcolor: "#dbeafe !important",
                          },
                        },
                      },
                      "& .MuiDataGrid-cell": {
                        borderBottom: "none",
                        py: 2,
                        "&:focus": {
                        outline: "none",
                        },
                      },
                      "& .MuiDataGrid-footerContainer": {
                        borderTop: "2px solid #e2e8f0",
                        bgcolor: "#f8fafc",
                      },
                      "& .MuiTablePagination-root": {
                        color: "#64748b",
                      },
                    }}
                    localeText={{
                      noRowsLabel: "📋 Henüz süreç bulunamadı",
                      noResultsOverlayLabel: "Arama sonucu bulunamadı",
                      MuiTablePagination: {
                        labelRowsPerPage: "Sayfa başına:",
                      },
                    }}
                  />
                </div>
              </CardContent>
                    </Card>
          </>
        )}

        {/* Onay Listem Sekmesi */}
        {activeTab === 1 && (
          <>
            {/* Modern Arama Kutusu */}
            <Card 
              sx={{ 
                mb: 2,
                borderRadius: 2,
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                border: "1px solid #e2e8f0",
              }}
            >
              <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                <TextField
                  fullWidth
                  placeholder="İş akışı ara... (örn: Satın Alma, İzin Talebi)"
                  value={workflowSearchQuery}
                  onChange={(e) => setWorkflowSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: "#64748b", fontSize: 24 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      bgcolor: "#f8fafc",
                      "& fieldset": {
                        border: "2px solid transparent",
                      },
                      "&:hover fieldset": {
                        border: "2px solid #cbd5e1",
                      },
                      "&.Mui-focused fieldset": {
                        border: "2px solid #2563eb",
                      },
                      "& input": {
                        fontSize: "1rem",
                        fontWeight: 500,
                        color: "#1e293b",
                      },
                    },
                  }}
                />
              </CardContent>
            </Card>

            {/* Modern Workflow Listesi */}
            {loadingWorkflows ? (
              <Card 
                sx={{ 
                  borderRadius: 2,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                }}
              >
                <CardContent sx={{ textAlign: "center", py: 5 }}>
                  <Box sx={{ display: "inline-block" }}>
                    <SpeedIcon sx={{ fontSize: 48, color: "#2563eb", mb: 1.5 }} />
                  </Box>
                  <Typography variant="body1" fontWeight={600} sx={{ color: "#1e293b" }}>
                    Yükleniyor...
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b", mt: 0.5 }}>
                    İş akışları getiriliyor
                  </Typography>
                </CardContent>
              </Card>
            ) : availableWorkflows.length === 0 ? (
              <Card 
                sx={{ 
                  borderRadius: 2,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  border: "2px dashed #cbd5e1",
                }}
              >
                <CardContent sx={{ textAlign: "center", py: 5 }}>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: 3,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "#f1f5f9",
                      margin: "0 auto",
                      mb: 2,
                    }}
                  >
                    <AddCircleIcon sx={{ fontSize: 40, color: "#94a3b8" }} />
                  </Box>
                  <Typography variant="body1" fontWeight={600} sx={{ color: "#475569", mb: 0.5 }}>
                    İş Akışı Bulunamadı
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b" }}>
                    Başlatılabilecek aktif iş akışı bulunmamaktadır.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Card 
                sx={{ 
                  borderRadius: 2,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  border: "1px solid #e2e8f0",
                  overflow: "hidden",
                }}
              >
                <CardContent sx={{ p: 0 }}>
                  <List>
                    {(() => {
                      const filteredWorkflows = availableWorkflows.filter((workflow) => {
                        if (!workflowSearchQuery.trim()) return true;
                        const query = workflowSearchQuery.toLowerCase();
                        return (
                          workflow.workflowName?.toLowerCase().includes(query) ||
                          workflow.formName?.toLowerCase().includes(query)
                        );
                      });

                      if (filteredWorkflows.length === 0) {
                        return (
                          <Box sx={{ textAlign: "center", py: 4 }}>
                            <Typography variant="body2" color="textSecondary">
                              Arama sonucu bulunamadı
                            </Typography>
                          </Box>
                        );
                      }

                      return filteredWorkflows.map((workflow, index) => (
                        <React.Fragment key={workflow.id}>
                          <ListItem
                            disablePadding
                      sx={{
                              position: "relative",
                              "&:hover": {
                                bgcolor: "#f8fafc",
                                "&::before": {
                                  opacity: 1,
                                },
                              },
                              "&::before": {
                                content: '""',
                                position: "absolute",
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: 5,
                                bgcolor: "#2563eb",
                                opacity: 0,
                                transition: "all 0.3s ease",
                                borderRadius: "0 4px 4px 0",
                              },
                            }}
                          >
                            <ListItemButton
                              onClick={() => handleStartNewWorkflow(workflow)}
                              sx={{
                                py: 2,
                                px: 3,
                                transition: "all 0.3s ease",
                                "&:hover": {
                                  bgcolor: "transparent",
                                  pl: 3.5,
                                },
                              }}
                            >
                              {/* İkon Container */}
                              <ListItemIcon sx={{ minWidth: 60 }}>
                                <Box
                                  sx={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 2,
                        display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
                                    transition: "all 0.3s ease",
                                    boxShadow: "0 1px 4px rgba(37, 99, 235, 0.15)",
                        "&:hover": {
                                      transform: "rotate(5deg) scale(1.05)",
                                      boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
                                    },
                                  }}
                                >
                                  <PlayArrowIcon
                                    sx={{
                                      color: "#2563eb",
                                      fontSize: 24,
                                    }}
                                  />
                                </Box>
                              </ListItemIcon>

                              {/* İçerik */}
                              <ListItemText
                                primary={
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1.5,
                                      mb: 0.5,
                                    }}
                                  >
                                    <Typography
                                      variant="body1"
                                      fontWeight={700}
                                      sx={{
                                        color: "#1e293b",
                                        fontSize: "1rem",
                                      }}
                                    >
                              {workflow.workflowName}
                            </Typography>
                          <Chip 
                              label="Başlatılabilir"
                            size="small" 
                                      icon={<CheckCircleIcon sx={{ fontSize: 12 }} />}
                              sx={{
                                        height: 20,
                                        bgcolor: "#d1fae5",
                                        color: "#065f46",
                                        fontSize: "0.65rem",
                                        fontWeight: 700,
                                "& .MuiChip-label": {
                                  px: 1,
                                },
                                        "& .MuiChip-icon": {
                                          color: "#10b981",
                                        },
                              }}
                          />
                        </Box>
                                }
                                secondary={
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.25 }}>
                                  <Typography
                                      variant="caption"
                                    sx={{
                                        color: "#64748b",
                                        fontSize: "0.75rem",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                    }}
                                  >
                                      <InfoIcon sx={{ fontSize: 14 }} />
                                      Yeni süreç başlatmak için tıklayın
                        </Typography>
                                  </Box>
                                }
                              />

                              {/* Aksiyon Butonu */}
                              <Box sx={{ ml: 1.5 }}>
                        <MDButton
                          variant="gradient"
                                  color="info"
                                  size="medium"
                                  startIcon={<AddCircleIcon sx={{ fontSize: 18 }} />}
                          onClick={(e) => {
                            e.stopPropagation();
                              handleStartNewWorkflow(workflow);
                                  }}
                                  sx={{
                                    minWidth: 110,
                                    px: 2.5,
                                    py: 1,
                                    fontWeight: 700,
                                    fontSize: "0.8rem",
                                    textTransform: "none",
                                    borderRadius: 2,
                                    bgcolor: "#2563eb",
                                    color: "white",
                                    boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)",
                                    "&:hover": {
                                      bgcolor: "#1e40af",
                                      boxShadow: "0 4px 12px rgba(37, 99, 235, 0.4)",
                                      transform: "translateY(-1px)",
                                    },
                                    transition: "all 0.2s ease",
                                  }}
                                >
                                  Başlat
                        </MDButton>
                      </Box>
                            </ListItemButton>
                          </ListItem>
                          {index < filteredWorkflows.length - 1 && (
                            <Divider sx={{ mx: 3 }} />
                          )}
                        </React.Fragment>
                      ));
                    })()}
                  </List>
                </CardContent>
                    </Card>
            )}
          </>
        )}
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default WorkflowMyTasks;
