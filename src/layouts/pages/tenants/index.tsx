import React, { useEffect, useMemo, useState } from "react";
import { Card, Grid, Icon, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import DataTable from "examples/Tables/DataTable";
import GlobalCell from "components/GlobalCell";

import { MessageBox, MessageBoxAction, MessageBoxType } from "@ui5/webcomponents-react";
import { ClientApi } from "api/generated/api";
import getConfiguration from "confiuration";
import { useBusy } from "layouts/pages/hooks/useBusy";
function TenantsList(): JSX.Element {
    const navigate = useNavigate();
    const dispatchBusy = useBusy();

    const [rows, setRows] = useState<any[]>([]);
    const [isQuestionMessageBoxOpen, setIsQuestionMessageBoxOpen] = useState(false);
    const [deletedId, setDeletedId] = useState<string>("");

    const clientApi = new ClientApi(getConfiguration());

    const fetchTenants = async () => {
        try {


            dispatchBusy({ isBusy: true });
            const response = await clientApi.apiClientGet();
            const payload: any = (response as any)?.data;
            const list: any[] = Array.isArray(payload)
                ? payload
                : Array.isArray(payload?.items)
                    ? payload.items
                    : Array.isArray(payload?.data)
                        ? payload.data
                        : Array.isArray(payload?.result)
                            ? payload.result
                            : [];

            dispatchBusy({ isBusy: false });
            setRows(
                list.map((item: any) => {
                    const created = item.createdDate || item.createdAt || item.created_on;
                    return {
                        id: item.id || item.clientId || item.uid,
                        name: item.name || item.clientName || item.title || "-",
                        email: item.email || item.billingEmail || item.domain || "-",
                        phoneNumber: item.phoneNumber || "-",
                        plan: item.plan ?? "-",
                        status: item.status ?? "-",
                        customDomain: item.customDomain || "-",
                        domainVerified: Boolean(item.domainVerified ?? false),
                        isActive: Boolean(item.isActive ?? item.active ?? false),
                        createdDate: created ? new Date(created).toLocaleDateString("tr-TR") : "",
                    };
                })
            );

        } catch (error) {
            console.error('Tenant listesi alınamadı:', error);
        }
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    const handleDelete = (id: string) => {
        setDeletedId(id);
        setIsQuestionMessageBoxOpen(true);
    };

    const handleConfirmDelete = async (action: any) => {
        setIsQuestionMessageBoxOpen(false);
        if (action === MessageBoxAction.OK) {
            try {
                await clientApi.apiClientIdDelete(deletedId);
                await fetchTenants();
            } catch (error) {
                console.error('Tenant silinemedi:', error);
            }
            setDeletedId("");
        }
    };

    const table = useMemo(
        () => ({
            columns: [
                {
                    Header: (
                        <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>Ad</div>
                    ),
                    accessor: "name",
                    width: "22%",
                    Cell: ({ row, value, column }: any) => (
                        <GlobalCell value={value} columnName={column.id} testRow={row.original} />
                    ),
                },
                {
                    Header: (
                        <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>E-posta</div>
                    ),
                    accessor: "email",
                    width: "22%",
                    Cell: ({ row, value, column }: any) => (
                        <GlobalCell value={value} columnName={column.id} testRow={row.original} />
                    ),
                },
                {
                    Header: (
                        <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>Telefon</div>
                    ),
                    accessor: "phoneNumber",
                    width: "12%",
                    Cell: ({ row, value, column }: any) => (
                        <GlobalCell value={value} columnName={column.id} testRow={row.original} />
                    ),
                },
                {
                    Header: (
                        <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>Plan</div>
                    ),
                    accessor: "plan",
                    width: "10%",
                    Cell: ({ row, value, column }: any) => (
                        <GlobalCell value={value} columnName={column.id} testRow={row.original} />
                    ),
                },
                {
                    Header: (
                        <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>Durum</div>
                    ),
                    accessor: "status",
                    width: "10%",
                    Cell: ({ row, value, column }: any) => (
                        <GlobalCell value={value} columnName={column.id} testRow={row.original} />
                    ),
                },
                {
                    Header: (
                        <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>Domain</div>
                    ),
                    accessor: "customDomain",
                    width: "14%",
                    Cell: ({ row, value, column }: any) => (
                        <GlobalCell value={value} columnName={column.id} testRow={row.original} />
                    ),
                },
                {
                    Header: (
                        <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>Aktif</div>
                    ),
                    accessor: "isActive",
                    width: "10%",
                    Cell: ({ row, value, column }: any) => (
                        <GlobalCell value={value} columnName={column.id} testRow={row.original} />
                    ),
                },
                {
                    Header: (
                        <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>Oluşturulma</div>
                    ),
                    accessor: "createdDate",
                    width: "14%",
                    Cell: ({ row, value, column }: any) => (
                        <GlobalCell value={value} columnName={column.id} testRow={row.original} />
                    ),
                },
                {
                    Header: (
                        <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>İşlemler</div>
                    ),
                    accessor: "actions",
                    width: "20%",
                    Cell: ({ row }: any) => (
                        <MDBox mx={2} display="flex" alignItems="center">
                            <Icon
                                style={{ marginRight: "12px", cursor: "pointer" }}
                                onClick={() => navigate(`/tenants/detail/?id=${row.original.id}`)}
                            >
                                edit
                            </Icon>
                            <Icon
                                style={{ marginRight: "12px", cursor: "pointer", color: "#1e88e5" }}
                                onClick={() => navigate(`/tenants/users/?id=${row.original.id}`)}
                            >
                                group_add
                            </Icon>
                            <Icon
                                style={{ color: "#e53935", cursor: "pointer" }}
                                onClick={() => handleDelete(row.original.id)}
                            >
                                delete
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
                                    Tenants
                                </MDTypography>
                                <MDButton
                                    variant="gradient"
                                    color="info"
                                    onClick={() => navigate("/tenants/detail")}
                                    sx={{
                                        backgroundColor: "#3e5d8f",
                                        backgroundImage: "linear-gradient(135deg, #3e5d8f 0%, #2c4a7a 100%)",
                                        textTransform: "none",
                                    }}
                                >
                                    Yeni Tenant
                                </MDButton>
                            </MDBox>

                            <div className="table-container">
                                <DataTable
                                    canSearch={true}
                                    table={table}
                                    getRowProps={(row: any) => (
                                        row.original?.isActive
                                            ? undefined
                                            : { style: { backgroundColor: "#ffebee" } }
                                    )}
                                />
                            </div>
                        </Card>
                    </Grid>
                </Grid>
            </MDBox>
            <Footer />

            <MessageBox
                type={MessageBoxType.Confirm}
                open={isQuestionMessageBoxOpen}
                onClose={handleConfirmDelete}
                titleText="Silme Onayı"
                actions={[MessageBoxAction.OK, MessageBoxAction.Cancel]}
            >
                Seçili tenant silinecek. Devam etmek istiyor musunuz?
            </MessageBox>
        </DashboardLayout>
    );
}

export default TenantsList;