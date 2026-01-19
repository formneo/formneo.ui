import React, { useEffect, useState } from "react";
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

function UserTenantsList(): JSX.Element {
    const navigate = useNavigate();
    const [rows, setRows] = useState<any[]>([]);

    // Not: Backend bağlanınca UserTenantsApi ile doldurulacak
    useEffect(() => {
        setRows([]);
    }, []);

    const table = {
        columns: [
            {
                Header: <div style={{ fontSize: 16, fontWeight: "bold", color: "black" }}>Kullanıcı</div>,
                accessor: "user",
                width: "30%",
                Cell: ({ row, value, column }: any) => (
                    <GlobalCell value={value} columnName={column.id} testRow={row.original} />
                ),
            },
            {
                Header: <div style={{ fontSize: 16, fontWeight: "bold", color: "black" }}>Tenant</div>,
                accessor: "tenant",
                width: "30%",
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
                            onClick={() => navigate(`/usertenans/detail?id=${row.original.id || ""}`)}
                        >
                            edit
                        </Icon>
                    </MDBox>
                ),
            },
        ],
        rows,
    } as any;

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
                                <MDButton
                                    variant="gradient"
                                    color="info"
                                    onClick={() => navigate("/usertenans/detail")}
                                    sx={{
                                        backgroundColor: "#3e5d8f",
                                        backgroundImage: "linear-gradient(135deg, #3e5d8f 0%, #2c4a7a 100%)",
                                        textTransform: "none",
                                    }}
                                >
                                    Yeni Kayıt
                                </MDButton>
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


