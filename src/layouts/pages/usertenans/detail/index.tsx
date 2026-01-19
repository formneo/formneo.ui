import React, { useEffect, useState } from "react";
import { Card, Grid, Autocomplete, TextField, Checkbox, FormControlLabel } from "@mui/material";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ClientApi, UserApi, UserAppDtoOnlyNameId, UserTenantsApi, UserTenantInsertDto, UserTenantUpdateDto } from "api/generated/api";
import getConfiguration from "confiuration";
import { useBusy } from "layouts/pages/hooks/useBusy";

type Option = { id: string; label: string };

function UserTenantsDetail(): JSX.Element {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const id = searchParams.get("id");
    const dispatchBusy = useBusy();

    const clientApi = new ClientApi(getConfiguration());
    const userApi = new UserApi(getConfiguration());
    const userTenantsApi = new UserTenantsApi(getConfiguration());

    const [users, setUsers] = useState<Option[]>([]);
    const [tenants, setTenants] = useState<Option[]>([]);
    const [selectedUser, setSelectedUser] = useState<Option | null>(null);
    const [selectedTenant, setSelectedTenant] = useState<Option | null>(null);
    const [isActive, setIsActive] = useState<boolean>(true);

    useEffect(() => {
        const load = async () => {
            try {
                dispatchBusy({ isBusy: true });
                const [usersRes, tenantsRes] = await Promise.all([
                    userApi.apiUserGetAllWithOuthPhotoGet(),
                    clientApi.apiClientGet(),
                ]);
                const usersPayload: UserAppDtoOnlyNameId[] = (usersRes as any)?.data || [];
                setUsers(
                    (usersPayload || []).map((u) => ({
                        id: String(u.id || ""),
                        label: ("" + (u.firstName || "") + " " + (u.lastName || "")).trim() || (u.userName || "-"),
                    }))
                );
                const tenantsPayload: any = (tenantsRes as any)?.data;
                const tenantList: any[] = Array.isArray(tenantsPayload)
                    ? tenantsPayload
                    : Array.isArray(tenantsPayload?.items)
                        ? tenantsPayload.items
                        : Array.isArray(tenantsPayload?.data)
                            ? tenantsPayload.data
                            : Array.isArray(tenantsPayload?.result)
                                ? tenantsPayload.result
                                : [];
                setTenants(
                    tenantList.map((t: any) => ({ id: t.id || t.clientId || t.uid, label: t.name || t.clientName || t.title || "-" }))
                );
            } finally {
                dispatchBusy({ isBusy: false });
            }
        };
        load();
    }, []);

    const handleSave = async () => {
        try {
            if (id) {
                const dto: UserTenantUpdateDto = { id, isActive };
                await userTenantsApi.apiUserTenantsPut(dto);
            } else {
                if (!selectedUser?.id || !selectedTenant?.id) return;
                const dto: UserTenantInsertDto = { userId: selectedUser.id, tenantId: selectedTenant.id, isActive };
                await userTenantsApi.apiUserTenantsPost(dto);
            }
            navigate("/usertenans");
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <DashboardLayout>
            <DashboardNavbar />
            <MDBox py={3}>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Card sx={{ p: 3 }}>
                            <MDBox mb={3}>
                                <MDTypography variant="h5" fontWeight="bold">
                                    {id ? "User Tenant Düzenle" : "Yeni User Tenant"}
                                </MDTypography>
                            </MDBox>

                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Autocomplete
                                        options={users}
                                        getOptionLabel={(o) => o.label}
                                        value={selectedUser}
                                        onChange={(e, v) => setSelectedUser(v)}
                                        renderInput={(params) => <TextField {...params} label="Kullanıcı" fullWidth />}
                                        disabled={Boolean(id)}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Autocomplete
                                        options={tenants}
                                        getOptionLabel={(o) => o.label}
                                        value={selectedTenant}
                                        onChange={(e, v) => setSelectedTenant(v)}
                                        renderInput={(params) => <TextField {...params} label="Tenant" fullWidth />}
                                        disabled={Boolean(id)}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={<Checkbox checked={isActive} onChange={(e, checked) => setIsActive(checked)} />}
                                        label={<MDTypography variant="button">Aktif</MDTypography>}
                                    />
                                </Grid>
                            </Grid>

                            <MDBox mt={4} display="flex" justifyContent="space-between">
                                <MDButton variant="outlined" color="info" onClick={() => navigate("/usertenans")}>İptal</MDButton>
                                <MDButton
                                    variant="gradient"
                                    color="info"
                                    onClick={handleSave}
                                    sx={{
                                        backgroundColor: "#3e5d8f",
                                        backgroundImage: "linear-gradient(135deg, #3e5d8f 0%, #2c4a7a 100%)",
                                        textTransform: "none",
                                    }}
                                >
                                    {id ? "Güncelle" : "Oluştur"}
                                </MDButton>
                            </MDBox>
                        </Card>
                    </Grid>
                </Grid>
            </MDBox>
            <Footer />
        </DashboardLayout>
    );
}

export default UserTenantsDetail;


