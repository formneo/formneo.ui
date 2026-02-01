/**
=========================================================
* Material Dashboard 2 PRO React TS - v1.0.2
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-2-pro-react-ts
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// @mui material components
import Card from "@mui/material/Card";
// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Box, Icon, IconButton } from "@mui/material";
import MDButton from "components/MDButton";
import { useEffect, useMemo, useRef, useState } from "react";
import { Delete as DeleteIcon, Edit as EditIcon, Visibility } from "@mui/icons-material";

import { dA } from "@fullcalendar/core/internal-common";
import { FormColumnDto, FormDataApi, FormDataListDto, FormRuntimeApi } from "api/generated";
import getConfiguration from "confiuration";
import DataTable from "examples/Tables/DataTable";


interface Props {
    title?: string;
}

function UserStartForm({ title = "" }: Props): JSX.Element {
    const [gridData, setGridData] = useState<any[]>([]);

    const [rowId, setRowId] = useState("");
    const [queryId, setqueryId] = useState("");
    const [deleteBoxOpen, setdeleteBoxOpen] = useState(false);
    const [formData, setFormData] = useState<FormDataListDto>();
    const [columnList, setColumnList] = useState<FormColumnDto[]>();
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const page = queryParams.get('id');
    // API konfigürasyon bilgilerini oluşturun

    const { id } = useParams(); // URL'den id'yi al
    const [data, setData] = useState(null);


    const [dataTableData, setDataTableData] = useState({
        columns: [],
        rows: [], // Başlangıçta boş
    });
    useEffect(() => {
        if (columnList && columnList.length > 0) {
            // columnList değiştiğinde dataTableData'yı güncelle
            setDataTableData({
                columns: [
                    {
                        Header: "İşlemler",
                        accessor: "actions",
                        Cell: ({ row }: any) => (
                            <button
                                onClick={() => navigate(`/users/detail/?id=${row.original.userName}`)}
                                style={{
                                    padding: "8px 12px",
                                    background: "#007bff",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                }}
                            >
                                Edit
                            </button>
                        ),
                        width: 100,
                    },
                    ...columnList.map((col) => ({
                        Header: col.columnLabel,
                        accessor: col.key,
                    })),
                ],
                rows: dataTableData.rows, // Mevcut satırları koru
            });
        }
    }, [columnList]); // columnList değiştiğinde çalışır



    useEffect(() => {

    }, []);

    useEffect(() => {


        setqueryId(page);
        getFormInformation();

    }, [page]);


    const headtableInstanceRef = useRef(null);
    const showForm = (row: any) => {
        
        if (row.original != undefined) {
            navigate("/FormList/PreviewForm?id=" + page);
        }
    }
    const getFormInformation = async () => {

        var configuration = getConfiguration();
        const formApi = new FormDataApi(configuration); // Örnek oluştu
        // 

        var result = await formApi.apiFormDataIdGet(id);
        // 

        setFormData(result.data);
        getData(result.data.id);
        getColumnList(result.data.id);

    }
    const getColumnList = async (id: any) => {
        //
        // const repository: FormRuntimeReposistory = new FormRuntimeReposistory();
        // var data: IFormColumnDto[];
        // data = await (await repository.custoMethodGetListAny("GetColumnList", id)).data;
        var configuration = getConfiguration();

        const formRuntimeApi = new FormRuntimeApi(configuration);
        let result = await formRuntimeApi.apiFormRuntimeGetColumnListFormIdGet(id);
        // console.log("result degeri", result)
        setColumnList(result.data);
    }
    const handleOpenDialog = (row: any) => {
        if (row.original != undefined) {
            navigate("/UserStartForm/UserStartFormDetail?id=" + row.original.id + "&" + "formid=" + formData.id);

        } else {
            navigate("/ParameterEdit/?formid=" + formData.id);

        }
        return;
    };
    function DeleteById(row: any) {



    }
    async function deleteDialog(id: any) {
        alert("test");
        if (id != null) {

            var configuration = getConfiguration();

            let formRuntimeApi = new FormRuntimeApi(configuration);
            // 
            // 
            await formRuntimeApi.apiFormRuntimeIdDelete(id);
            getData(formData.id);

        }
    }
    async function getData(id: string) {
        var configuration = getConfiguration();
        const formRuntimeApi = new FormRuntimeApi(configuration);
        var res = await formRuntimeApi.apiFormRuntimeGetListFormIdGet(id);

        setGridData(Array.isArray(res.data) ? res.data : [res.data]);

    }
    return (
        <DashboardLayout>
            <DashboardNavbar />

            <MDBox pt={6} pb={3}>
                <MDBox display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <MDButton variant="gradient" onClick={handleOpenDialog} color="info">
                        Yeni Kayıt
                    </MDButton>
                    <MDBox display="flex">
                        <MDBox ml={1}>
                            <MDButton variant="outlined" color="dark">
                                <Icon>description</Icon>
                                &nbsp;export csv
                            </MDButton>
                        </MDBox>
                    </MDBox>
                </MDBox>

                <MDTypography variant="h5" fontWeight="medium">
                    {formData != null && formData.formName != null && formData.formName != undefined ? formData.formName : ""}
                </MDTypography>
                <MDTypography variant="button" color="text"></MDTypography>
                <Card>

                    {/* {1 > 0 ? ( */}
                    <DataTable table={dataTableData}  />
                    {/* // ) : (
                    //     <div style={{ padding: 16 }}>Sütunlar yükleniyor veya veri yok.</div>
                    // )} */}
                </Card>
            </MDBox>
            <Footer />
        </DashboardLayout>
    );
}
export default UserStartForm;
