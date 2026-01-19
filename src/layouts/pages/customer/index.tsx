import React, { useMemo, useState } from "react";
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

import {
    ObjectPage,
    ObjectPageTitle,
} from "@ui5/webcomponents-react";

function CustomerList(): JSX.Element {
    const navigate = useNavigate();
    const [rows] = useState<any[]>([]);

    const table = useMemo(
        () => ({
            columns: [
                {
                    Header: (
                        <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>Ad</div>
                    ),
                    accessor: "name",
                    width: "25%",
                    Cell: ({ row, value, column }: any) => (
                        <GlobalCell value={value} columnName={column.id} testRow={row.original} />
                    ),
                },
                {
                    Header: (
                        <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>E-posta</div>
                    ),
                    accessor: "email",
                    width: "25%",
                    Cell: ({ row, value, column }: any) => (
                        <GlobalCell value={value} columnName={column.id} testRow={row.original} />
                    ),
                },
                {
                    Header: (
                        <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>Telefon</div>
                    ),
                    accessor: "phoneNumber",
                    width: "20%",
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
                                onClick={() => navigate(`/customer/detail/?id=${row.original?.id}`)}
                            >
                                edit
                            </Icon>
                            <Icon style={{ color: "#e53935", cursor: "pointer" }}>
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
            <ObjectPage
                mode="Default"
                hidePinButton
                style={{
                    height: "100%",
                    marginTop: "-15px",
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    boxShadow: "0 2px 12px 0 rgba(0,0,0,0.1)",
                }}
                titleArea={
                    <ObjectPageTitle
                        style={{
                            paddingTop: "24px",
                            paddingLeft: "24px",
                            paddingRight: "24px",
                            backgroundColor: "#ffffff",
                            cursor: "default",
                        }}
                        actionsBar={
                            <MDBox style={{ marginTop: "15px", marginRight: "15px" }}>
                                <MDButton
                                    variant="gradient"
                                    color="info"
                                    onClick={() => navigate(`/customer/detail`)}
                                    size="small"
                                    startIcon={<Icon>add</Icon>}
                                    sx={{
                                        marginRight: "0.5rem",
                                        bottom: "11px",
                                        height: "2.25rem",
                                        transition: "all 0.3s ease",
                                        "&:hover": {
                                            transform: "translateY(-1px)",
                                        },
                                    }}
                                >
                                    Yeni Müşteri
                                </MDButton>
                            </MDBox>
                        }
                    >
                        <MDBox>
                            <Typography
                                variant="h5"
                                component="h1"
                                sx={{
                                    fontWeight: 600,
                                    color: "#344767",
                                    marginBottom: "4px",
                                }}
                            >
                                Müşteri Yönetimi
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: "#7b809a",
                                }}
                            >
                                Müşterileri görüntüleyin, oluşturun ve yönetin
                            </Typography>
                        </MDBox>
                    </ObjectPageTitle>
                }
            >
                <Grid xs={12} lg={6} sx={{ paddingLeft: "3px" }}>
                    <Card>
                        <MDBox>
                            <div className="table-container">
                                <DataTable canSearch={true} table={table} />
                            </div>
                        </MDBox>
                    </Card>
                </Grid>
            </ObjectPage>
            <Footer />
        </DashboardLayout>
    );
}

export default CustomerList;


