import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  Divider,
  Breadcrumbs,
  Link,
} from "@mui/material";
import {
  NavigateNext as NavigateNextIcon,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  History as HistoryIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot, TimelineOppositeContent } from "@mui/lab";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import { WorkFlowItemApi, WorkFlowItemDtoWithApproveItems, WorkFlowApi } from "api/generated";
import getConfiguration from "confiuration";

/**
 * ✅ Workflow History Page
 * 
 * Belirli bir workflow instance'ının geçmişini gösterir.
 */

function WorkflowHistoryPage() {
  const { id: workflowHeadId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [historyData, setHistoryData] = useState<WorkFlowItemDtoWithApproveItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [workflowInfo, setWorkflowInfo] = useState<any>(null);

  useEffect(() => {
    if (!workflowHeadId) return;
    loadWorkflowHistory();
  }, [workflowHeadId]);

  const loadWorkflowHistory = async () => {
    if (!workflowHeadId) return;
    
    setLoading(true);
    try {
      const conf = getConfiguration();
      const workflowItemApi = new WorkFlowItemApi(conf);
      const workflowApi = new WorkFlowApi(conf);
      
      // Workflow history items'ları al
      const response = await workflowItemApi.apiWorkFlowItemGetApproveItemsWorkFlowHeadIdGet(workflowHeadId);
      
      // Tarihe göre sırala (en yeni en üstte)
      const sortedData = (response.data || []).sort((a, b) => {
        const dateA = a.approveItems?.[0]?.createdDate ? new Date(a.approveItems[0].createdDate).getTime() : 0;
        const dateB = b.approveItems?.[0]?.createdDate ? new Date(b.approveItems[0].createdDate).getTime() : 0;
        return dateB - dateA;
      });
      
      setHistoryData(sortedData);
      
      // WorkFlowHead bilgilerini ayrı bir API call ile al
      try {
        const headResponse = await workflowApi.apiWorkFlowGetDetailIdGet(workflowHeadId);
        if (headResponse.data) {
          setWorkflowInfo(headResponse.data);
        }
      } catch (headError) {
        console.error("WorkFlowHead bilgileri yüklenirken hata:", headError);
      }
    } catch (error) {
      console.error("History yüklenirken hata:", error);
      setHistoryData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={0} pb={2} px={3}>
        {/* Breadcrumbs */}
        <Box sx={{ mb: 2, mt: -2 }}>
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" />}
            sx={{
              "& .MuiBreadcrumbs-separator": {
                color: "#94a3b8",
              },
            }}
          >
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate("/workflows")}
              sx={{
                color: "#667eea",
                fontWeight: 600,
                textDecoration: "none",
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
            >
              İş Akışları
            </Link>
            {workflowInfo?.workFlowDefinationId && (
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate(`/workflows/${workflowInfo.workFlowDefinationId}`)}
                sx={{
                  color: "#667eea",
                  fontWeight: 600,
                  textDecoration: "none",
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                {workflowInfo?.workFlowDefination?.workflowName || workflowInfo?.workflowName || "İş Akışı"}
              </Link>
            )}
            <Typography variant="body2" sx={{ color: "#475569", fontWeight: 600 }}>
              Süreç Geçmişi
            </Typography>
          </Breadcrumbs>
        </Box>

        {/* Header */}
        <Box 
          sx={{ 
            mb: 3,
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            padding: 2,
            borderRadius: 2,
            boxShadow: "0 4px 20px rgba(245, 158, 11, 0.3)",
          }}
        >
          <Box>
            <Typography 
              variant="h5" 
              fontWeight={700} 
              sx={{ 
                color: "#ffffff", 
                mb: 0.5,
                textShadow: "0 2px 4px rgba(0,0,0,0.2)",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <HistoryIcon sx={{ fontSize: 28 }} />
              Süreç Geçmişi
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: "#ffffff",
                fontWeight: 500,
                textShadow: "0 1px 3px rgba(0,0,0,0.2)",
                opacity: 0.95,
              }}
            >
              {workflowInfo?.workFlowDefination?.workflowName || workflowInfo?.workflowName || "İş Akışı"}
              {workflowInfo?.uniqNumber && ` • #${workflowInfo.uniqNumber}`}
            </Typography>
          </Box>
          <MDButton
            variant="contained"
            color="white"
            size="medium"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{
              bgcolor: "white",
              color: "#f59e0b",
              fontWeight: 700,
              px: 3,
              py: 1,
              borderRadius: 2,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              "&:hover": {
                bgcolor: "#fef3c7",
                transform: "translateY(-2px)",
                boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
              },
              transition: "all 0.2s ease",
            }}
          >
            Geri Dön
          </MDButton>
        </Box>

        {/* Timeline */}
        <Card 
          sx={{ 
            borderRadius: 2,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            border: "1px solid #e2e8f0",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            {loading ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body1" fontWeight={600} sx={{ color: "#64748b" }}>
                  Yükleniyor...
                </Typography>
              </Box>
            ) : historyData.length === 0 ? (
              <Box 
                sx={{ 
                  textAlign: "center", 
                  py: 6,
                  px: 2,
                }}
              >
                <HistoryIcon sx={{ fontSize: "56px", color: "#cbd5e1", mb: 2 }} />
                <Typography variant="h6" fontWeight={600} sx={{ color: "#475569", mb: 1 }}>
                  Henüz geçmiş kaydı yok
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Bu süreç için henüz bir işlem gerçekleştirilmemiş.
                </Typography>
              </Box>
            ) : (
              <Timeline position="right" sx={{ p: 0, m: 0 }}>
                {historyData.map((item, index) => {
                  const isFirst = index === 0;
                  const isLast = index === historyData.length - 1;
                  
                  // Status'e göre renk ve ikon belirle
                  let dotColor: "success" | "error" | "warning" | "primary" = "primary";
                  let StatusIcon = HourglassEmpty;
                  
                  if (item.workFlowNodeStatus === 2) { // Completed
                    dotColor = "success";
                    StatusIcon = CheckCircle;
                  } else if (item.workFlowNodeStatus === 3) { // Rejected/Cancelled
                    dotColor = "error";
                    StatusIcon = Cancel;
                  } else if (item.workFlowNodeStatus === 1) { // In Progress
                    dotColor = "warning";
                    StatusIcon = HourglassEmpty;
                  }

                  // Approve ve Form items'ları birleştir
                  const allItems = [
                    ...(item.approveItems || []).map(ai => ({ ...ai, type: "approve" })),
                    ...(item.formItems || []).map(fi => ({ ...fi, type: "form" })),
                  ].sort((a, b) => {
                    const dateA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
                    const dateB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
                    return dateB - dateA;
                  });

                  return (
                    <TimelineItem key={index}>
                      <TimelineOppositeContent
                        sx={{ 
                          flex: 0.3, 
                          py: 2,
                          display: { xs: "none", sm: "block" },
                        }}
                      >
                        <Typography variant="body2" fontWeight={600} color="textPrimary">
                          {item.nodeName || "Node"}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {item.nodeType || ""}
                        </Typography>
                      </TimelineOppositeContent>
                      <TimelineSeparator>
                        <TimelineDot 
                          color={dotColor}
                          sx={{
                            width: isFirst ? 40 : 32,
                            height: isFirst ? 40 : 32,
                            boxShadow: isFirst ? "0 4px 12px rgba(0,0,0,0.15)" : "0 2px 8px rgba(0,0,0,0.1)",
                          }}
                        >
                          <StatusIcon sx={{ fontSize: isFirst ? "24px" : "20px" }} />
                        </TimelineDot>
                        {!isLast && <TimelineConnector sx={{ minHeight: 60, bgcolor: "#e2e8f0" }} />}
                      </TimelineSeparator>
                      <TimelineContent sx={{ py: 2, px: 2 }}>
                        <Card
                          sx={{
                            p: 2.5,
                            mb: 2,
                            backgroundColor: isFirst ? "#fef3c7" : "#fff",
                            border: isFirst ? "2px solid #fbbf24" : "1px solid #e2e8f0",
                            borderRadius: 2,
                            boxShadow: isFirst ? "0 4px 12px rgba(251, 191, 36, 0.2)" : "0 1px 4px rgba(0,0,0,0.06)",
                          }}
                        >
                          {/* Node Bilgisi (Mobile) */}
                          <Box sx={{ display: { xs: "block", sm: "none" }, mb: 1.5 }}>
                            <Typography variant="subtitle2" fontWeight={700}>
                              {item.nodeName || "Node"}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {item.nodeType || ""}
                            </Typography>
                          </Box>
                          
                          {item.nodeDescription && (
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                              {item.nodeDescription}
                            </Typography>
                          )}

                          {allItems.length > 0 && <Divider sx={{ my: 2 }} />}

                          {/* Approve ve Form Items */}
                          {allItems.map((subItem: any, subIndex) => (
                            <Box key={subIndex} sx={{ mb: subIndex < allItems.length - 1 ? 2.5 : 0 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                                <Avatar
                                  sx={{
                                    width: 36,
                                    height: 36,
                                    fontSize: "14px",
                                    fontWeight: 700,
                                    bgcolor: subItem.type === "approve" ? "#dbeafe" : "#fef3c7",
                                    color: subItem.type === "approve" ? "#1e40af" : "#92400e",
                                  }}
                                >
                                  {subItem.approveUser?.charAt(0) || subItem.formUser?.charAt(0) || "?"}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" fontWeight={700}>
                                    {subItem.approveUserNameSurname || subItem.formUserNameSurname || "Kullanıcı"}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    {subItem.type === "approve" ? "👥 Onay" : "📝 Form"} • {subItem.createdDate ? new Date(subItem.createdDate).toLocaleString("tr-TR") : "Tarih yok"}
                                  </Typography>
                                </Box>
                                {subItem.approverStatus !== undefined && (
                                  <Chip
                                    label={
                                      subItem.approverStatus === 1 ? "✅ Onaylandı" :
                                      subItem.approverStatus === 2 ? "❌ Reddedildi" :
                                      "⏳ Bekliyor"
                                    }
                                    size="small"
                                    sx={{
                                      fontWeight: 700,
                                      fontSize: "0.75rem",
                                      bgcolor: 
                                        subItem.approverStatus === 1 ? "#d1fae5" :
                                        subItem.approverStatus === 2 ? "#fecdd3" :
                                        "#fef3c7",
                                      color:
                                        subItem.approverStatus === 1 ? "#065f46" :
                                        subItem.approverStatus === 2 ? "#991b1b" :
                                        "#92400e",
                                    }}
                                  />
                                )}
                              </Box>
                              
                              {subItem.note && (
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    mt: 1,
                                    p: 1.5,
                                    backgroundColor: "#f8f9fa",
                                    borderRadius: 1.5,
                                    borderLeft: "3px solid #cbd5e1",
                                    fontStyle: "italic",
                                    fontSize: "0.875rem",
                                    color: "#475569",
                                  }}
                                >
                                  💬 &ldquo;{subItem.note}&rdquo;
                                </Typography>
                              )}
                            </Box>
                          ))}
                        </Card>
                      </TimelineContent>
                    </TimelineItem>
                  );
                })}
              </Timeline>
            )}
          </CardContent>
        </Card>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default WorkflowHistoryPage;

