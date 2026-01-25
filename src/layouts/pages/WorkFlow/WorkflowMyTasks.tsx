import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ButtonGroup,
  Button,
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
  const [activeTab, setActiveTab] = useState(0); // 0: Onay Kutum, 1: Başlattıklarım, 2: Yeni Süreç
  const [inboxSubTab, setInboxSubTab] = useState(0); // 0: Bana Atananlar, 1: Grup İşleri, 2: Tümü
  const [workflowTasks, setWorkflowTasks] = useState<WorkflowTask[]>([]);
  const [myStartedForms, setMyStartedForms] = useState<any[]>([]); // Başlattıklarım için ayrı state
  const [availableWorkflows, setAvailableWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStarted, setLoadingStarted] = useState(true);
  const [loadingWorkflows, setLoadingWorkflows] = useState(true);
  const [workflowSearchQuery, setWorkflowSearchQuery] = useState("");
  
  // Filtreler - MVP (3 basit filtre)
  const [selectedWorkflowDefId, setSelectedWorkflowDefId] = useState<string>(""); // Süreç tipi
  const [selectedStatus, setSelectedStatus] = useState<string>(""); // Durum
  const [selectedDateRange, setSelectedDateRange] = useState<string>(""); // Tarih aralığı
  
  // Dashboard Metrikleri
  const myAssignedTasks = workflowTasks; // Bana atanan görevler
  const groupTasks = workflowTasks.filter(t => t.type === "userTask"); // Grup işleri (UserTask'lar)

  // Component mount olduğunda workflow listesini çek (filtre dropdown için)
  useEffect(() => {
    fetchAvailableWorkflows();
  }, []);
  
  // Tab veya filtreler değiştiğinde fetch
  useEffect(() => {
    if (activeTab === 0) {
      // Onay Kutum
      fetchWorkflowInstances();
    } else if (activeTab === 1) {
      // Başlattıklarım
      fetchMyStartedForms();
    } else if (activeTab === 2) {
      // Yeni Süreç - zaten yüklü
    }
  }, [activeTab, selectedWorkflowDefId, selectedStatus, selectedDateRange]);

  /**
   * ✅ Kullanıcıya atanmış workflow görevlerini çek
   * /api/WorkFlow/GetMyTasks/my-tasks endpoint'ini kullanır
   */
  const fetchWorkflowInstances = async () => {
    setLoading(true);
    try {
      const conf = getConfiguration();

      // Tarih hesaplama (eğer varsa)
      let minDateStr: string | undefined = undefined;
      if (selectedDateRange) {
        const now = new Date();
        let minDate: Date | null = null;
        
        if (selectedDateRange === "7") {
          minDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (selectedDateRange === "30") {
          minDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else if (selectedDateRange === "90") {
          minDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        }
        
        if (minDate) {
          const year = minDate.getFullYear();
          const month = String(minDate.getMonth() + 1).padStart(2, '0');
          const day = String(minDate.getDate()).padStart(2, '0');
          minDateStr = `${year}-${month}-${day}`;
        }
      }

      // ✅ Proje standardı: WorkFlowApi kullan
      // Query parametrelerini URL'e ekle
      let url = `/api/WorkFlow/GetMyTasks/my-tasks`;
      const queryParams: string[] = [];
      if (selectedWorkflowDefId) queryParams.push(`WorkFlowDefinationId=${selectedWorkflowDefId}`);
      if (selectedStatus) queryParams.push(`Durum=${selectedStatus}`);
      if (minDateStr) queryParams.push(`BaslangicTarihiMin=${minDateStr}`);
      
      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
      }

      // Axios instance üzerinden çağır (configuration ile)
      // Axios ile çağır (token header'a ekle)
      const response = await axios.get(`${conf.basePath}${url}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
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
   * ✅ Kullanıcının başlattığı formları çek
   * /api/WorkFlow/GetMyStartedForms endpoint'ini kullanır
   */
  const fetchMyStartedForms = async () => {
    setLoadingStarted(true);
    try {
      const conf = getConfiguration();
      
      // Tarih hesaplama (eğer varsa)
      let minDateStr: string | undefined = undefined;
      if (selectedDateRange) {
        const now = new Date();
        let minDate: Date | null = null;
        
        if (selectedDateRange === "7") {
          minDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (selectedDateRange === "30") {
          minDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else if (selectedDateRange === "90") {
          minDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        }
        
        if (minDate) {
          const year = minDate.getFullYear();
          const month = String(minDate.getMonth() + 1).padStart(2, '0');
          const day = String(minDate.getDate()).padStart(2, '0');
          minDateStr = `${year}-${month}-${day}`;
        }
      }

      // ✅ Proje standardı: Configuration ile axios kullan
      let url = `/api/WorkFlow/GetMyStartedForms`;
      const queryParams: string[] = [];
      if (selectedWorkflowDefId) queryParams.push(`WorkFlowDefinationId=${selectedWorkflowDefId}`);
      if (selectedStatus) queryParams.push(`Durum=${selectedStatus}`);
      if (minDateStr) queryParams.push(`BaslangicTarihiMin=${minDateStr}`);
      
      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
      }

      // Axios ile çağır (token header'a ekle)
      const response = await axios.get(`${conf.basePath}${url}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      // ✅ Veri response.data.data içinde
      const data: any[] = response?.data?.data || [];
      
      console.log("✅ Başlattığım formlar yüklendi:", data.length, "adet");
      
      setMyStartedForms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("❌ Başlatılan formlar çekilirken hata:", error);
      setMyStartedForms([]);
    } finally {
      setLoadingStarted(false);
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
   * ✅ Görevler artık backend'den filtrelenmiş geliyor
   */

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
            onClick={() => setActiveTab(2)}
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

        {/* Ana İçerik: Sol Sidebar + Sağ Grid */}
        <Box sx={{ display: "flex", gap: 2, minHeight: "calc(100vh - 180px)" }}>
          {/* Sol Sidebar - Inbox Menü */}
          <Card
            sx={{
              width: 280,
              flexShrink: 0,
              borderRadius: 2,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              border: "1px solid #e2e8f0",
              height: "fit-content",
              position: "sticky",
              top: 100,
            }}
          >
            <CardContent sx={{ p: 2 }}>
              {/* Menü Başlık */}
              <Typography
                variant="subtitle2"
                fontWeight={700}
                sx={{
                  color: "#64748b",
                  mb: 2,
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                İş Akışı Menüsü
              </Typography>

              {/* Menü İtemleri */}
              <List sx={{ p: 0 }}>
                {/* Onay Kutum */}
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    selected={activeTab === 0}
                    onClick={() => setActiveTab(0)}
                    sx={{
                      borderRadius: 1.5,
                      py: 1.5,
                      "&.Mui-selected": {
                        bgcolor: "#eff6ff",
                        borderLeft: "3px solid #2563eb",
                        "&:hover": {
                          bgcolor: "#dbeafe",
                        },
                      },
                      "&:hover": {
                        bgcolor: "#f8fafc",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <InboxIcon sx={{ color: "#2563eb", fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Onay Kutum"
                      primaryTypographyProps={{
                        fontSize: "0.875rem",
                        fontWeight: 700,
                      }}
                    />
                  </ListItemButton>
                </ListItem>

                {/* Başlattıklarım */}
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    selected={activeTab === 1}
                    onClick={() => setActiveTab(1)}
                    sx={{
                      borderRadius: 1.5,
                      py: 1.5,
                      "&.Mui-selected": {
                        bgcolor: "#fef3c7",
                        borderLeft: "3px solid #f59e0b",
                        "&:hover": {
                          bgcolor: "#fde68a",
                        },
                      },
                      "&:hover": {
                        bgcolor: "#f8fafc",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <PlayArrowIcon sx={{ color: "#f59e0b", fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Başlattıklarım"
                      primaryTypographyProps={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                      }}
                    />
                  </ListItemButton>
                </ListItem>

                <Divider sx={{ my: 1.5 }} />

                {/* Yeni Süreç Başlat */}
                <ListItem disablePadding>
                  <ListItemButton
                    selected={activeTab === 2}
                    onClick={() => setActiveTab(2)}
                    sx={{
                      borderRadius: 1.5,
                      py: 1.5,
                      bgcolor: activeTab === 2 ? "#dcfce7" : "transparent",
                      "&.Mui-selected": {
                        bgcolor: "#dcfce7",
                        borderLeft: "3px solid #10b981",
                        "&:hover": {
                          bgcolor: "#bbf7d0",
                        },
                      },
                      "&:hover": {
                        bgcolor: "#f0fdf4",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <AddCircleIcon sx={{ color: "#10b981", fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Yeni Süreç"
                      primaryTypographyProps={{
                        fontSize: "0.875rem",
                        fontWeight: 700,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Sağ İçerik Alanı */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            
            {/* MVP Filtreler - Modern & Minimal */}
            <Box sx={{ mb: 2 }}>
              {/* Süreç Tipi - Select (10 tane var) */}
              <Card sx={{ mb: 1.5, borderRadius: 2, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Typography variant="body2" fontWeight={700} sx={{ color: "#64748b", minWidth: 80 }}>
                      Süreç:
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 250 }}>
                      <Select
                        value={selectedWorkflowDefId}
                        onChange={(e) => setSelectedWorkflowDefId(e.target.value)}
                        displayEmpty
                  sx={{
                          bgcolor: "white",
                          "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                    fontWeight: 600,
                        }}
                      >
                        <MenuItem value="">
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            📋 Tüm Süreçler
        </Box>
                        </MenuItem>
                        {availableWorkflows.map((workflow) => (
                          <MenuItem key={workflow.id} value={workflow.id}>
                            {workflow.workflowName || workflow.workFlowName || "İsimsiz"}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </CardContent>
              </Card>
              
              {/* Durum & Tarih - Chips */}
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                {/* Durum Chips */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: "#64748b" }}>
                    Durum:
                    </Typography>
                  <Box sx={{ display: "flex", gap: 0.75 }}>
                    <Chip
                      label="Tümü"
                      onClick={() => setSelectedStatus("")}
                      sx={{
                        bgcolor: selectedStatus === "" ? "#2563eb" : "#f1f5f9",
                        color: selectedStatus === "" ? "white" : "#64748b",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        height: 28,
                        cursor: "pointer",
                        "&:hover": {
                          bgcolor: selectedStatus === "" ? "#1e40af" : "#e2e8f0",
                        },
                      }}
                    />
                    <Chip
                      label="▶️ Devam Ediyor"
                      onClick={() => setSelectedStatus("1")}
                      sx={{
                        bgcolor: selectedStatus === "1" ? "#3b82f6" : "#f1f5f9",
                        color: selectedStatus === "1" ? "white" : "#64748b",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        height: 28,
                        cursor: "pointer",
                        "&:hover": {
                          bgcolor: selectedStatus === "1" ? "#2563eb" : "#e2e8f0",
                        },
                      }}
                    />
                    <Chip
                      label="✅ Tamamlandı"
                      onClick={() => setSelectedStatus("2")}
                      sx={{
                        bgcolor: selectedStatus === "2" ? "#10b981" : "#f1f5f9",
                        color: selectedStatus === "2" ? "white" : "#64748b",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        height: 28,
                        cursor: "pointer",
                        "&:hover": {
                          bgcolor: selectedStatus === "2" ? "#059669" : "#e2e8f0",
                        },
                      }}
                    />
                  </Box>
                </Box>
                
                {/* Tarih Chips */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: "#64748b" }}>
                    Tarih:
                    </Typography>
                  <Box sx={{ display: "flex", gap: 0.75 }}>
                    <Chip
                      label="Tümü"
                      onClick={() => setSelectedDateRange("")}
                      sx={{
                        bgcolor: selectedDateRange === "" ? "#2563eb" : "#f1f5f9",
                        color: selectedDateRange === "" ? "white" : "#64748b",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        height: 28,
                        cursor: "pointer",
                        "&:hover": {
                          bgcolor: selectedDateRange === "" ? "#1e40af" : "#e2e8f0",
                        },
                      }}
                    />
                    <Chip
                      label="7 Gün"
                      onClick={() => setSelectedDateRange("7")}
                      sx={{
                        bgcolor: selectedDateRange === "7" ? "#f59e0b" : "#f1f5f9",
                        color: selectedDateRange === "7" ? "white" : "#64748b",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        height: 28,
                        cursor: "pointer",
                        "&:hover": {
                          bgcolor: selectedDateRange === "7" ? "#d97706" : "#e2e8f0",
                        },
                      }}
                    />
                    <Chip
                      label="30 Gün"
                      onClick={() => setSelectedDateRange("30")}
                      sx={{
                        bgcolor: selectedDateRange === "30" ? "#f59e0b" : "#f1f5f9",
                        color: selectedDateRange === "30" ? "white" : "#64748b",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        height: 28,
                        cursor: "pointer",
                        "&:hover": {
                          bgcolor: selectedDateRange === "30" ? "#d97706" : "#e2e8f0",
                        },
                      }}
                    />
                    <Chip
                      label="90 Gün"
                      onClick={() => setSelectedDateRange("90")}
                      sx={{
                        bgcolor: selectedDateRange === "90" ? "#f59e0b" : "#f1f5f9",
                        color: selectedDateRange === "90" ? "white" : "#64748b",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        height: 28,
                        cursor: "pointer",
                        "&:hover": {
                          bgcolor: selectedDateRange === "90" ? "#d97706" : "#e2e8f0",
                        },
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
            
            {/* ONAY KUTUM - Alt Sekmeler ile */}
        {activeTab === 0 && (
          <>
                {/* Alt Sekmeler */}
                <Box sx={{ borderBottom: 1, borderColor: "#e2e8f0", mb: 2 }}>
                  <Tabs 
                    value={inboxSubTab} 
                    onChange={(e, newValue) => setInboxSubTab(newValue)}
                    sx={{
                      minHeight: 40,
                      "& .MuiTabs-indicator": {
                        backgroundColor: "#2563eb",
                        height: 2,
                      },
                    }}
                  >
                    <Tab
                      label="Bana Atananlar"
                      sx={{ 
                        textTransform: "none", 
                        fontSize: "0.813rem",
                        fontWeight: 600,
                        color: "#64748b",
                        minHeight: 40,
                        "&.Mui-selected": {
                          color: "#2563eb",
                        },
                        px: 2,
                      }}
                    />
                    <Tab
                      label="Grup İşleri"
                      sx={{ 
                        textTransform: "none", 
                        fontSize: "0.813rem",
                        fontWeight: 600,
                        color: "#64748b",
                        minHeight: 40,
                        "&.Mui-selected": {
                          color: "#2563eb",
                        },
                        px: 2,
                      }}
                    />
                    <Tab
                      label="Tüm Görevler"
                      sx={{ 
                        textTransform: "none", 
                        fontSize: "0.813rem",
                        fontWeight: 600,
                        color: "#64748b",
                        minHeight: 40,
                        "&.Mui-selected": {
                          color: "#2563eb",
                        },
                        px: 2,
                      }}
                    />
                  </Tabs>
            </Box>

                {/* DataGrid */}
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
                    rows={
                      inboxSubTab === 0 ? myAssignedTasks :
                      inboxSubTab === 1 ? groupTasks :
                      workflowTasks
                    }
                    columns={[
                      {
                        field: "formName",
                        headerName: "Görev Adı",
                        minWidth: 280,
                        flex: 1.5,
                        renderCell: (params) => (
                          <Box sx={{ py: 1 }}>
                            <Typography variant="body2" fontWeight={700} sx={{ color: "#1e293b", mb: 0.5 }}>
                            {params.value || "Görev"}
                  </Typography>
                            <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.7rem" }}>
                              📋 {params.row.workflowName || "İş Akışı"}
                            </Typography>
                          </Box>
                        ),
                      },
                      {
                        field: "uniqNumber",
                        headerName: "No",
                        width: 90,
                        renderCell: (params) => (
                              <Chip 
                            label={`#${params.value || params.row.shortId || "-"}`}
                                size="small" 
                            sx={{
                              bgcolor: "#f1f5f9",
                              color: "#475569",
                              fontWeight: 700,
                              fontFamily: "monospace",
                              fontSize: "0.7rem",
                            }}
                          />
                        ),
                      },
                      {
                        field: "type",
                        headerName: "Tip",
                        width: 130,
                        renderCell: (params) => (
                              <Chip 
                            label={params.value === "formTask" ? "📝 Form" : "👥 Onay"}
                                size="small" 
                            sx={{
                              bgcolor: params.value === "formTask" ? "#dbeafe" : "#fef3c7",
                              color: params.value === "formTask" ? "#1e40af" : "#92400e",
                              fontWeight: 600,
                              fontSize: "0.7rem",
                            }}
                          />
                        ),
                      },
                      {
                        field: "status",
                        headerName: "Durum",
                        width: 150,
                        renderCell: (params) => {
                          const statusConfig = {
                            "pending": { color: "#f59e0b", bg: "#fef3c7", text: "Beklemede", icon: "⏳" },
                            "in-progress": { color: "#3b82f6", bg: "#dbeafe", text: "Devam Ediyor", icon: "▶️" },
                            "completed": { color: "#10b981", bg: "#d1fae5", text: "Tamamlandı", icon: "✅" },
                            "cancelled": { color: "#ef4444", bg: "#fecdd3", text: "İptal", icon: "❌" },
                          };
                          const config = statusConfig[params.value as keyof typeof statusConfig] || statusConfig["pending"];
                          
                          return (
                              <Chip 
                              label={`${config.icon} ${config.text}`}
                                size="small" 
                                sx={{
                                  bgcolor: config.bg,
                                color: config.color,
                                fontWeight: 600,
                                fontSize: "0.75rem",
                              }}
                            />
                          );
                        },
                      },
                      {
                        field: "message",
                        headerName: "Mesaj / Açıklama",
                        minWidth: 200,
                        flex: 1,
                        renderCell: (params) => (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: "#64748b",
                              fontSize: "0.75rem",
                              fontStyle: params.value ? "normal" : "italic",
                            }}
                          >
                            {params.value || "Açıklama yok"}
                          </Typography>
                        ),
                      },
                      {
                        field: "createdDate",
                        headerName: "Oluşturulma",
                        width: 150,
                        renderCell: (params) =>
                          params.value ? (
                            <Box sx={{ py: 1 }}>
                              <Typography variant="body2" fontWeight={600} sx={{ color: "#475569", fontSize: "0.813rem" }}>
                                {format(new Date(params.value), "dd MMM yyyy", { locale: tr })}
                              </Typography>
                              <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "0.7rem" }}>
                                {format(new Date(params.value), "HH:mm", { locale: tr })}
                              </Typography>
                          </Box>
                          ) : "-",
                      },
                      {
                        field: "actions",
                        headerName: "İşlemler",
                        width: 120,
                        sortable: false,
                        renderCell: (params) => (
                          <Tooltip title={params.row.type === "formTask" ? "Formu Aç" : "Görevi Görüntüle"}>
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
                              {params.row.type === "formTask" ? "Aç" : "Detay"}
                                  </MDButton>
                                </Tooltip>
                        ),
                      },
                    ]}
                    loading={loading}
                    getRowHeight={() => 'auto'}
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
                        py: 1.5,
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
                      noRowsLabel: "📋 Görev bulunamadı",
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

            {/* BAŞLATTIKLARIM */}
            {activeTab === 1 && (
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
                      rows={myStartedForms}
                      getRowId={(row) => row.id || row.workflowHeadId || row.uniqNumber || Math.random().toString()}
                      columns={[
                        {
                          field: "surecAdi",
                          headerName: "Süreç Adı",
                          minWidth: 280,
                          flex: 1.5,
                          renderCell: (params) => (
                            <Box sx={{ py: 1 }}>
                              <Typography variant="body2" fontWeight={700} sx={{ color: "#1e293b", mb: 0.5 }}>
                                {params.value || "Süreç"}
                              </Typography>
                              {params.row.formAdi && (
                                <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.7rem" }}>
                                  📄 {params.row.formAdi}
                            </Typography>
                              )}
                          </Box>
                          ),
                      },
                      {
                          field: "uniqNumber",
                          headerName: "No",
                          width: 90,
                          renderCell: (params) => (
                            <Chip
                              label={`#${params.value}`}
                              size="small"
                              sx={{
                                bgcolor: "#f1f5f9",
                                color: "#475569",
                                fontWeight: 700,
                                fontFamily: "monospace",
                                fontSize: "0.7rem",
                              }}
                            />
                          ),
                        },
                        {
                          field: "mevcutAdim",
                          headerName: "Mevcut Adım",
                          width: 140,
                        renderCell: (params) => (
                            <Typography variant="body2" sx={{ color: "#1e293b", fontWeight: 600, fontSize: "0.813rem" }}>
                            {params.value || "-"}
                          </Typography>
                        ),
                      },
                      {
                          field: "kimdeOnayda",
                          headerName: "Kimde Bekliyor",
                          minWidth: 220,
                          flex: 1,
                        renderCell: (params) => {
                            const kimdeStatus = params.value;
                            const bekleyen = params.row.bekleyenKullanici;
                            const departman = params.row.bekleyenDepartman;
                            const pozisyon = params.row.bekleyenPozisyon;
                            
                            if (!bekleyen) {
                              return (
                                <Box sx={{ py: 1 }}>
                                  <Chip
                                    label="Tamamlandı / Kimde Değil"
                                    size="small"
                                    icon={<CheckCircleIcon sx={{ fontSize: 12 }} />}
                                    sx={{
                                      height: 22,
                                      fontSize: "0.7rem",
                                      fontWeight: 600,
                                      bgcolor: "#d1fae5",
                                      color: "#065f46",
                                    }}
                                  />
                                </Box>
                              );
                            }
                            
                            return (
                              <Box sx={{ py: 1 }}>
                                {kimdeStatus && (
                                  <Chip
                                    label={kimdeStatus}
                                    size="small"
                                    icon={<HourglassEmptyIcon sx={{ fontSize: 12 }} />}
                                    sx={{
                                      height: 20,
                                      fontSize: "0.65rem",
                                      fontWeight: 700,
                                      bgcolor: "#fef3c7",
                                      color: "#92400e",
                                      mb: 0.5,
                                    }}
                                  />
                                )}
                                <Typography variant="body2" fontWeight={700} sx={{ color: "#1e293b", fontSize: "0.813rem", mb: 0.25 }}>
                                  👤 {bekleyen}
                              </Typography>
                                {(departman || pozisyon) && (
                                  <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.7rem" }}>
                                    {departman}{pozisyon ? ` • ${pozisyon}` : ""}
                                  </Typography>
                                )}
                          </Box>
                            );
                          },
                        },
                        {
                          field: "durumEnum",
                          headerName: "Durum",
                          width: 150,
                          renderCell: (params) => {
                            const statusMap: any = {
                              0: { color: "#94a3b8", bg: "#f1f5f9", icon: "⚪" },
                              1: { color: "#3b82f6", bg: "#dbeafe", icon: "▶️" },
                              2: { color: "#10b981", bg: "#d1fae5", icon: "✅" },
                              3: { color: "#f59e0b", bg: "#fef3c7", icon: "⏳" },
                              4: { color: "#ef4444", bg: "#fecdd3", icon: "🔙" },
                            };
                            const statusValue = params.value ?? 1;
                            const config = statusMap[statusValue] || statusMap[1];
                            const text = params.row.durum || "Devam Ediyor";
                            
                            return (
                              <Chip
                                label={`${config.icon} ${text}`}
                                size="small"
                                sx={{
                                  bgcolor: config.bg,
                                  color: config.color,
                                  fontWeight: 600,
                                  fontSize: "0.75rem",
                                }}
                              />
                          );
                        },
                      },
                        {
                          field: "baslangicTarihi",
                          headerName: "Başlatma Tarihi",
                          width: 150,
                          renderCell: (params) =>
                            params.value ? (
                              <Box sx={{ py: 1 }}>
                                <Typography variant="body2" fontWeight={600} sx={{ color: "#475569", fontSize: "0.813rem" }}>
                                  {format(new Date(params.value), "dd MMM yyyy", { locale: tr })}
                                </Typography>
                                <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "0.7rem" }}>
                                  {format(new Date(params.value), "HH:mm", { locale: tr })}
                                </Typography>
                              </Box>
                            ) : "-",
                        },
                        {
                          field: "sureDetayli",
                          headerName: "Geçen Süre",
                          width: 130,
                          renderCell: (params) => (
                            <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.813rem", fontWeight: 500 }}>
                              {params.value || "-"}
                            </Typography>
                          ),
                      },
                      {
                          field: "baslatanDepartman",
                          headerName: "Başlatan",
                        width: 180,
                          renderCell: (params) => (
                            <Box>
                              <Typography variant="body2" fontWeight={600} sx={{ color: "#1e293b", fontSize: "0.813rem" }}>
                                {params.row.baslatanAdSoyad || "-"}
                              </Typography>
                              <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.7rem" }}>
                                {params.value || ""}
                              </Typography>
                            </Box>
                          ),
                      },
                      {
                        field: "bekleyenKullanici",
                        headerName: "Kimde Onayda",
                        width: 220,
                        renderCell: (params) => {
                          const bekleyen = params.value || params.row.onayBekleyen;
                          const departman = params.row.bekleyenDepartman;
                          const pozisyon = params.row.bekleyenPozisyon;
                          const kimdeStatus = params.row.kimdeOnayda;
                          
                          if (!bekleyen) {
                            return (
                              <Typography variant="caption" sx={{ color: "#94a3b8", fontStyle: "italic" }}>
                                Kimde değil
                              </Typography>
                            );
                          }
                          
                          return (
                            <Box>
                              {kimdeStatus && (
                                <Chip
                                  label={kimdeStatus}
                                  size="small"
                                  icon={<HourglassEmptyIcon sx={{ fontSize: 12 }} />}
                                  sx={{
                                    height: 20,
                                    fontSize: "0.65rem",
                                    fontWeight: 700,
                                    bgcolor: "#fef3c7",
                                    color: "#92400e",
                                    mb: 0.5,
                                  }}
                                />
                              )}
                              <Typography variant="body2" fontWeight={600} sx={{ color: "#1e293b", fontSize: "0.813rem" }}>
                                {bekleyen}
                              </Typography>
                              {(departman || pozisyon) && (
                                <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.7rem" }}>
                                  {departman} {pozisyon ? `• ${pozisyon}` : ""}
                                </Typography>
                              )}
                            </Box>
                          );
                        },
                      },
                      {
                        field: "actions",
                        headerName: "İşlemler",
                          width: 120,
                        sortable: false,
                        renderCell: (params) => (
                            <Tooltip title="Süreç Detayı ve Geçmişi">
                        <MDButton
                          variant="gradient"
                          color="info"
                            size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                                  navigate(`/workflows/history/${params.row.id}`);
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
                                Detay
                        </MDButton>
                            </Tooltip>
                        ),
                      },
                    ]}
                      loading={loadingStarted}
                      getRowHeight={() => 'auto'}
                      onRowClick={(params: GridRowParams) => {
                        // Workflow head ID ile history sayfasına git
                        navigate(`/workflows/history/${params.row.id}`);
                      }}
                      pageSizeOptions={[10, 25, 50]}
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
                          py: 1.5,
                          "&:focus": {
                        outline: "none",
                          },
                        },
                        "& .MuiDataGrid-footerContainer": {
                          borderTop: "2px solid #e2e8f0",
                          bgcolor: "#f8fafc",
                      },
                    }}
                    localeText={{
                        noRowsLabel: "📋 Henüz süreç başlatmadınız",
                        MuiTablePagination: {
                          labelRowsPerPage: "Sayfa başına:",
                        },
                    }}
                  />
                </div>
              </CardContent>
                    </Card>
            )}

            {/* YENİ SÜREÇ BAŞLAT */}
            {activeTab === 2 && (
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
          </Box>
          {/* Sağ İçerik Alanı Sonu */}
        </Box>
        {/* Ana İçerik Sonu */}
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default WorkflowMyTasks;
