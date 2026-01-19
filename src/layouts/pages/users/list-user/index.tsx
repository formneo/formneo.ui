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
import "@ui5/webcomponents-icons/dist/add.js";
// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { Link } from "react-router-dom";
// Material Dashboard 2 PRO React TS examples components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DataTable from "examples/Tables/DataTable";
import { useLocation, useNavigate } from "react-router-dom";
// Data
import dataTableData from "layouts/applications/data-tables/data/dataTableData";
import { UserApi, UserAppDto } from "api/generated";
import { useEffect, useState } from "react";
import getConfiguration from "confiuration";
import MDButton from "components/MDButton";
import { Grid, Icon, Typography } from "@mui/material";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useUser } from "layouts/pages/hooks/userName";
import GlobalCell from "components/GlobalCell";
import {
  Bar,
  Breadcrumbs,
  BreadcrumbsItem,
  Button,
  FlexBox,
  Label,
  MessageStrip,
  ObjectPage,
  ObjectPageHeader,
  ObjectPageTitle,
  ObjectStatus,
  Toolbar,
  ToolbarButton,
} from "@ui5/webcomponents-react";


import "../../../../assets/css/global.css";

function DataTables(): JSX.Element {
  const navigate = useNavigate(); // Navig
  const { userAppDto } = useUser(); // Context'ten veriyi alıyoruz

  const dispatchBusy = useBusy();
  const [dataTableData, setDataTableData] = useState({
    columns: [
      {
        Header: (
          <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>Kullanıcı Adı</div>
        ),
        accessor: "userName",
        width: "20%",
        Cell: ({ value, row }: any) => <GlobalCell value={value} />,
      },
      {
        Header: <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>Ad</div>,
        accessor: "firstName",
        width: "15%",
        Cell: ({ value, row }: any) => <GlobalCell value={value} />,
      },

      {
        Header: <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>Soyad</div>,
        accessor: "lastName",
        width: "15%",
        Cell: ({ value, row }: any) => <GlobalCell value={value} />,
      },
      // Şirket ve Departman kolonları kaldırıldı

      {
        Header: <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>E-mail</div>,
        accessor: "email",
        width: "20%",
        Cell: ({ value, row }: any) => <GlobalCell value={value} />,
      },

      {
        Header: (
          <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>
            Son Giriş Tarihi
          </div>
        ),
        accessor: "lastLoginDate",
        width: "20%",
        Cell: ({ value, row }: any) => <GlobalCell value={value} />,
      },
      {
        Header: (
          <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>İşlemler</div>
        ), // Yeni sütunun başlığı
        accessor: "actions",
        Cell: ({ row }: any) => (
          <MDBox mx={2}>
            <Icon
              style={{ marginRight: "8px", cursor: "pointer" }}
              onClick={() => navigate('/users/detail/', { 
                state: { userId: row.original.userName } 
              })}
            >
              edit
            </Icon>
          </MDBox>
        ),
      },
    ],
    rows: [], // Başlangıçta boş
  });

  const [filters, setFilters] = useState({
    department: "",
    company: "",
  });

  const [uniqueDepartments, setUniqueDepartments] = useState<string[]>([]);
  const [uniqueCompanies, setUniqueCompanies] = useState<string[]>([]);

  useEffect(() => {
    fetchDetail();
  }, []);

  useEffect(() => {
    if (dataTableData.rows.length > 0) {
      // Extract unique departments and companies
      const departments = [...new Set(dataTableData.rows.map((row) => row.departmentText))].filter(
        Boolean
      );
      const companies = [...new Set(dataTableData.rows.map((row) => row.workCompanyText))].filter(
        Boolean
      );
      setUniqueDepartments(departments);
      setUniqueCompanies(companies);
    }
  }, [dataTableData.rows]);

  const filteredRows = dataTableData.rows.filter((row) => {
    const departmentMatch = !filters.department || row.departmentText === filters.department;
    const companyMatch = !filters.company || row.workCompanyText === filters.company;
    return departmentMatch && companyMatch;
  });

  const updatedDataTable = {
    ...dataTableData,
    rows: filteredRows,
  };

  const fetchDetail = async () => {
    dispatchBusy({ isBusy: true });
    let isLoading: boolean;
    isLoading = false;

    var conf = getConfiguration();
    var api = new UserApi(conf);
    var data = await api.apiUserGetAllWithOuthPhotoForManagementGet();
    console.log(data.data);

    setDataTableData((prevState) => ({
      ...prevState,
      rows: data.data.map((item) => ({
        ...item,
        lastLoginDate: item.lastLoginDate ? formatDate(item.lastLoginDate) : "",
      })),
    }));

    dispatchBusy({ isBusy: false });

    isLoading = true;
  };
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) return ""; // Geçersiz tarih kontrolü

    const pad = (n: number): string => n.toString().padStart(2, "0");

    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1); // Aylar 0-indexed
    const year = date.getFullYear();

    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    return `${day}.${month}.${year} ${hours}:${minutes}`;
  };

  const isDataReady = dataTableData.rows.length > 2 && dataTableData.columns.length > 0;

  async function DeleteByName(row: any) {
    console.log(row.original.id);
    var conf = getConfiguration();
    var api = new UserApi(conf);
    await api.apiUserRemoveUserGet(row.original.id);
    fetchDetail();
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <ObjectPage
        mode="Default"
        hidePinButton
        style={{
          height: "790px",
          maxHeight: "790px",
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
                  onClick={() => navigate(`/users/detail`)}
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
                  Yeni Kullanıcı
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
                Kullanıcı Yönetimi
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#7b809a",
                }}
              >
                Kullanıcıları görüntüleyin, oluşturun ve dahası
              </Typography>
            </MDBox>
          </ObjectPageTitle>
        }
      >
        <Grid xs={12} lg={6} sx={{ paddingLeft: "3px" }}>
          <Card>
            <MDBox>
              <div className="filter-container">
                <div className="select-container">
                  <label className="filter-label">Departman:</label>
                  <select
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, department: e.target.value }))
                    }
                    value={filters.department}
                    className="select-style"
                  >
                    <option value="">Tümü</option>
                    {uniqueDepartments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="select-container">
                  <label className="filter-label">Şirket:</label>
                  <select
                    onChange={(e) => setFilters((prev) => ({ ...prev, company: e.target.value }))}
                    value={filters.company}
                    className="select-style"
                  >
                    <option value="">Tümü</option>
                    {uniqueCompanies.map((company) => (
                      <option key={company} value={company}>
                        {company}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="table-container">
                <DataTable canSearch={true} table={updatedDataTable} />
              </div>
            </MDBox>
          </Card>
        </Grid>
      </ObjectPage>
      <Footer />
    </DashboardLayout>
  );
}

export default DataTables;
