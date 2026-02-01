import { Card, Grid, Icon, Typography } from "@mui/material";
import { ObjectPage, ObjectPageTitle } from "@ui5/webcomponents-react";
import Tooltip from "@mui/material/Tooltip";
import Chip from "@mui/material/Chip";
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBusy } from "layouts/pages/hooks/useBusy";
import getConfiguration from "confiuration";
import {
    FormAuthApi,
} from "api/generated/api";
import { MessageBoxType } from "@ui5/webcomponents-react";
import { useAlert } from "layouts/pages/hooks/useAlert";
import MessageBox from "layouts/pages/Components/MessageBox";

function FormAuth() {
    const navigate = useNavigate();

    const dispatchBusy = useBusy();
    const dispatchAlert = useAlert();
    const [data, setData] = useState([]);
    const [isQuestionMessageBoxOpen, setIsQuestionMessageBoxOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string>("");

    useEffect(() => {
        fetchTableData(); // Artık sadece tabloyu getiriyoruz
    }, []);

    // Statik (manuel) sütunlar
    const columns = [
        {
            Header: <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>Form</div>,
            accessor: "form",
        },
        {
            Header: (
                <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>
                    Kişiler
                </div>
            ),
            accessor: "relations",
        },
        {
            Header: <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>İşlemler</div>,
            accessor: "actions",
            Cell: ({ row }: any) => (
                <MDBox display="flex" alignItems="center">
                    <>
                        <Icon
                            onClick={() => navigate(`/formAuth/detail/${row.original.id}`)}
                            sx={{ cursor: "pointer", fontSize: "24px" }}
                            style={{ marginRight: "8px" }}
                        >
                            edit
                        </Icon>
                        <Icon
                            sx={{ cursor: "pointer", fontSize: "24px" }}
                            onClick={() => handleOpenQuestionBox(row.original.id)}
                        >
                            delete
                        </Icon>
                    </>
                </MDBox>
            ),
        },
    ];

    const fetchTableData = async () => {
        try {
            dispatchBusy({ isBusy: true });
            const conf = getConfiguration();
            const api = new FormAuthApi(conf);
            const response = await api.apiFormAuthGet();

            const mappedData = response.data.map((item) => {
                // DTO'dan isim alınıyor
                const fromForm = item.form?.formName || "-";
                const usersObjects = item.users || [];

                const usersNames = usersObjects.map((user) => user.userName);

                let displayedRelations;

                if (usersNames.length > 3) {
                    const firstThree = usersNames.slice(0, 3).join(", ");
                    const remaining = usersNames.slice(3).join(", ");

                    displayedRelations = (
                        <>
                            {firstThree},{" "}
                            <Tooltip
                                title={
                                    <React.Fragment>
                                        {remaining.split(", ").map((name, index) => (
                                            <div key={index}>{name}</div>
                                        ))}
                                    </React.Fragment>
                                }
                            >
                                <Chip
                                    label={`+${usersNames.length - 3}`}
                                    size="small"
                                    sx={{ cursor: "pointer", backgroundColor: "#e0e0e0", fontWeight: 500 }}
                                    variant="outlined"
                                />
                            </Tooltip>
                        </>
                    );
                } else {
                    displayedRelations = usersNames.join(", ");
                }

                return {
                    id: item.id,
                    form: `${fromForm} - Rev:${item.form?.revision}`,
                    relations: displayedRelations,
                };
            });

            setData(mappedData);
        } catch (error) {
            dispatchAlert({
                message: "Hata Oluştu",
                type: MessageBoxType.Error,
            });
        } finally {
            dispatchBusy({ isBusy: false });
        }
    };


    const handleOpenQuestionBox = (id: string) => {
        setSelectedId(id);
        setIsQuestionMessageBoxOpen(true);
    };
    const handleCloseQuestionBox = (action: string) => {
        setIsQuestionMessageBoxOpen(false);
        if (action === "Yes") {
            handleDelete(selectedId);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            dispatchBusy({ isBusy: true });
            var conf = getConfiguration();
            var api = new FormAuthApi(conf);
            await api.apiFormAuthIdDelete(id);
            dispatchAlert({
                message: "Form yetkisi silindi.",
                type: MessageBoxType.Success,
            });
            fetchTableData();
            dispatchBusy({ isBusy: false });
        } catch (error) {
            
        } finally {
            dispatchBusy({ isBusy: false });
        }
    };

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
                                    onClick={() => navigate(`/formAuth/detail`)}
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
                                    Yeni Form Yetkisi
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
                                Form Yetkileri
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: "#7b809a",
                                }}
                            >
                                Form Yetkileri
                            </Typography>
                        </MDBox>
                    </ObjectPageTitle>
                }
            >
                <Grid xs={12} lg={6} sx={{ paddingLeft: "3px" }}>
                    <Card style={{ height: "655px" }}>
                        <MDBox>
                            <MDBox>
                                <MDBox height="565px">
                                    <DataTable
                                        canSearch={true}
                                        table={{
                                            columns: columns,
                                            rows: data,
                                        }}
                                    ></DataTable>
                                </MDBox>
                            </MDBox>
                        </MDBox>
                    </Card>
                </Grid>
                <MessageBox
                    isQuestionmessageBoxOpen={isQuestionMessageBoxOpen}
                    handleCloseQuestionBox={handleCloseQuestionBox}
                />
            </ObjectPage>
        </DashboardLayout>
    );
}

export default FormAuth;
