import React, { useEffect, useRef, useState } from "react";
import { Card, Grid } from "@mui/material";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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

function TenantUsersForTenant(): JSX.Element {
    const navigate = useNavigate();
    const location = useLocation() as any;
    const { tenantId } = useParams();
    const dispatchBusy = useBusy();

    const userApi = new UserApi(getConfiguration());
    const userTenantsApi = new UserTenantsApi(getConfiguration());

    const [allUsers, setAllUsers] = useState<Option[]>([]);
    const [target, setTarget] = useState<AssignmentItem[]>([]);
    const [source, setSource] = useState<AssignmentItem[]>([]);
    const existingAssignmentsRef = useRef<Map<string, string>>(new Map());

    useEffect(() => {
        const load = async () => {
            try {
                dispatchBusy({ isBusy: true });
                // 1) Tüm kullanıcıları yükle (ad/soyad)
                const usersRes = await userApi.apiUserGetAllWithOuthPhotoGet(undefined as any);
                const usersPayload: UserAppDtoOnlyNameId[] = (usersRes as any)?.data || [];
                const mappedUsers: Option[] = (usersPayload || []).map((u) => ({
                    id: String(u.id || ""),
                    label: ("" + (u.firstName || "") + " " + (u.lastName || "")).trim() || (u.userName || "-"),
                }));
                setAllUsers(mappedUsers);

                // 2) Tenant atamalarını yükle
                if (tenantId) {
                    await loadAssignments(String(tenantId), mappedUsers);
                }
            } finally {
                dispatchBusy({ isBusy: false });
            }
        };
        load();
    }, [tenantId]);

    const loadAssignments = async (tid: string, usersForSource?: Option[]) => {
        try {
            const res = await userTenantsApi.apiUserTenantsByTenantTenantIdGet(String(tid), {
                headers: { 'X-Tenant-Id': String(tid) },
            } as any);
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

            const baseUsers = (usersForSource && usersForSource.length > 0) ? usersForSource : (allUsers || []);
            const assignedIds = new Set(currentAssigned.map((a) => a.userId));
            const sourceItems: AssignmentItem[] = baseUsers
                .filter((u) => !assignedIds.has(u.id))
                .map((u) => ({ userId: u.id, label: u.label }));

            const map = new Map<string, string>();
            currentAssigned.forEach((a) => { if (a.assignmentId) map.set(a.userId, a.assignmentId); });
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
                            Tenant Kullanıcı Yönetimi
                        </MDTypography>
                        {location?.state?.tenant?.name && (
                            <MDTypography variant="button" color="text" gutterBottom>
                                Seçili Tenant: {location.state.tenant.name}
                            </MDTypography>
                        )}
                    </MDBox>
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
                        sourceHeader={<MDTypography style={{ color: "#757ce8" }}>Kullanıcılar</MDTypography>}
                        targetHeader={<MDTypography style={{ color: "#757ce8" }}>Atanmış Kullanıcılar</MDTypography>}
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
                                        navigate("/tenants/management");
                                    }
                                }} variant="outlined" color="error">
                                    İptal
                                </MDButton>
                            </MDBox>
                            <MDButton
                                onClick={async () => {
                                    if (!tenantId) return;
                                    try {
                                        const dto: UserTenantBulkAssignUsersDto = {
                                            tenantId: String(tenantId),
                                            userIds: target.map((t) => t.userId),
                                            isActive: true,
                                        };
                                        await userTenantsApi.apiUserTenantsBulkAssignUsersPost(dto, {
                                            headers: { 'X-Tenant-Id': String(tenantId) },
                                        } as any);
                                        navigate("/tenants/management");
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

export default TenantUsersForTenant;


