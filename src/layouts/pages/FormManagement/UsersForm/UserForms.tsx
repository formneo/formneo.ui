import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import React, { useEffect, useState } from "react";
import {
    Card,
    Grid,
    Icon,
    Tooltip,
    Typography,
} from "@mui/material";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import DataTable from "examples/Tables/DataTable";
import GlobalCell from "components/GlobalCell";
import { useNavigate, useParams } from "react-router-dom";
import {
    MessageBoxType,
    ObjectPage,
    ObjectPageTitle,
} from "@ui5/webcomponents-react";
import Footer from "examples/Footer";
import getConfiguration from "confiuration";
import { FormAssignApi, FormDataApi, FormRuntimeApi, FormStatus } from "api/generated/api";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import ReactPaginate from "react-paginate";
import { useTranslation } from "react-i18next";

import MDButton from "components/MDButton";
import { bool } from "yup";
import MessageBox from "layouts/pages/Components/MessageBox";


interface formStatus {
    id: FormStatus;
    name: string;
    description: string;
}

function UserForms() {
    const { formId } = useParams();
    const navigate = useNavigate();
    const [rowData, setRowData] = useState<any[]>([]);
    const dispatchBusy = useBusy();
    const dispatchAlert = useAlert();
    const [pageCount, setPageCount] = useState(0);
    var [itemOffset, setItemOffset] = useState(0);
    var [totalListCount, settotalListCount] = useState(0);
    // const itemsPerPage = 7;
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [statusData, setStatusData] = useState<formStatus[]>([]);
    const { t } = useTranslation();
    const [column, setColumns] = useState<any[]>([
        {
            accessor: "actions",
            Header: <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>{t("ns1:TicketPage.TicketTablePage.TableColumnProps.Islemler")}</div>,
            Cell: ({ row }: any) => (
                <>
                    <MDBox mx={0} visibility={row.original.status == "1" ? "visible" : "hidden"}>
                        <Tooltip title="Formu Düzenle">
                            <Icon
                                sx={{ cursor: "pointer" }}
                                onClick={() => handlePreview(row.original.formId, row.original.id)}
                                style={{ marginRight: "8px", color: "#28a745" }}
                            >
                                edit
                            </Icon>
                        </Tooltip>
                    </MDBox>
                    <MDBox mx={0} visibility={row.original.status != "1" ? "visible" : "hidden"}>
                        <Tooltip title="Formu Görüntüle">
                            <Icon
                                sx={{ cursor: "pointer" }}
                                onClick={() => handlePreview(row.original.formId, row.original.id, row.original.formRunTimeId, "true")}
                                style={{ marginRight: "8px", color: "#28a745" }}
                            >
                                visibility
                            </Icon>
                        </Tooltip>
                    </MDBox>
                </>

            ),
        },
        {
            accessor: "statusText",
            Header: <MDBox style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>{t("ns1:TicketPage.TicketTablePage.TableColumnProps.Durum")}</MDBox>,
            Cell: ({ row, value, column }: any) => (
                <GlobalCell value={value} columnName={column.id} testRow={row.original} />
            ),
        },
        {
            accessor: "formName",
            Header: <MDBox style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>Form Adı</MDBox>,
            Cell: ({ row, value, column }: any) => (
                <GlobalCell value={value} columnName={column.id} testRow={row.original} />
            ),
        },
        {
            accessor: "createdDate",
            Header: <MDBox style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>{t("ns1:TicketPage.TicketTablePage.TableColumnProps.Tarih")}</MDBox>,
            Cell: ({ row, value, column }: any) => (
                <GlobalCell value={value} columnName={column.id} testRow={row.original} />
            ),
        },


    ]
    );

    const getFormStatus = async () => {
        try {
            dispatchBusy({ isBusy: true });
            var conf = getConfiguration();
            const api = new FormAssignApi(conf);

            //sutunlarin olusturulmasi
            var status = await api.apiFormAssignFormStatusGet();
            console.log("status>>", status)
            setStatusData(status.data as any);

        } catch (error) {
            dispatchAlert({
                message: "Hata oluştu" + error,
                type: MessageBoxType.Error,
            });
        } finally {
            dispatchBusy({ isBusy: false });
        }
    };

    const handlePreview = (id: string, assignId: string, formRunId?: string, isVisibility?: string) => {
        // navigate("/parameters/view/" + id);
        if (formRunId) {
            navigate("/parameters/view/" + id + "/" + formRunId + "/" + isVisibility);
        }
        else {
            navigate("/parameters/view/" + id, {
                state: { formAssignId: assignId },
            });
        }

    };

    const fetchData = async () => {
        try {
            dispatchBusy({ isBusy: true });
            var conf = getConfiguration();
            const api = new FormAssignApi(conf);

            //sutunlarin olusturulmasi
            // var data = await api.apiFormAssignUserFormsGet(["1"]);
            var data = await api.apiFormAssignUserFormsGet();
            console.log("Data>>", data)
            setRowData(data.data);

        } catch (error) {
            dispatchAlert({
                message: "Hata oluştu" + error,
                type: MessageBoxType.Error,
            });
        } finally {
            dispatchBusy({ isBusy: false });
        }
    };

    useEffect(() => {
        getFormStatus();
        fetchData();
    }, []);




    const handlePageClick = (event: any) => {
        const newOffset = (event.selected * itemsPerPage) % totalListCount;
        setItemOffset(newOffset);
        itemOffset = newOffset;
    };

    return (
        <DashboardLayout>
            <DashboardNavbar />
            <ObjectPage
                imageShapeCircle
                mode="Default"
                hidePinButton
                selectedSectionId="goals"
                style={{
                    height: "100%",
                    // maxHeight: "795px",
                    marginTop: "-25px",
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    boxShadow: "0 2px 12px 0 rgba(0,0,0,0.1)",
                    overflow: "hidden",
                    overflowY: "scroll",
                }}
                className="scrollbar-hide"
                titleArea={
                    <ObjectPageTitle
                        style={{
                            paddingTop: "24px",
                            paddingLeft: "24px",
                            paddingRight: "24px",
                            backgroundColor: "#ffffff",
                            cursor: "default",
                        }}
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
                                Atanan Formlar
                            </Typography>
                        </MDBox>
                    </ObjectPageTitle>
                }

            >
                <Grid xs={12} lg={6} sx={{ paddingLeft: "3px" }}>
                    <Card>
                        <MDBox paddingTop={1} height="100%">
                            <DataTable

                                table={{
                                    columns: column,
                                    rows: rowData,
                                }}
                                setItemsPerPage={setItemsPerPage}
                                totalRowCount={totalListCount}
                            ></DataTable>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    position: "sticky",
                                    bottom: 0,
                                    backgroundColor: "white",
                                    zIndex: 10,
                                    padding: "10px 0",
                                }}
                            >
                                <ReactPaginate
                                    previousLabel="Geri"
                                    nextLabel="İleri"
                                    pageClassName="page-item"
                                    pageLinkClassName="page-link"
                                    previousClassName="page-item"
                                    previousLinkClassName="page-link"
                                    nextClassName="page-item"
                                    nextLinkClassName="page-link"
                                    breakLabel="..."
                                    breakClassName="page-item"
                                    breakLinkClassName="page-link"
                                    pageCount={pageCount}
                                    marginPagesDisplayed={2}
                                    pageRangeDisplayed={5}
                                    onPageChange={handlePageClick}
                                    containerClassName="pagination"
                                    activeClassName="active"
                                />
                            </div>
                        </MDBox>
                    </Card>
                </Grid>
            </ObjectPage>
            <Footer />

        </DashboardLayout>
    );
}

export default UserForms;
