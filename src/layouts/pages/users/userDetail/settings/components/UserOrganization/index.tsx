import React, { useEffect, useState, useMemo } from "react";
import { Card, Grid, Typography, Divider, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, FormControl, InputLabel, Autocomplete, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Paper, Icon } from "@mui/material";
import Timeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineDot from "@mui/lab/TimelineDot";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import { OrgUnitsApi, OrgUnitListDto } from "api/generated";
import { PositionsApi, PositionListDto } from "api/generated";
import { UserApi, UserAppDto, UserAppDtoWithoutPhoto, EmployeeAssignmentsApi, EmployeeAssignmentListDto, EmployeeAssignmentInsertDto, EmployeeAssignmentUpdateDto } from "api/generated";
import getConfiguration from "confiuration";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { MessageBoxType } from "@ui5/webcomponents-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

type Props = {
  userId?: string;
};

function UserOrganization({ userId }: Props): JSX.Element {
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();
  
  const isTenantMode = useMemo(() => {
    return Boolean(typeof window !== "undefined" ? localStorage.getItem("selectedTenantId") : null);
  }, []);

  const [orgUnits, setOrgUnits] = useState<OrgUnitListDto[]>([]);
  const [positions, setPositions] = useState<PositionListDto[]>([]);
  const [managers, setManagers] = useState<UserAppDtoWithoutPhoto[]>([]);
  const [user, setUser] = useState<UserAppDto | null>(null);
  const [openAssign, setOpenAssign] = useState(false);
  const [selectedOrgUnit, setSelectedOrgUnit] = useState<string>("");
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [selectedManager, setSelectedManager] = useState<UserAppDtoWithoutPhoto | null>(null);
  const [currentAssignment, setCurrentAssignment] = useState<EmployeeAssignmentListDto | null>(null);
  const [actualUserId, setActualUserId] = useState<string | null>(null);
  const [assignmentHistory, setAssignmentHistory] = useState<EmployeeAssignmentListDto[]>([]);
  const [selectedStartDate, setSelectedStartDate] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      console.log("UserOrganization: userId yok", { userId });
      return;
    }
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        dispatchBusy({ isBusy: true });
        console.log("UserOrganization: Veri çekiliyor...", { userId });
        const conf = getConfiguration();
        
        // 1. Kullanıcı bilgilerini çek - GetById endpoint'ini kullan
        const userApi = new UserApi(conf);
        console.log("UserOrganization: apiUserGetByIdGet çağrılıyor...", { userId });
        const userResponse = await userApi.apiUserGetByIdUserIdGet(userId);
        console.log("UserOrganization: apiUserGetByIdGet yanıtı", { userResponse });
        const userData = userResponse.data;
        
        if (!userData) {
          console.error("UserOrganization: Kullanıcı verisi bulunamadı", { userId, userResponse });
          dispatchAlert({ 
            message: "Kullanıcı verisi bulunamadı", 
            type: MessageBoxType.Error 
          });
          return;
        }
        
        console.log("UserOrganization: Kullanıcı verisi alındı", { userData });
        setUser(userData);
        
        // Gerçek kullanıcı ID'sini al (userData.id kullanıyoruz çünkü bu GUID formatında)
        const realUserId = userData.id || userId;
        setActualUserId(realUserId);
        
        // 2. Departmanlar, pozisyonlar ve yöneticileri paralel çek
        console.log("UserOrganization: Departman, pozisyon ve yöneticiler çekiliyor...");
        const [orgUnitsResponse, positionsResponse, managersResponse] = await Promise.all([
          new OrgUnitsApi(conf).apiOrgUnitsGet(),
          new PositionsApi(conf).apiPositionsGet(),
          new UserApi(conf).apiUserGetAllWithOuthPhotoGet(),
        ]);
        
        setOrgUnits(orgUnitsResponse.data || []);
        setPositions(positionsResponse.data || []);
        setManagers(managersResponse.data || []);

        // 3. Tenant modundaysa aktif organizasyonu ve tarihçeyi çek
        if (isTenantMode && userData && realUserId) {
          console.log("UserOrganization: Tenant modu aktif, organizasyon bilgileri çekiliyor...", { realUserId });
          await Promise.all([
            fetchActiveOrganization(realUserId),
            fetchOrganizationHistory(realUserId)
          ]);
        } else if (userData) {
          setSelectedOrgUnit(userData.orgUnitId || "");
          setSelectedPosition(userData.positionId || "");
        }
      } catch (error: any) {
        console.error("UserOrganization: Veri yüklenirken hata:", error);
        console.error("UserOrganization: Hata detayları:", {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
          userId
        });
        const errorMessage = error?.response?.data?.message || error?.message || "Bilinmeyen hata";
        setError(errorMessage);
        dispatchAlert({ 
          message: "Veri yüklenirken hata oluştu: " + errorMessage, 
          type: MessageBoxType.Error 
        });
        // Hata durumunda bile user state'ini temizle ki loading durumu kalmasın
        setUser(null);
      } finally {
        setLoading(false);
        dispatchBusy({ isBusy: false });
      }
    };
    
    fetchData();
  }, [userId, isTenantMode]);

  const fetchActiveOrganization = async (uid: string) => {
    try {
      const conf = getConfiguration();
      const tenantId = localStorage.getItem("selectedTenantId");
      
      if (!tenantId) return;

      // GetCurrentUserActiveOrganization endpoint'ini UserApi ile kullan
      const userApi = new UserApi(conf);
      const response = await userApi.apiUserGetCurrentUserActiveOrganizationUserIdGet(uid, {
        headers: { 'X-Tenant-Id': tenantId }
      } as any);
      
      const activeOrg: EmployeeAssignmentListDto = (response as any)?.data;
      
      if (activeOrg) {
        setCurrentAssignment(activeOrg);
        setSelectedOrgUnit(activeOrg.orgUnitId || "");
        setSelectedPosition(activeOrg.positionId || "");
        
        if (activeOrg.managerId && managers.length > 0) {
          const manager = managers.find(m => m.id === activeOrg.managerId);
          if (manager) {
            setSelectedManager(manager);
          } else {
            setSelectedManager(null);
          }
        } else {
          setSelectedManager(null);
        }
      } else {
        // Fallback: user'dan bilgileri al
        if (user) {
          setSelectedOrgUnit(user.orgUnitId || "");
          setSelectedPosition(user.positionId || "");
        }
      }
    } catch (error) {
      console.error("Aktif organizasyon bilgileri yüklenirken hata:", error);
      // Hata durumunda fallback kullan
      if (user) {
        setSelectedOrgUnit(user.orgUnitId || "");
        setSelectedPosition(user.positionId || "");
      }
    }
  };
  


  const fetchOrganizationHistory = async (uid: string) => {
    try {
      const conf = getConfiguration();
      const tenantId = localStorage.getItem("selectedTenantId");
      
      if (!tenantId) return;

      // GetCurrentUserOrganizationHistory endpoint'ini UserApi ile kullan
      const userApi = new UserApi(conf);
      const response = await userApi.apiUserGetCurrentUserOrganizationHistoryUserIdGet(uid, {
        headers: { 'X-Tenant-Id': tenantId }
      } as any);
      
      const history: EmployeeAssignmentListDto[] = Array.isArray((response as any)?.data) 
        ? (response as any).data 
        : [];
      
      // Tarihe göre sırala (en yeni en üstte)
      const sorted = history.sort((a, b) => {
        const dateA = new Date(a.startDate || a.createdDate || 0).getTime();
        const dateB = new Date(b.startDate || b.createdDate || 0).getTime();
        return dateB - dateA;
      });
      
      setAssignmentHistory(sorted);
    } catch (error) {
      console.error("Organizasyon tarihçesi yüklenirken hata:", error);
      setAssignmentHistory([]);
    }
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd.MM.yyyy HH:mm", { locale: tr });
    } catch {
      return dateString;
    }
  };

  const handleAssign = async () => {
    if (!user || !selectedOrgUnit || !selectedPosition) {
      dispatchAlert({ 
        message: "Lütfen departman ve pozisyon seçiniz", 
        type: MessageBoxType.Warning 
      });
      return;
    }
    
    if (!isTenantMode) {
      dispatchAlert({ 
        message: "Bu işlem sadece tenant modunda yapılabilir", 
        type: MessageBoxType.Warning 
      });
      return;
    }
    
    try {
      dispatchBusy({ isBusy: true });
      const conf = getConfiguration();
      const tenantId = localStorage.getItem("selectedTenantId");
      
      if (!tenantId) {
        dispatchAlert({ 
          message: "Tenant ID bulunamadı", 
          type: MessageBoxType.Error 
        });
        return;
      }

      const employeeAssignmentsApi = new EmployeeAssignmentsApi(conf);
      
      // Yeni atama yaparken her zaman INSERT kullanılır (yeni kayıt oluşturulur)
      // Mevcut aktif atama varsa backend tarafında otomatik olarak sonlandırılır
        const realUserId = actualUserId || user.id || userId!;
        const insertDto: EmployeeAssignmentInsertDto = {
          userId: realUserId,
          orgUnitId: selectedOrgUnit || null,
          positionId: selectedPosition || null,
          managerId: selectedManager?.id || null,
        startDate: selectedStartDate ? new Date(selectedStartDate).toISOString() : new Date().toISOString(),
        };
        
        await employeeAssignmentsApi.apiEmployeeAssignmentsPost(insertDto, {
          headers: { 'X-Tenant-Id': tenantId }
        } as any);
      
      const userApi = new UserApi(conf);
      const updateData = {
        ...user,
        orgUnitId: selectedOrgUnit,
        positionId: selectedPosition,
      } as any;
      
      try {
        await userApi.apiUserPut(updateData);
      } catch (userError) {
        console.warn("User güncellemesi yapılamadı:", userError);
      }
      
      setUser(updateData);
      
      // Organizasyon bilgilerini yeniden yükle
      if (realUserId) {
        await Promise.all([
          fetchActiveOrganization(realUserId),
          fetchOrganizationHistory(realUserId)
        ]);
      }
      
      dispatchAlert({ 
        message: "Atama başarıyla yapıldı", 
        type: MessageBoxType.Success 
      });
      
      setOpenAssign(false);
      setSelectedStartDate("");
    } catch (error: any) {
      console.error("Atama yapılırken hata oluştu:", error);
      dispatchAlert({ 
        message: "Atama yapılırken hata oluştu: " + (error?.response?.data?.message || error.message), 
        type: MessageBoxType.Error 
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  if (loading) {
    return (
      <Card sx={{ p: 3 }}>
        <MDBox display="flex" alignItems="center" justifyContent="center" minHeight="200px">
          <MDBox textAlign="center">
            <MDTypography variant="h6" color="text" mb={1}>
              Kullanıcı bilgileri yükleniyor...
            </MDTypography>
            <MDTypography variant="caption" color="text.secondary">
              {userId ? `Kullanıcı ID: ${userId}` : "Kullanıcı ID bekleniyor..."}
            </MDTypography>
          </MDBox>
        </MDBox>
      </Card>
    );
  }

  if (error || !user) {
    return (
      <Card sx={{ p: 3 }}>
        <MDBox display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="200px">
          <Icon sx={{ fontSize: 48, color: "error.main", mb: 2 }}>error_outline</Icon>
          <MDTypography variant="h6" color="error" mb={1}>
            Kullanıcı bilgileri yüklenemedi
          </MDTypography>
          <MDTypography variant="body2" color="text.secondary" mb={2}>
            {error || "Kullanıcı verisi bulunamadı"}
          </MDTypography>
          <MDTypography variant="caption" color="text.secondary">
            {userId ? `Kullanıcı ID: ${userId}` : "Kullanıcı ID belirtilmemiş"}
          </MDTypography>
        </MDBox>
      </Card>
    );
  }

  const orgUnitName = currentAssignment?.orgUnitName || orgUnits.find(ou => ou.id === (currentAssignment?.orgUnitId || user.orgUnitId))?.name || "-";
  const positionName = currentAssignment?.positionName || positions.find(p => p.id === (currentAssignment?.positionId || user.positionId))?.name || "-";
  const managerName = currentAssignment?.managerFullName 
    || (selectedManager 
        ? `${selectedManager.firstName || ""} ${selectedManager.lastName || ""}`.trim() || selectedManager.userName || "-"
        : (currentAssignment?.managerId 
            ? managers.find(m => m.id === currentAssignment.managerId)?.userName || "-"
            : "-"));

  return (
    <>
      {/* Aktif Organizasyon Bilgileri - Modern Kart Tasarımı */}
      <Card 
        sx={{ 
          p: 3, 
          mb: 3,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          borderRadius: 2,
          boxShadow: "0 8px 16px rgba(0,0,0,0.1)"
        }}
      >
        <MDBox display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <MDBox>
            <MDTypography variant="h5" fontWeight="bold" color="white" gutterBottom>
              Aktif Organizasyon
            </MDTypography>
            <MDTypography variant="caption" color="rgba(255,255,255,0.8)">
              Mevcut organizasyon bilgileri
            </MDTypography>
          </MDBox>
          {currentAssignment?.isActive && (
            <Chip 
              label="Aktif" 
              color="success" 
              sx={{ 
                bgcolor: "rgba(255,255,255,0.2)",
                color: "white",
                fontWeight: "bold"
              }}
            />
          )}
        </MDBox>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.2)", my: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <MDBox 
              sx={{ 
                bgcolor: "rgba(255,255,255,0.1)", 
                p: 2, 
                borderRadius: 1,
                backdropFilter: "blur(10px)"
              }}
            >
              <MDBox display="flex" alignItems="center" mb={1}>
                <Icon sx={{ color: "white", mr: 1 }}>business</Icon>
                <MDTypography variant="caption" fontWeight="medium" color="rgba(255,255,255,0.9)">
                  Departman
                </MDTypography>
              </MDBox>
              <MDTypography variant="h6" fontWeight="bold" color="white">
                {orgUnitName}
              </MDTypography>
            </MDBox>
          </Grid>
          <Grid item xs={12} md={4}>
            <MDBox 
              sx={{ 
                bgcolor: "rgba(255,255,255,0.1)", 
                p: 2, 
                borderRadius: 1,
                backdropFilter: "blur(10px)"
              }}
            >
              <MDBox display="flex" alignItems="center" mb={1}>
                <Icon sx={{ color: "white", mr: 1 }}>work</Icon>
                <MDTypography variant="caption" fontWeight="medium" color="rgba(255,255,255,0.9)">
                  Pozisyon
            </MDTypography>
              </MDBox>
              <MDTypography variant="h6" fontWeight="bold" color="white">
              {positionName}
            </MDTypography>
            </MDBox>
          </Grid>
          <Grid item xs={12} md={4}>
            <MDBox 
              sx={{ 
                bgcolor: "rgba(255,255,255,0.1)", 
                p: 2, 
                borderRadius: 1,
                backdropFilter: "blur(10px)"
              }}
            >
              <MDBox display="flex" alignItems="center" mb={1}>
                <Icon sx={{ color: "white", mr: 1 }}>supervisor_account</Icon>
                <MDTypography variant="caption" fontWeight="medium" color="rgba(255,255,255,0.9)">
                  Yönetici
            </MDTypography>
              </MDBox>
              <MDTypography variant="h6" fontWeight="bold" color="white">
              {managerName}
            </MDTypography>
            </MDBox>
          </Grid>
          {currentAssignment?.startDate && (
            <Grid item xs={12}>
              <MDBox 
                sx={{ 
                  bgcolor: "rgba(255,255,255,0.1)", 
                  p: 2, 
                  borderRadius: 1,
                  backdropFilter: "blur(10px)"
                }}
              >
                <MDBox display="flex" alignItems="center">
                  <Icon sx={{ color: "white", mr: 1 }}>event</Icon>
                  <MDTypography variant="body2" color="rgba(255,255,255,0.9)">
                    Başlangıç Tarihi: <strong>{formatDate(currentAssignment.startDate)}</strong>
                  </MDTypography>
                </MDBox>
              </MDBox>
            </Grid>
          )}
        </Grid>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.2)", my: 2 }} />
        {isTenantMode ? (
          <MDButton 
            variant="contained"
            sx={{
              bgcolor: "white",
              color: "#667eea",
              fontWeight: "bold",
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.9)",
              }
            }}
            onClick={() => {
              setSelectedOrgUnit(currentAssignment?.orgUnitId || user.orgUnitId || "");
              setSelectedPosition(currentAssignment?.positionId || user.positionId || "");
              if (currentAssignment?.managerId) {
                const manager = managers.find(m => m.id === currentAssignment.managerId);
                if (manager) {
                  setSelectedManager(manager);
                } else {
                  setSelectedManager(null);
                }
              } else {
                setSelectedManager(null);
              }
              setSelectedStartDate(currentAssignment?.startDate 
                ? new Date(currentAssignment.startDate).toISOString().slice(0, 16)
                : new Date().toISOString().slice(0, 16));
              setOpenAssign(true);
            }}
            startIcon={<Icon>add</Icon>}
          >
            Yeni Atama Yap
          </MDButton>
        ) : (
          <MDTypography variant="caption" color="rgba(255,255,255,0.8)">
            Atama yapmak için tenant modunda olmanız gerekmektedir.
          </MDTypography>
        )}
      </Card>

      {/* Organizasyon Tarihçesi - Timeline Tasarımı */}
      {isTenantMode && assignmentHistory.length > 0 && (
        <Card sx={{ p: 3 }}>
          <MDBox display="flex" alignItems="center" mb={2}>
            <Icon sx={{ mr: 1, color: "info.main" }}>history</Icon>
            <MDTypography variant="h6" fontWeight="bold">
              Organizasyon Tarihçesi
            </MDTypography>
          </MDBox>
          <Divider sx={{ mb: 3 }} />
          <Timeline position="right" sx={{ p: 0 }}>
            {assignmentHistory.map((assignment, index) => {
              const isActive = assignment.isActive;
              const isLast = index === assignmentHistory.length - 1;
              const orgUnitName = assignment.orgUnitName || "-";
              const positionName = assignment.positionName || "-";
              const managerName = assignment.managerFullName || "-";
              
              return (
                <TimelineItem key={assignment.id || index}>
                  <TimelineSeparator>
                    <TimelineDot 
                      color={isActive ? "success" : "grey"} 
                      variant={isActive ? "filled" : "outlined"}
                      sx={{ 
                        width: 40, 
                        height: 40,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Icon fontSize="small">
                        {isActive ? "check_circle" : "history"}
                      </Icon>
                    </TimelineDot>
                    {!isLast && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Paper 
                      elevation={isActive ? 4 : 1}
                      sx={{ 
                        p: 2.5, 
                        mb: 2,
                        borderRadius: 2,
                        border: isActive ? "2px solid" : "1px solid",
                        borderColor: isActive ? "success.main" : "divider",
                        bgcolor: isActive ? "success.light" : "background.paper",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          transform: "translateX(4px)",
                          boxShadow: 4
                        }
                      }}
                    >
                      <MDBox display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                        <MDBox>
                          <MDTypography variant="h6" fontWeight="bold" color={isActive ? "success.dark" : "text"}>
                            {orgUnitName}
                          </MDTypography>
                          <MDTypography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {positionName}
                          </MDTypography>
                        </MDBox>
                        <Chip 
                          label={isActive ? "Aktif" : "Geçmiş"} 
                          color={isActive ? "success" : "default"} 
                          size="small"
                          sx={{ fontWeight: "bold" }}
                        />
                      </MDBox>
                      <Grid container spacing={2} mt={1}>
                        <Grid item xs={12} sm={6}>
                          <MDBox display="flex" alignItems="center">
                            <Icon sx={{ mr: 1, fontSize: 18, color: "text.secondary" }}>supervisor_account</Icon>
                            <MDTypography variant="caption" color="text.secondary">
                              <strong>Yönetici:</strong> {managerName}
                            </MDTypography>
                          </MDBox>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <MDBox display="flex" alignItems="center">
                            <Icon sx={{ mr: 1, fontSize: 18, color: "text.secondary" }}>event</Icon>
                            <MDTypography variant="caption" color="text.secondary">
                              <strong>Başlangıç:</strong> {formatDate(assignment.startDate)}
                            </MDTypography>
                          </MDBox>
                        </Grid>
                        {assignment.endDate && (
                          <Grid item xs={12} sm={6}>
                            <MDBox display="flex" alignItems="center">
                              <Icon sx={{ mr: 1, fontSize: 18, color: "text.secondary" }}>event_busy</Icon>
                              <MDTypography variant="caption" color="text.secondary">
                                <strong>Bitiş:</strong> {formatDate(assignment.endDate)}
                              </MDTypography>
                            </MDBox>
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  </TimelineContent>
                </TimelineItem>
              );
            })}
          </Timeline>
        </Card>
      )}

      {/* Atama Modalı */}
      {isTenantMode && (
        <Dialog open={openAssign} onClose={() => setOpenAssign(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <MDTypography variant="h6" fontWeight="medium">
              Yeni Atama Yap
            </MDTypography>
          </DialogTitle>
          <DialogContent>
            <MDBox sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel required>Departman</InputLabel>
              <Select
                value={selectedOrgUnit}
                label="Departman"
                onChange={(e) => setSelectedOrgUnit(e.target.value)}
              >
                {orgUnits.map((ou) => (
                  <MenuItem key={ou.id} value={ou.id || ""}>{ou.name || "-"}</MenuItem>
                ))}
              </Select>
            </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
            <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel required>Pozisyon</InputLabel>
              <Select
                value={selectedPosition}
                label="Pozisyon"
                onChange={(e) => setSelectedPosition(e.target.value)}
              >
                {positions.map((pos) => (
                  <MenuItem key={pos.id} value={pos.id || ""}>{pos.name || "-"}</MenuItem>
                ))}
              </Select>
            </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
            <Autocomplete
              options={managers}
              getOptionLabel={(option) => 
                `${option.firstName || ""} ${option.lastName || ""}`.trim() || option.userName || ""
              }
              value={selectedManager}
              onChange={(event, newValue) => {
                setSelectedManager(newValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Yönetici"
                  placeholder="Yönetici seçiniz (opsiyonel)"
                />
              )}
              sx={{ mb: 2 }}
            />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Etki Başlangıç Tarihi"
                    type="datetime-local"
                    value={selectedStartDate}
                    onChange={(e) => setSelectedStartDate(e.target.value)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    sx={{ mb: 2 }}
                    helperText="Atamanın geçerli olacağı başlangıç tarihi"
                  />
                </Grid>
              </Grid>
            </MDBox>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => {
              setOpenAssign(false);
              setSelectedStartDate("");
            }}>
              İptal
            </Button>
            <MDButton 
              onClick={handleAssign} 
              variant="gradient" 
              color="info" 
              disabled={!selectedOrgUnit || !selectedPosition}
            >
              Ata
            </MDButton>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}

export default UserOrganization;

