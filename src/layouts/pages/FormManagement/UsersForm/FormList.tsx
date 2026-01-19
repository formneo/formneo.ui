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
import { FormDataApi, FormRuntimeApi } from "api/generated/api";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import ReactPaginate from "react-paginate";
import { useTranslation } from "react-i18next";

import MDButton from "components/MDButton";
import { bool } from "yup";
import MessageBox from "layouts/pages/Components/MessageBox";



function FormList() {
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
    const [msgOpen, setmsgOpen] = useState(false);
    const { t } = useTranslation();
    const [deletedId, setDeletedId] = useState("");
    const [isQuestionMessageBoxOpen, setIsQuestionMessageBoxOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const items = [
        { label: t("ns1:TicketPage.TicketTablePage.Talepler"), icon: "pi pi-check" },
        { label: t("ns1:TicketPage.TicketTablePage.Grafik"), icon: "pi pi-chart-line" }
    ].filter(Boolean);
    const [formData, setFormData] = useState<any>(null);
    const [column, setColumns] = useState<any[]>([
        {
            accessor: "actions",
            Header: <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>{t("ns1:TicketPage.TicketTablePage.TableColumnProps.Islemler")}</div>,
            Cell: ({ row }: any) => (
                <MDBox mx={0}>

                    <Tooltip title={t("ns1:TicketPage.TicketTablePage.Incele")}>
                        <Icon
                            sx={{ cursor: "pointer" }}
                            onClick={() => handlePreview(row.original.formId, row.original.id, "true")}
                            style={{ marginRight: "8px", color: "#28a745" }}
                        >
                            visibility
                        </Icon>
                    </Tooltip>
                    <Tooltip title={t("ns1:TicketPage.TicketTablePage.TalebiSil")}>
                        <Icon
                            sx={{ cursor: "pointer" }}
                            onClick={() => handleOpenQuestionBox(row.original.id)}
                            style={{ marginRight: "8px", color: "red" }}
                        >
                            delete
                        </Icon>
                    </Tooltip>
                    <Tooltip title={t("ns1:TicketPage.TicketTablePage.TalebiDuzenle")}>
                        <Icon
                            sx={{ cursor: "pointer" }}
                            onClick={() => handlePreview(row.original.formId, row.original.id, "false")}
                            style={{ marginRight: "8px", color: "#28a745" }}
                        >
                            edit
                        </Icon>
                    </Tooltip>
                </MDBox>
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

    const handleOpenQuestionBox = (id: string) => {
        setDeletedId(id);
        setIsQuestionMessageBoxOpen(true);
    };
    const handleCloseQuestionBox = (action: string) => {
        setIsQuestionMessageBoxOpen(false);
        if (action === "Yes") {
            handleDelete(deletedId);
        }
        if (action === "No") {
            alert("silinme işlemi iptal edildi");
        }
    };

    const handlePreview = (id: string, formRunId: string, isVisibility?: string) => {
        navigate("/parameters/view/" + id + "/" + formRunId + "/" + isVisibility);
    };

    const handleDelete = async (id: string) => {
        var conf = getConfiguration();
        const api = new FormRuntimeApi(conf);
        await api.apiFormRuntimeIdDelete(id);
        fetchData();
        navigate("/formList/" + formId);
    }

    const fetchData = async () => {
        try {
            dispatchBusy({ isBusy: true });
            var conf = getConfiguration();
            const api = new FormRuntimeApi(conf);
            //sutunlarin olusturulmasi
            var columnsData = await api.apiFormRuntimeGetColumnListFormIdGet(formId);
            console.log("columnsData>>", columnsData)
            if (columnsData.data.length > 0) {
                const dynamicColumns = columnsData.data.map(item => ({
                    accessor: item.key,
                    Header: <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>{item.columnLabel}</div>,
                    Cell: ({ row, value, column }: any) => (
                        <GlobalCell value={value} columnName={column.id} testRow={row.original} />
                    ),
                }));

                setColumns(prev => {
                    const existingAccessors = new Set(prev.map(col => col.accessor));
                    const filtered = dynamicColumns.filter(col => !existingAccessors.has(col.accessor));
                    return [...prev, ...filtered];
                });
            }


            //form listesi
            var data = await api.apiFormRuntimeGetFormDataByIdFormIdGet(formId);
            console.log("data res>>", data)

            //form alanlari tabloda gosterilmek icin duzenlendi
            const allRows = data.data.map((item: Record<string, any>) => {
                const parsed = JSON.parse(item.valuesJsonData);
                return {
                    ...item,
                    ...parsed
                };
            });
            setRowData(allRows);

            //formun genel bilgileri icin- ad,aciklama vs
            const apiForm = new FormDataApi(conf);
            var apiFormRes = await apiForm.apiFormDataIdGet(formId);
            console.log("formData>>", apiFormRes)
            setFormData(apiFormRes.data);




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
                        actionsBar={
                            <MDBox style={{ marginTop: "15px", marginRight: "15px" }}>
                                <MDButton
                                    variant="gradient"
                                    color="info"
                                    onClick={() => navigate(`/parameters/view/${formId}`)}
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
                                    {t("ns1:FormMngPage.YeniForm")}
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
                                {formData ? formData.formName : ""}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: "#7b809a",
                                }}
                            >
                                {formData ? formData.formDescription : ""}
                            </Typography>
                        </MDBox>
                    </ObjectPageTitle>
                }

            >
                <Grid xs={12} lg={6} sx={{ paddingLeft: "3px" }}>
                    <Card>
                        {activeIndex == 0 && (
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
                        )}
                    </Card>
                </Grid>
            </ObjectPage>
            <MessageBox
                isQuestionmessageBoxOpen={isQuestionMessageBoxOpen}
                handleCloseQuestionBox={handleCloseQuestionBox}
            />
            <Footer />

        </DashboardLayout>
    );
}

export default FormList;
