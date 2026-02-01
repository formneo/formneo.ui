import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form } from "@formio/react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import MDBox from "components/MDBox";
import { Typography, Card } from "@mui/material";
import { Icon } from "@mui/material";
import MDButton from "components/MDButton";
import getConfiguration from "confiuration";
import { UserApi } from "api/generated";
import {
  FormDataApi,
  WorkFlowDefinationApi,
  WorkFlowApi,
  WorkFlowStartApiDto,
} from "api/generated";

// User DTO interface'i
interface LoginUserDto {
  email: string;
  userName: string;
}

const WorkflowDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workflowData, setWorkflowData] = useState<any>(null);
  const [formDesign, setFormDesign] = useState<any>(null);
  const [workflowInstances, setWorkflowInstances] = useState<any[]>([]);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<LoginUserDto | null>(null);
  const [userLoading, setUserLoading] = useState<boolean>(true);

  // User bilgisini çek
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      setUserLoading(true);
      

      const conf = getConfiguration();
      const userApi = new UserApi(conf);

      const response = await userApi.apiUserGetLoginUserDetailGet();

      const userData = response?.data;
      const mappedUser: LoginUserDto = {
        userName: userData.userName || "",
        email: userData.email || "",
      };
      setCurrentUser(mappedUser);

      
    } catch (error) {
      console.error("❌ Current user çekilirken hata:", error);

      setCurrentUser({
        userName: "unknown-user",
        email: "unknown@example.com",
      });
    } finally {
      setUserLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchAllData();
    }
  }, [id]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchWorkflowData(id!),
        fetchFormDesign(id!),
        fetchWorkflowInstances(id!),
      ]);
    } catch (error) {
      console.error("Veriler yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  // Backend'den tüm workflow instance'ları çek
  const fetchWorkflowInstances = async (definationId: string) => {
    try {
      

      const conf = getConfiguration();
      const api = new WorkFlowApi(conf);

      // const response =
      //   await api.apiWorkFlowGetInstancesByDefinationIdGetInstancesByDefinationIdDefinationIdGet(
      //     definationId
      //   );

      // setWorkflowInstances(response.data || []);
      // 
    } catch (error) {
      console.error("❌ Workflow instances çekilirken hata:", error);
      setWorkflowInstances([]);
    }
  };

  const fetchWorkflowData = async (workflowId: string) => {
    try {
      const conf = getConfiguration();
      const api = new WorkFlowDefinationApi(conf);
      const response = await api.apiWorkFlowDefinationIdGet(workflowId);
      setWorkflowData(response.data);
    } catch (error) {
      console.error("Workflow verisi alınırken hata oluştu:", error);
    }
  };

  const fetchFormDesign = async (workflowId: string) => {
    try {
      const conf = getConfiguration();

      // ✅ YENİ: Önce workflow'dan FormId'yi al
      const workflowApi = new WorkFlowDefinationApi(conf);
      const workflowResponse = await workflowApi.apiWorkFlowDefinationIdGet(workflowId);
      const formId = "";//workflowResponse.data?.formId;

      if (formId) {
        

        // FormId ile direkt formu çek
        const formApi = new FormDataApi(conf);
        const formResponse = await formApi.apiFormDataIdGet(formId);

        if (formResponse.data) {
          const parsedDesign = JSON.parse(formResponse.data.formDesign ?? "{}");
          setFormDesign(parsedDesign);
          
          return; // Başarılı, çık
        }
      }

      const formApi = new FormDataApi(conf);
      const allFormsResponse = await formApi.apiFormDataGet();

      const matchedForm = allFormsResponse.data.find(
        (form: any) => form.workFlowDefinationId === workflowId
      );

      if (matchedForm) {
        const parsedDesign = JSON.parse(matchedForm.formDesign ?? "{}");
        setFormDesign(parsedDesign);
        
      } else {
        console.warn("🚫 Bu workflow ID'ye ait form bulunamadı:", workflowId);
        setFormDesign(null);
      }
    } catch (error) {
      console.error("Form verisi alınırken hata oluştu:", error);
      setFormDesign(null);
    }
  };

  const startNewWorkflow = async () => {
    if (!formDesign) {
      alert("Bu workflow için form bulunamadı!");
      return;
    }

    if (!currentUser) {
      alert("Kullanıcı bilgileri yüklenemedi. Lütfen sayfayı yenileyin.");
      return;
    }

    
    setShowForm(true);
  };

  // const handleFormSubmit = async (submission: any) => {
  //   try {
  //     if (!currentUser) {
  //       alert("Kullanıcı bilgileri yüklenemedi. Lütfen sayfayı yenileyin.");
  //       return;
  //     }

  //     
  //     
  //     

  //     const formDataJson = JSON.stringify(submission.data);
  //     const conf = getConfiguration();
  //     const api = new WorkFlowApi(conf);

  //     const startDto: WorkFlowStartApiDto = {
  //       definationId: id,
  //       userName: currentUser.userName,
  //       workFlowInfo: `${
  //         workflowData?.workflowName || "Yeni İş Akışı"
  //       } - ${new Date().toLocaleString("tr-TR")} - ${currentUser.email}`,
  //       payloadJson: formDataJson,
  //     };

  //     

  //     const result = await api.apiWorkFlowStartWithFormPost(startDto);
  //     

  //     if (result.data) {
  //       // Success notification
  //       const notification = document.createElement("div");
  //       notification.innerHTML = `
  //         <div style="
  //           position: fixed; 
  //           top: 20px; 
  //           right: 20px; 
  //           background: #4CAF50; 
  //           color: white; 
  //           padding: 16px 24px; 
  //           border-radius: 8px; 
  //           box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  //           z-index: 10000;
  //           font-family: Arial, sans-serif;
  //           max-width: 400px;
  //         ">
  //           <div style="font-weight: bold; margin-bottom: 8px;">✅ İş Akışı Başarıyla Başlatıldı!</div>
  //           <div style="font-size: 14px; opacity: 0.9;">
  //             📋 Workflow ID: ${result.data.id}<br>
  //             👤 Kullanıcı: ${currentUser.userName}<br>
  //             📧 Email: ${currentUser.email}<br>
  //             📝 Form Alanları: ${Object.keys(submission.data).length} alan
  //           </div>
  //         </div>
  //       `;
  //       document.body.appendChild(notification);

  //       setTimeout(() => {
  //         document.body.removeChild(notification);
  //       }, 5000);

  //       setShowForm(false);

  //       // Form submit sonrası listeyi yenile
  //       if (id) {
  //         await fetchWorkflowInstances(id);
  //       }
  //     } else {
  //       console.warn("⚠️ Backend response'da data yok:", result);
  //       alert("⚠️ İş akışı başlatıldı ama ID döndürülmedi");
  //     }
  //   } catch (error: any) {
  //     console.error("❌ İş akışı başlatılamadı:", error);

  //     let errorMessage = "İş akışı başlatılamadı!";

  //     if (error.response) {
  //       console.error("❌ Error response:", error.response.data);
  //       errorMessage += `\n\nHTTP Status: ${error.response.status}`;
  //       errorMessage += `\nStatus Text: ${error.response.statusText}`;

  //       if (error.response.data?.message) {
  //         errorMessage += `\nHata Detayı: ${error.response.data.message}`;
  //       }

  //       if (error.response.data?.errors) {
  //         errorMessage += `\nValidation Errors: ${JSON.stringify(error.response.data.errors)}`;
  //       }
  //     } else if (error.message) {
  //       errorMessage += `\nHata: ${error.message}`;
  //     }

  //     alert(errorMessage);
  //   }
  // };

  const getStatusText = (status: number) => {
    switch (status) {
      case 0:
        return "Başlatılmamış";
      case 1:
        return "Devam Ediyor";
      case 2:
        return "Tamamlandı";
      case 3:
        return "Beklemede";
      case 4:
        return "Geri Gönderildi";
      default:
        return "Bilinmiyor";
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 2:
        return { bg: "#d4edda", color: "#155724", border: "#c3e6cb" };
      case 1:
        return { bg: "#0dcaf0", color: "#055160", border: "#9eeaf9" };
      case 3:
        return { bg: "#fff3cd", color: "#856404", border: "#ffeaa7" };
      case 4:
        return { bg: "#f8d7da", color: "#721c24", border: "#f5c6cb" };
      default:
        return { bg: "#e9ecef", color: "#495057", border: "#dee2e6" };
    }
  };

  const handleViewWorkflowDetails = (workflow: any) => {
    
    alert(
      `İş Akışı: ${workflow.workflowName}\nDurum: ${getStatusText(
        workflow.status
      )}\nOnay Adımları: ${workflow.approveItemCount}\nBaşlatma Tarihi: ${
        workflow.startDate
      }\nOluşturan: ${workflow.createdBy || "Bilinmiyor"}`
    );
  };

  const handleViewApproveItems = (workflow: any) => {
    
    alert(
      `Bu workflow'da ${workflow.approveItemCount} onay adımı var.\nWorkflow ID: ${workflow.workflowHeadId}`
    );
  };

  // Component'in başına bu function'ı ekle (diğer function'ların yanına):

  const getUniqueDisplayName = (workflow: any) => {
    const shortId = workflow.workflowHeadId?.substring(0, 8) || "unknown";
    return `${workflow.workflowName} - #${shortId}`;
  };

  // Loading state - User yüklenirken
  if (userLoading || loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <Card style={{ margin: 24, padding: 24 }}>
          <Typography>
            {userLoading ? "Kullanıcı bilgileri yükleniyor..." : "Veriler yükleniyor..."}
          </Typography>
        </Card>
        <Footer />
      </DashboardLayout>
    );
  }

  // User bilgisi yüklenemedi
  if (!currentUser) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <Card style={{ margin: 24, padding: 24 }}>
          <Typography color="error">
            Kullanıcı bilgileri yüklenemedi. Lütfen sayfayı yenileyin veya tekrar giriş yapın.
          </Typography>
          <MDButton onClick={() => window.location.reload()} sx={{ mt: 2 }}>
            Sayfayı Yenile
          </MDButton>
        </Card>
        <Footer />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />

      {showForm ? (
        <Card style={{ margin: 24, padding: 24 }}>
          <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Yeni İş Akışı Formu - {workflowData?.workflowName}</Typography>
            <MDButton
              variant="outlined"
              color="secondary"
              onClick={() => setShowForm(false)}
              size="small"
            >
              İptal
            </MDButton>
          </MDBox>

          <MDBox mb={2} p={2} sx={{ backgroundColor: "#f0f7ff", borderRadius: 1 }}>
            <Typography variant="body2" sx={{ color: "#0070f3" }}>
              👤 Kullanıcı: {currentUser.userName} ({currentUser.email})
            </Typography>
          </MDBox>

          {formDesign ? (
            <Form form={formDesign}  />
          ) : (
            <Typography>Form yükleniyor...</Typography>
          )}
        </Card>
      ) : (
        <MDBox sx={{ margin: "24px", backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
          {/* Header Section */}
          <MDBox
            sx={{
              backgroundColor: "white",
              padding: "24px",
              borderRadius: "8px",
              marginBottom: "16px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <MDBox display="flex" justifyContent="space-between" alignItems="flex-start">
              <MDBox>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 400,
                    color: "#333",
                    marginBottom: "8px",
                  }}
                >
                  {workflowData?.workflowName || "İş Akışı Detayı"}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "#666",
                    fontSize: "14px",
                    marginBottom: "8px",
                  }}
                ></Typography>

                <MDBox display="flex" gap={3} flexWrap="wrap">
                  <Typography variant="body2" sx={{ color: "#28a745", fontSize: "12px" }}>
                    👤 Kullanıcı: {currentUser.userName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#0070f3", fontSize: "12px" }}>
                    📧 Email: {currentUser.email}
                  </Typography>
                  {workflowData && (
                    <>
                      <Typography variant="body2" sx={{ color: "#0070f3", fontSize: "12px" }}>
                        ID: {workflowData.id}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#28a745", fontSize: "12px" }}>
                        Revizyon: v{workflowData.revision}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#666", fontSize: "12px" }}>
                        Durum: {workflowData.isActive ? "Aktif" : "Pasif"}
                      </Typography>
                    </>
                  )}
                </MDBox>
              </MDBox>

              <MDButton
                variant="contained"
                color="primary"
                onClick={startNewWorkflow}
                disabled={!formDesign || !currentUser}
                startIcon={<Icon>add</Icon>}
                sx={{
                  backgroundColor: "#0070f3",
                  color: "white",
                  textTransform: "none",
                  borderRadius: "4px",
                  fontSize: "14px",
                  padding: "8px 16px",
                  "&:hover": {
                    backgroundColor: "#0051cc",
                  },
                  "&:disabled": {
                    backgroundColor: "#ccc",
                    color: "#999",
                  },
                }}
              >
                YENİ İŞ AKIŞI
              </MDButton>
            </MDBox>
          </MDBox>

          {/* Table Section */}
          <Card
            sx={{
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              overflow: "hidden",
            }}
          >
            <MDBox
              sx={{
                padding: "16px 24px",
                borderBottom: "1px solid #e0e0e0",
                backgroundColor: "#f8f9fa",
              }}
            >
              <Typography variant="h6" sx={{ color: "#333", fontWeight: 500 }}></Typography>
              <Typography variant="body2" sx={{ color: "#666", fontSize: "13px" }}></Typography>
            </MDBox>

            <MDBox
              sx={{
                padding: "16px 24px",
                borderBottom: "1px solid #e0e0e0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <MDBox display="flex" alignItems="center" gap={2}>
                <Typography variant="body2" sx={{ color: "#666" }}>
                  Gösterim:
                </Typography>
                <select
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    fontSize: "14px",
                  }}
                  defaultValue="10"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </MDBox>

              <MDBox display="flex" alignItems="center" gap={2}>
                <Typography variant="body2" sx={{ color: "#666", fontSize: "12px" }}>
                  Toplam: {workflowInstances.length}
                </Typography>
                <input
                  type="text"
                  placeholder="İş akışı adı ara..."
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    padding: "8px 12px",
                    fontSize: "14px",
                    width: "200px",
                  }}
                />
              </MDBox>
            </MDBox>

            <MDBox sx={{ overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8f9fa" }}>
                    <th
                      style={{
                        padding: "12px 24px",
                        textAlign: "left",
                        borderBottom: "1px solid #e0e0e0",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#666",
                        width: "25%",
                      }}
                    >
                      İŞ AKIŞI ADI
                    </th>
                    <th
                      style={{
                        padding: "12px 24px",
                        textAlign: "left",
                        borderBottom: "1px solid #e0e0e0",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#666",
                        width: "15%",
                      }}
                    >
                      DURUM
                    </th>
                    <th
                      style={{
                        padding: "12px 24px",
                        textAlign: "left",
                        borderBottom: "1px solid #e0e0e0",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#666",
                        width: "15%",
                      }}
                    >
                      ONAY ADIMLARI
                    </th>
                    <th
                      style={{
                        padding: "12px 24px",
                        textAlign: "left",
                        borderBottom: "1px solid #e0e0e0",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#666",
                        width: "15%",
                      }}
                    >
                      BAŞLATMA TARİHİ
                    </th>
                    <th
                      style={{
                        padding: "12px 24px",
                        textAlign: "left",
                        borderBottom: "1px solid #e0e0e0",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#666",
                        width: "15%",
                      }}
                    >
                      BAŞLATAN
                    </th>
                    <th
                      style={{
                        padding: "12px 24px",
                        textAlign: "center",
                        borderBottom: "1px solid #e0e0e0",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#666",
                        width: "15%",
                      }}
                    >
                      İŞLEMLER
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {workflowInstances.length > 0 ? (
                    workflowInstances.map((workflow, index) => {
                      const statusStyle = getStatusColor(workflow.status);
                      return (
                        <tr
                          key={workflow.workflowHeadId || index}
                          style={{ borderBottom: "1px solid #f0f0f0", cursor: "pointer" }}
                        >
                          <td style={{ padding: "16px 24px" }}>
                            <MDBox display="flex" alignItems="center" gap={1}>
                              <Icon sx={{ fontSize: 16, color: "#0070f3" }}>play_arrow</Icon>
                              <Typography
                                variant="body2"
                                sx={{ fontSize: "14px", color: "#333", fontWeight: 500 }}
                              >
                                {getUniqueDisplayName(workflow)}
                              </Typography>
                            </MDBox>
                          </td>
                          <td style={{ padding: "16px 24px" }}>
                            <span
                              style={{
                                padding: "4px 8px",
                                borderRadius: "4px",
                                backgroundColor: statusStyle.bg,
                                color: statusStyle.color,
                                fontSize: "11px",
                                fontWeight: 500,
                                border: `1px solid ${statusStyle.border}`,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {getStatusText(workflow.status)}
                            </span>
                          </td>
                          <td style={{ padding: "16px 24px" }}>
                            <Typography variant="body2" sx={{ fontSize: "13px", color: "#333" }}>
                              {workflow.approveItemCount} adım
                            </Typography>
                          </td>
                          <td style={{ padding: "16px 24px" }}>
                            <Typography variant="body2" sx={{ fontSize: "13px", color: "#666" }}>
                              {workflow.startDate}
                            </Typography>
                          </td>
                          <td style={{ padding: "16px 24px" }}>
                            <Typography variant="body2" sx={{ fontSize: "13px", color: "#666" }}>
                              {workflow.createdBy}
                            </Typography>
                          </td>
                          <td style={{ padding: "16px 24px", textAlign: "center" }}>
                            <MDBox display="flex" gap={1} justifyContent="center">
                              <Icon
                                sx={{
                                  cursor: "pointer",
                                  fontSize: 18,
                                  color: "#0070f3",
                                  "&:hover": { color: "#0051cc" },
                                }}
                                onClick={() => handleViewWorkflowDetails(workflow)}
                                title="Detayları Görüntüle"
                              >
                                visibility
                              </Icon>
                              <Icon
                                sx={{
                                  cursor: "pointer",
                                  fontSize: 18,
                                  color: "#28a745",
                                  "&:hover": { color: "#1e7e34" },
                                }}
                                onClick={() => handleViewApproveItems(workflow)}
                                title="Onay Adımlarını Görüntüle"
                              >
                                list
                              </Icon>
                            </MDBox>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ padding: "48px 24px", textAlign: "center" }}>
                        <MDBox display="flex" flexDirection="column" alignItems="center" gap={2}>
                          <Icon sx={{ fontSize: 48, color: "#ccc" }}>rocket_launch</Icon>
                          <Typography variant="h6" color="text.secondary"></Typography>
                          <Typography variant="body2" color="text.secondary">
                            Bu iş akışı tanımından henüz hiç instance oluşturulmamış.
                          </Typography>
                          <MDButton
                            variant="contained"
                            color="primary"
                            onClick={startNewWorkflow}
                            disabled={!formDesign || !currentUser}
                            size="small"
                            sx={{ mt: 2 }}
                          >
                            İlk İş Akışını Başlat
                          </MDButton>
                        </MDBox>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </MDBox>
          </Card>
        </MDBox>
      )}

      <Footer />
    </DashboardLayout>
  );
};

export default WorkflowDetail;
