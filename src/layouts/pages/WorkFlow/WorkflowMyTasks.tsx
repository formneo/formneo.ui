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
} from "@mui/material";
import {
  Assignment as AssignmentIcon,
  AccessTime as AccessTimeIcon,
  PlayArrow as PlayArrowIcon,
  AddCircle as AddCircleIcon,
  List as ListIcon,
  Search as SearchIcon,
  Description as DescriptionIcon,
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
  const [activeTab, setActiveTab] = useState(0); // 0: Devam Eden Görevlerim, 1: Yeni Süreç Başlat
  const [workflowTasks, setWorkflowTasks] = useState<WorkflowTask[]>([]);
  const [availableWorkflows, setAvailableWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingWorkflows, setLoadingWorkflows] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "in-progress" | "completed">("all");
  const [workflowSearchQuery, setWorkflowSearchQuery] = useState("");

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
      <MDBox my={3}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            İş Akışları
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Devam eden görevlerinizi görüntüleyin veya yeni süreç başlatın
          </Typography>
        </Box>

        {/* Sekmeler */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab
              icon={<ListIcon />}
              iconPosition="start"
              label="Devam Eden Görevlerim"
              sx={{ textTransform: "none", fontSize: "1rem" }}
            />
            <Tab
              icon={<AddCircleIcon />}
              iconPosition="start"
              label="Yeni Süreç Başlat"
              sx={{ textTransform: "none", fontSize: "1rem" }}
            />
          </Tabs>
        </Box>

        {/* Devam Eden Görevlerim Sekmesi */}
        {activeTab === 0 && (
          <>
            {/* Filtreler */}
            <Box sx={{ mb: 3, display: "flex", gap: 1 }}>
              <Chip
                label="Tümü"
                onClick={() => setFilter("all")}
                color={filter === "all" ? "primary" : "default"}
                clickable
              />
              <Chip
                label="Beklemede"
                onClick={() => setFilter("pending")}
                color={filter === "pending" ? "warning" : "default"}
                clickable
              />
              <Chip
                label="Devam Ediyor"
                onClick={() => setFilter("in-progress")}
                color={filter === "in-progress" ? "info" : "default"}
                clickable
              />
              <Chip
                label="Tamamlandı"
                onClick={() => setFilter("completed")}
                color={filter === "completed" ? "success" : "default"}
                clickable
              />
            </Box>

            {/* Workflow Görev Listesi - DataGrid */}
              <Card>
              <CardContent>
                <div style={{ height: 600, width: "100%" }}>
                  <DataGrid
                    rows={filteredTasks}
                    columns={[
                      {
                        field: "formName",
                        headerName: "Form Adı",
                        width: 200,
                        flex: 1,
                        renderCell: (params) => (
                          <Typography variant="body2" fontWeight={600}>
                            {params.value || "Görev"}
                  </Typography>
                        ),
                      },
                      {
                        field: "workflowName",
                        headerName: "İş Akışı",
                        width: 200,
                        flex: 1,
                      },
                      {
                        field: "type",
                        headerName: "Tip",
                        width: 150,
                        renderCell: (params) => (
                              <Chip 
                            label={params.value === "formTask" ? "Form Görevi" : "Kullanıcı Görevi"}
                                size="small" 
                            color={params.value === "formTask" ? "primary" : "secondary"}
                          />
                        ),
                      },
                      {
                        field: "status",
                        headerName: "Durum",
                        width: 150,
                        renderCell: (params) => (
                              <Chip 
                            label={getStatusText(params.value)}
                            color={getStatusColor(params.value) as any}
                                size="small" 
                          />
                        ),
                      },
                      {
                        field: "message",
                        headerName: "Mesaj",
                        width: 250,
                        flex: 1,
                        renderCell: (params) => (
                          <Typography variant="body2" color="textSecondary" noWrap>
                            {params.value || "-"}
                          </Typography>
                        ),
                      },
                      {
                        field: "createdDate",
                        headerName: "Oluşturulma Tarihi",
                        width: 180,
                        renderCell: (params) =>
                          params.value ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <AccessTimeIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                              <Typography variant="body2" color="textSecondary">
                                {format(new Date(params.value), "dd MMM yyyy HH:mm", { locale: tr })}
                              </Typography>
                          </Box>
                          ) : (
                            "-"
                          ),
                      },
                      {
                        field: "shortId",
                        headerName: "ID",
                        width: 120,
                        renderCell: (params) =>
                          params.value ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <PlayArrowIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                            <Typography variant="body2" color="textSecondary">
                                {params.value}
                            </Typography>
                          </Box>
                          ) : (
                            "-"
                          ),
                      },
                      {
                        field: "assignedUser",
                        headerName: "Süreç Üzerinde",
                        width: 180,
                        renderCell: (params) => {
                          // FormTask için formUserNameSurname, UserTask için approveUserNameSurname
                          const userName = params.row.type === "formTask" 
                            ? params.row.formUserNameSurname 
                            : params.row.approveUserNameSurname;
                          
                          return userName ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <AssignmentIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                              <Typography variant="body2" color="textSecondary">
                                {userName}
                              </Typography>
                            </Box>
                          ) : (
                            "-"
                          );
                        },
                      },
                      {
                        field: "actions",
                        headerName: "İşlemler",
                        width: 150,
                        sortable: false,
                        renderCell: (params) => (
                        <MDButton
                          variant="gradient"
                          color="info"
                            size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                              handleWorkflowClick(params.row);
                          }}
                        >
                            {params.row.type === "formTask" ? "Formu Aç" : "Görüntüle"}
                        </MDButton>
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
                      "& .MuiDataGrid-row:hover": {
                        cursor: "pointer",
                        backgroundColor: "action.hover",
                      },
                      "& .MuiDataGrid-cell:focus": {
                        outline: "none",
                      },
                    }}
                    localeText={{
                      noRowsLabel: "Görev bulunamadı",
                      noResultsOverlayLabel: "Sonuç bulunamadı",
                    }}
                  />
                </div>
              </CardContent>
                    </Card>
          </>
        )}

        {/* Yeni Süreç Başlat Sekmesi - Kompakt Liste */}
        {activeTab === 1 && (
          <>
            {/* Arama Kutusu */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Workflow ara..."
                  value={workflowSearchQuery}
                  onChange={(e) => setWorkflowSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: "text.secondary" }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </CardContent>
            </Card>

            {/* Workflow Listesi */}
            {loadingWorkflows ? (
              <Card>
                <CardContent sx={{ textAlign: "center", py: 4 }}>
                <Typography>Yükleniyor...</Typography>
                </CardContent>
              </Card>
            ) : availableWorkflows.length === 0 ? (
              <Card>
                <CardContent sx={{ textAlign: "center", py: 4 }}>
                  <AddCircleIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                  <Typography variant="h6" color="textSecondary">
                    Workflow bulunamadı
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Başlatılabilecek aktif workflow bulunmamaktadır.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Card>
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
                                width: 4,
                                backgroundColor: "success.main",
                                opacity: 0,
                                transition: "opacity 0.2s ease",
                              },
                            }}
                          >
                            <ListItemButton
                              onClick={() => {
                                handleStartNewWorkflow(workflow);
                              }}
                              sx={{
                                py: 2,
                                px: 3,
                                transition: "all 0.2s ease-in-out",
                                "&:hover": {
                                  backgroundColor: "action.hover",
                                  transform: "translateX(4px)",
                                },
                                "&.Mui-disabled": {
                                  opacity: 0.6,
                                },
                              }}
                            >
                              {/* İkon Container */}
                              <ListItemIcon sx={{ minWidth: 56 }}>
                                <Box
                                  sx={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 2,
                        display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: "success.lighter",
                        transition: "all 0.2s ease",
                        "&:hover": {
                                      transform: "scale(1.05)",
                                    },
                                  }}
                                >
                                  <DescriptionIcon
                                    sx={{
                                      color: "success.main",
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
                                      fontWeight={600}
                                      sx={{
                                        fontSize: "1rem",
                                        color: "text.primary",
                                      }}
                                    >
                              {workflow.workflowName}
                            </Typography>
                          <Chip 
                              label="Başlatılabilir"
                            size="small" 
                              color="success"
                              sx={{
                                height: 22,
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                "& .MuiChip-label": {
                                  px: 1,
                                },
                              }}
                          />
                        </Box>
                                }
                                secondary={
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                      fontSize: "0.875rem",
                                      mt: 0.5,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                    }}
                                  >
                                    <DescriptionIcon sx={{ fontSize: 14 }} />
                                    Tıklayarak başlatın
                        </Typography>
                                }
                              />

                              {/* Aksiyon Butonu */}
                              <Box sx={{ ml: 2 }}>
                        <MDButton
                          variant="gradient"
                                  color="success"
                                  size="small"
                          startIcon={<AddCircleIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                              handleStartNewWorkflow(workflow);
                                  }}
                                  sx={{
                                    minWidth: 100,
                                    fontWeight: 600,
                                    textTransform: "none",
                                    boxShadow: "none",
                                    "&:hover": {
                                      boxShadow: 2,
                                      transform: "translateY(-1px)",
                                    },
                                  }}
                                >
                                  Başlat
                        </MDButton>
                      </Box>
                            </ListItemButton>
                          </ListItem>
                          {index < filteredWorkflows.length - 1 && (
                            <Divider sx={{ ml: 3, mr: 3 }} />
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
