import React, { useEffect, useMemo, useState } from "react";
import { Card, Grid, Autocomplete, TextField } from "@mui/material";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ClientApi, UserApi, UserAppDtoOnlyNameId, UserTenantsApi, UserTenantBulkAssignUsersDto } from "api/generated/api";
import getConfiguration from "confiuration";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { PickList } from "primereact/picklist";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "layouts/pages/roles/RoleScreen/index.css";

type Option = { id: string; label: string };
type AssignmentItem = { userId: string; label: string; assignmentId?: string };

function UserTenantsDetail(): JSX.Element {
    const navigate = useNavigate();
    const location = useLocation() as any;
    const [searchParams] = useSearchParams();
    const id = searchParams.get("id");
    const dispatchBusy = useBusy();

    const clientApi = new ClientApi(getConfiguration());
    const userApi = new UserApi(getConfiguration());
    const userTenantsApi = new UserTenantsApi(getConfiguration());

    const [allUsers, setAllUsers] = useState<Option[]>([]);
    const [tenants, setTenants] = useState<Option[]>([]);
    const [selectedTenant, setSelectedTenant] = useState<Option | null>(null);
    const [source, setSource] = useState<AssignmentItem[]>([]);
    const [target, setTarget] = useState<AssignmentItem[]>([]);
    const existingAssignmentsRef = React.useRef<Map<string, string>>(new Map());

    useEffect(() => {
        const load = async () => {
            try {
                dispatchBusy({ isBusy: true });
                const [usersRes, tenantsRes] = await Promise.all([
                    userApi.apiUserGetAllWithOuthPhotoGet(),
                    clientApi.apiClientGet(),
                ]);
                const usersPayload: UserAppDtoOnlyNameId[] = (usersRes as any)?.data || [];
                const mappedUsers: Option[] = (usersPayload || []).map((u) => ({
                    id: String(u.id || ""),
                    label: ("" + (u.firstName || "") + " " + (u.lastName || "")).trim() || (u.userName || "-"),
                }));


                setAllUsers(mappedUsers);
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
                const mappedTenants: Option[] = tenantList.map((t: any) => ({ id: String(t.id || t.clientId || t.uid), label: t.name || t.clientName || t.title || "-" }));
                setTenants(mappedTenants);

                // Eğer URL'den tenant id geldiyse, seçimi yap ve atamaları yükle
                if (id) {
                    const match = mappedTenants.find((t) => t.id === id) || null;
                    setSelectedTenant(match);
                    if (match?.id) {
                        await loadAssignments(match.id, mappedUsers);
                    }
                }
            } finally {
                dispatchBusy({ isBusy: false });
            }
        };
        load();
    }, []);

    const loadAssignments = async (tenantId: string, usersForSource?: Option[]) => {
        try {
            const res = await userTenantsApi.apiUserTenantsByTenantTenantIdGet(tenantId);


            const payload: any = (res as any)?.data;
            const list: any[] = Array.isArray(payload)
                ? payload
                : Array.isArray(payload?.items)
                    ? payload.items
                    : Array.isArray(payload?.data)
                        ? payload.data
                        : Array.isArray(payload?.result)
                            ? payload.result
                            : [];
            const currentAssigned: AssignmentItem[] = list.map((x: any) => {
                const userId = String(x.userId ?? "");
                const display = (x.userFullName ?? "-") as string;
                const assignmentId = x.id ? String(x.id) : undefined;
                return { userId, label: display, assignmentId };
            });
            // build source from allUsers minus assigned userIds (ensure user list available)
            const baseUsers = (usersForSource && usersForSource.length > 0) ? usersForSource : (allUsers || []);
            const assignedIds = new Set(currentAssigned.map((a) => a.userId));
            const sourceItems: AssignmentItem[] = baseUsers
                .filter((u) => !assignedIds.has(u.id))
                .map((u) => ({ userId: u.id, label: u.label }));
            // fill map of existing assignment ids
            const map = new Map<string, string>();
            currentAssigned.forEach((a) => {
                if (a.assignmentId) map.set(a.userId, a.assignmentId);
            });
            existingAssignmentsRef.current = map;
            setSource(sourceItems);
            setTarget(currentAssigned);
        } catch (e) {
            const baseUsers = (usersForSource && usersForSource.length > 0) ? usersForSource : (allUsers || []);
            setSource(baseUsers.map((u) => ({ userId: u.id, label: u.label })));
            setTarget([]);
            existingAssignmentsRef.current = new Map();
        }
    };

    return (
        <DashboardLayout>
            <DashboardNavbar />
            <Card>
                <MDBox p={3}>
                    <MDBox p={3} pb={0}>
                        <MDTypography variant="h4" gutterBottom>
                            {id ? "Tenanta Bağlı Kullanıcılar" : "Yeni Kullanıcı Ataması"}
                        </MDTypography>
                        {location?.state?.tenant?.name && (
                            <MDTypography variant="button" color="text" gutterBottom>
                                Seçili Tenant: {location.state.tenant.name}
                            </MDTypography>
                        )}
                    </MDBox>

                    <Grid container>
                        <Grid item xs={12} lg={6}>
                            <MDBox mt={3} p={3} mb={-3}>
                                <Autocomplete
                                    options={tenants}
                                    getOptionLabel={(o) => o.label}
                                    value={selectedTenant}
                                    onChange={async (e, v) => {
                                        setSelectedTenant(v);
                                        if (v?.id) await loadAssignments(v.id, allUsers);
                                    }}
                                    renderInput={(params) => <TextField {...params} label="Tenant" fullWidth />}
                                    disabled={Boolean(id)}
                                />
                            </MDBox>
                        </Grid>
                    </Grid>
                </MDBox>

                <div className="surface-card shadow-2 border-round p-4 m-4">
                    <PickList
                        dataKey="userId"
                        source={source}
                        target={target}
                        onChange={(event) => {
                            setSource(event.source as AssignmentItem[]);
                            setTarget(event.target as AssignmentItem[]);
                        }}
                        itemTemplate={(item: AssignmentItem) => (
                            <div className="flex align-items-center p-3 w-full">
                                <div className="flex flex-column" style={{ width: "100%" }}>
                                    <Grid container alignItems="center">
                                        <Grid item xs={12} lg={0.7}>
                                            <i className="pi pi-user" style={{ marginTop: "0.3rem", marginRight: "0.5rem", fontSize: "1.25rem" }}></i>
                                        </Grid>
                                        <Grid container lg={11.3}>
                                            <Grid item xs={12}>
                                                <span className="font-bold text-lg" style={{ fontWeight: 600 }}>{item.label}</span>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </div>
                            </div>
                        )}
                        filter
                        filterBy="label"
                        breakpoint="1280px"
                        sourceHeader={
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <MDTypography style={{ color: "#757ce8" }}>Kullanıcılar</MDTypography>
                            </div>
                        }
                        targetHeader={
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <MDTypography style={{ color: "#757ce8" }}>Atanmış Kullanıcılar</MDTypography>
                            </div>
                        }
                        sourceStyle={{ height: "24rem", width: "100%" }}
                        targetStyle={{ height: "24rem", width: "100%" }}
                        showSourceControls={false}
                        showTargetControls={false}
                        className="picklist-custom"
                    />
                </div>

                <MDBox p={3}>
                    <MDBox p={2}>
                        <MDBox display="flex" justifyContent="flex-end">
                            <MDBox mr={2}>
                                <MDButton onClick={() => {
                                    const backTo = location?.state?.backTo as string | undefined;
                                    const tenant = location?.state?.tenant as { id: string; name: string } | undefined;
                                    if (backTo && tenant) {
                                        navigate(backTo, { state: { tenant } });
                                    } else {
                                        navigate("/tenantsuser");
                                    }
                                }} variant="outlined" color="error">
                                    İptal
                                </MDButton>
                            </MDBox>
                            <MDButton
                                onClick={async () => {
                                    if (!selectedTenant?.id) return;
                                    try {
                                        const dto: UserTenantBulkAssignUsersDto = {
                                            tenantId: selectedTenant.id,
                                            userIds: target.map((t) => t.userId),
                                            isActive: true,
                                        };
                                        await userTenantsApi.apiUserTenantsBulkAssignUsersPost(dto);

                                        const backTo = location?.state?.backTo as string | undefined;
                                        const tenant = location?.state?.tenant as { id: string; name: string } | undefined;
                                        if (backTo && tenant) {
                                            navigate(backTo, { state: { tenant } });
                                        } else {
                                            navigate("/tenantsuser");
                                        }
                                    } catch (e) {
                                        console.error(e);
                                    }
                                }}
                                variant="gradient"
                                color="info"
                            >
                                Kaydet
                            </MDButton>
                        </MDBox>
                    </MDBox>
                </MDBox>
            </Card>
            <Footer />
        </DashboardLayout>
    );
}

export default UserTenantsDetail;


