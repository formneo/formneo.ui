import React, { useEffect, useState, useMemo } from "react";
import { Card, Grid, Typography, Divider, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, FormControl, InputLabel, Autocomplete, TextField } from "@mui/material";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { useParams, useSearchParams, useLocation } from "react-router-dom";
import { OrgUnitsApi, OrgUnitListDto } from "api/generated";
import { PositionsApi, PositionListDto } from "api/generated";
import { UserApi, UserAppDto, UserAppDtoWithoutPhoto, EmployeeAssignmentsApi, EmployeeAssignmentListDto, EmployeeAssignmentInsertDto, EmployeeAssignmentUpdateDto } from "api/generated";
import getConfiguration from "confiuration";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { MessageBoxType } from "@ui5/webcomponents-react";

const UserDetail = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation() as any;
  const { id: paramId } = useParams<{ id: string }>();
  
  // User ID'yi query param, location state veya route param'dan al
  const userId = useMemo(() => {
    const id = searchParams.get("id") || location.state?.userId || paramId || "";
    console.log("User ID:", { 
      searchParamsId: searchParams.get("id"), 
      locationStateUserId: location.state?.userId, 
      paramId, 
      finalUserId: id 
    });
    return id;
  }, [searchParams, location.state, paramId]);

  // Tenant modu kontrolü - localStorage'dan kontrol et
  const isTenantMode = useMemo(() => {
    if (typeof window === "undefined") return false;
    const tenantId = localStorage.getItem("selectedTenantId");
    console.log("Tenant Mode Check:", { tenantId, isTenantMode: !!tenantId });
    return Boolean(tenantId);
  }, []);

  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();
  
  const [user, setUser] = useState<UserAppDto | null>(null);
  const [orgUnits, setOrgUnits] = useState<OrgUnitListDto[]>([]);
  const [positions, setPositions] = useState<PositionListDto[]>([]);
  const [managers, setManagers] = useState<UserAppDtoWithoutPhoto[]>([]);
  const [openAssign, setOpenAssign] = useState(false);
  const [selectedOrgUnit, setSelectedOrgUnit] = useState<string>("");
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [selectedManager, setSelectedManager] = useState<UserAppDtoWithoutPhoto | null>(null);
  
  // Mevcut atamayı tutmak için
  const [currentAssignment, setCurrentAssignment] = useState<EmployeeAssignmentListDto | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatchBusy({ isBusy: true });
        const conf = getConfiguration();
        
        // Fetch user data
        let userData: UserAppDto | null = null;
        if (userId) {
          const userApi = new UserApi(conf);
          const userResponse = await userApi.apiUserGet(userId);
          userData = userResponse.data;
          setUser(userData);
        }
        
        // Fetch org units, positions, and managers
        const [orgUnitsResponse, positionsResponse, managersResponse] = await Promise.all([
          new OrgUnitsApi(conf).apiOrgUnitsGet(),
          new PositionsApi(conf).apiPositionsGet(),
          new UserApi(conf).apiUserGetAllWithOuthPhotoGet(),
        ]);
        
        setOrgUnits(orgUnitsResponse.data || []);
        setPositions(positionsResponse.data || []);
        setManagers(managersResponse.data || []);

        // Tenant modundaysa mevcut atamaları çek
        if (isTenantMode && userId && userData) {
          await fetchCurrentAssignments(userId, managersResponse.data || [], userData);
        }
      } catch (error) {
        console.error("Veri yüklenirken hata oluştu:", error);
        dispatchAlert({ 
          message: "Veri yüklenirken hata oluştu: " + error, 
          type: MessageBoxType.Error 
        });
      } finally {
        dispatchBusy({ isBusy: false });
      }
    };
    
    fetchData();
  }, [userId, isTenantMode]);

  // Mevcut atamayı çek (EmployeeAssignmentsApi kullanarak)
  const fetchCurrentAssignments = async (uid: string, managersList: UserAppDtoWithoutPhoto[], userData: UserAppDto) => {
    try {
      const conf = getConfiguration();
      const tenantId = localStorage.getItem("selectedTenantId");
      
      if (!tenantId) return;

      // EmployeeAssignmentsApi ile aktif atamayı al
      const employeeAssignmentsApi = new EmployeeAssignmentsApi(conf);
      const response = await employeeAssignmentsApi.apiEmployeeAssignmentsUserUserIdActiveGet(uid, {
        headers: { 'X-Tenant-Id': tenantId }
      } as any);
      
      const assignment: EmployeeAssignmentListDto = (response as any)?.data;
      
      if (assignment) {
        setCurrentAssignment(assignment);
        setSelectedOrgUnit(assignment.orgUnitId || "");
        setSelectedPosition(assignment.positionId || "");
        
        if (assignment.managerId && managersList.length > 0) {
          const manager = managersList.find(m => m.id === assignment.managerId);
          if (manager) {
            setSelectedManager(manager);
          } else {
            setSelectedManager(null);
          }
        } else {
          setSelectedManager(null);
        }
      } else {
        // Aktif atama yoksa, user'dan bilgileri al (fallback)
        setSelectedOrgUnit(userData.orgUnitId || "");
        setSelectedPosition(userData.positionId || "");
        const managerId = (userData as any).mainManagerUserAppId;
        if (managerId && managersList.length > 0) {
          const manager = managersList.find(m => m.id === managerId);
          if (manager) setSelectedManager(manager);
        } else {
          setSelectedManager(null);
        }
      }
    } catch (error) {
      console.error("Atama bilgileri yüklenirken hata:", error);
      // Hata durumunda user'dan bilgileri al (fallback)
      setSelectedOrgUnit(userData.orgUnitId || "");
      setSelectedPosition(userData.positionId || "");
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

      // EmployeeAssignmentsApi ile atama yap
      const employeeAssignmentsApi = new EmployeeAssignmentsApi(conf);
      
      if (currentAssignment?.id) {
        // Mevcut atama varsa güncelle
        const updateDto: EmployeeAssignmentUpdateDto = {
          id: currentAssignment.id,
          orgUnitId: selectedOrgUnit || null,
          positionId: selectedPosition || null,
          managerId: selectedManager?.id || null,
        };
        
        await employeeAssignmentsApi.apiEmployeeAssignmentsPut(updateDto, {
          headers: { 'X-Tenant-Id': tenantId }
        } as any);
      } else {
        // Yeni atama oluştur
        const insertDto: EmployeeAssignmentInsertDto = {
          userId: userId,
          orgUnitId: selectedOrgUnit || null,
          positionId: selectedPosition || null,
          managerId: selectedManager?.id || null,
        };
        
        await employeeAssignmentsApi.apiEmployeeAssignmentsPost(insertDto, {
          headers: { 'X-Tenant-Id': tenantId }
        } as any);
      }
      
      // User bilgisini de güncelle (fallback için)
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
      
      // Local state güncelle
      setUser(updateData);
      
      // Atama bilgilerini yeniden yükle
      if (user) {
        await fetchCurrentAssignments(userId, managers, user);
      }
      
      dispatchAlert({ 
        message: "Atama başarıyla yapıldı", 
        type: MessageBoxType.Success 
      });
      
      setOpenAssign(false);
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

  if (!user) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <Card sx={{ p: 3 }}>
              <Typography>Kullanıcı yükleniyor...</Typography>
            </Card>
          </Grid>
        </Grid>
        <Footer />
      </DashboardLayout>
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
    <DashboardLayout>
      <DashboardNavbar />
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Profil */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Profil</Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography><b>Ad Soyad:</b> {user.firstName || ""} {user.lastName || ""}</Typography>
            <Typography><b>Kullanıcı Adı:</b> {user.userName || "-"}</Typography>
            <Typography><b>E-posta:</b> {user.email || "-"}</Typography>
            <Typography>
              <b>Durum:</b> <Chip 
                label={user.isBlocked ? "Pasif" : "Aktif"} 
                color={user.isBlocked ? "default" : "success"} 
                size="small" 
              />
            </Typography>
          </Card>
        </Grid>
        {/* Organization */}
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Organization</Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography><b>Departman:</b> {orgUnitName}</Typography>
            <Typography><b>Pozisyon:</b> {positionName}</Typography>
            <Typography><b>Yönetici:</b> {managerName}</Typography>
            <Divider sx={{ my: 2 }} />
            {/* Atama butonu sadece tenant modunda göster */}
            {isTenantMode && (
              <Button variant="contained" color="info" onClick={() => {
                // Mevcut değerleri modal'a yükle
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
                setOpenAssign(true);
              }}>
                Departman / Pozisyon / Yönetici Ata
              </Button>
            )}
            {!isTenantMode && (
              <Typography variant="caption" color="text.secondary">
                Atama yapmak için tenant modunda olmanız gerekmektedir.
              </Typography>
            )}
          </Card>
        </Grid>
      </Grid>
      {/* Atama Modalı - Sadece tenant modunda göster */}
      {isTenantMode && (
        <Dialog open={openAssign} onClose={() => setOpenAssign(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Departman / Pozisyon / Yönetici Ata</DialogTitle>
        <DialogContent>
            <FormControl fullWidth sx={{ mb: 2, mt: 2 }}>
            <InputLabel>Departman</InputLabel>
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
            <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Pozisyon</InputLabel>
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
        </DialogContent>
        <DialogActions>
            <Button onClick={() => {
              setOpenAssign(false);
              setSelectedOrgUnit("");
              setSelectedPosition("");
              setSelectedManager(null);
            }}>
              İptal
            </Button>
            <Button 
              onClick={handleAssign} 
              variant="contained" 
              color="info" 
              disabled={!selectedOrgUnit || !selectedPosition}
            >
              Ata
            </Button>
        </DialogActions>
      </Dialog>
      )}
      <Footer />
    </DashboardLayout>
  );
};

export default UserDetail;
