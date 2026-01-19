import React, { useEffect, useMemo, useState } from "react";
import { Card, Grid, Icon } from "@mui/material";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import DataTable from "examples/Tables/DataTable";
import GlobalCell from "components/GlobalCell";

import { useNavigate } from "react-router-dom";
import { ClientApi } from "api/generated/api";
import getConfiguration from "confiuration";
import { useBusy } from "layouts/pages/hooks/useBusy";

type Row = {
    id: string;
    name: string;
    email: string;
    plan: string | number | undefined;
    status: string | number | undefined;
    userCount?: number;
};

function UserTenantsList(): JSX.Element {
    const navigate = useNavigate();
    const dispatchBusy = useBusy();
    const clientApi = new ClientApi(getConfiguration());

    const [rows, setRows] = useState<Row[]>([]);
    // No delete on tenant list here; focus is navigating into assignment screen

    const fetchList = async () => {
        try {
            dispatchBusy({ isBusy: true });
            const res = await clientApi.apiClientGet();
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

            const mapped: Row[] = list.map((t: any) => ({
                id: String(t.id || t.clientId || t.uid || ""),
                name: t.name || t.clientName || t.title || "-",
                email: t.email || t.billingEmail || "",
                plan: t.plan,
                status: t.status,
                userCount:
                    (typeof t.userCount === "number" ? t.userCount : undefined) ??
                    (typeof t.usersCount === "number" ? t.usersCount : undefined) ??
                    (typeof t.tenantUserCount === "number" ? t.tenantUserCount : undefined) ??
                    (typeof t.assignedUserCount === "number" ? t.assignedUserCount : undefined) ??
                    (Array.isArray(t.users) ? t.users.length : undefined) ??
                    (Array.isArray(t.userIds) ? t.userIds.length : undefined) ??
                    0,
            }));

            setRows(mapped);
        } catch (e) {
            setRows([]);
        } finally {
            dispatchBusy({ isBusy: false });
        }
    };

    useEffect(() => {
        fetchList();
    }, []);

    // No delete handlers on tenant list

    const table = useMemo(
        () => ({
            columns: [
                {
                    Header: <div style={{ fontSize: 16, fontWeight: "bold", color: "black" }}>Tenant</div>,
                    accessor: "name",
                    width: "40%",
                    Cell: ({ row, value, column }: any) => (
                        <GlobalCell value={value} columnName={column.id} testRow={row.original} />
                    ),
                },
                {
                    Header: <div style={{ fontSize: 16, fontWeight: "bold", color: "black" }}>E-posta</div>,
                    accessor: "email",
                    width: "30%",
                    Cell: ({ row, value, column }: any) => (
                        <GlobalCell value={value} columnName={column.id} testRow={row.original} />
                    ),
                },
                {
                    Header: <div style={{ fontSize: 16, fontWeight: "bold", color: "black" }}>Kullanıcı Sayısı</div>,
                    accessor: "userCount",
                    width: "10%",
                    Cell: ({ row, value, column }: any) => (
                        <GlobalCell value={value} columnName={column.id} testRow={row.original} />
                    ),
                },
                {
                    Header: <div style={{ fontSize: 16, fontWeight: "bold", color: "black" }}>İşlemler</div>,
                    accessor: "actions",
                    width: "20%",
                    Cell: ({ row }: any) => (
                        <MDBox mx={2} display="flex" alignItems="center">
                            <Icon
                                style={{ marginRight: 12, cursor: "pointer" }}
                                onClick={() => navigate(`/tenantsuser/detail?id=${row.original.id}`)}
                            >
                                edit
                            </Icon>
                        </MDBox>
                    ),
                },
            ],
            rows,
        }),
        [rows, navigate]
    );

    return (
        <DashboardLayout>
            <DashboardNavbar />
            <MDBox py={3}>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Card sx={{ p: 3 }}>
                            <MDBox display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                                <MDTypography variant="h5" fontWeight="bold">
                                    User Tenants
                                </MDTypography>
                                {/* Bu listede sadece tenant'a giriş yapılır */}
                            </MDBox>
                            <div className="table-container">
                                <DataTable canSearch={true} table={table} />
                            </div>
                        </Card>
                    </Grid>
                </Grid>
            </MDBox>
            <Footer />
        </DashboardLayout>
    );
}

export default UserTenantsList;


