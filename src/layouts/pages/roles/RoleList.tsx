import {
  Toolbar,
  ObjectPageTitle,
  ToolbarButton,
  ObjectPageHeader,
  MessageBoxType,
} from "@ui5/webcomponents-react";
import MDBox from "components/MDBox";
import { ObjectPage } from "@ui5/webcomponents-react";
import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Grid, Icon, Typography } from "@mui/material";
import { useEffect } from "react";
import getConfiguration from "confiuration";
import { RoleMenuApi } from "api/generated";
import { useAlert } from "../hooks/useAlert";
import { useBusy } from "../hooks/useBusy";
import MessageBox from "../Components/MessageBox";
import MDButton from "components/MDButton";
import { useTranslation } from "react-i18next";
import GlobalCell from "components/GlobalCell";

function RolesList() {
  const navigate = useNavigate();
  const [data, setData] = useState<[]>([]);
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();
  const [isQuestionMessageBoxOpen, setIsQuestionMessageBoxOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const { t } = useTranslation();

  const fetchData = async () => {
    try {
      var conf = getConfiguration();
      var api = new RoleMenuApi(conf);
      var response = await api.apiRoleMenuAllOnlyHeadGet();
      console.log(response.data);
      setData(response.data as any);
    } catch (error) {
      dispatchAlert({ message: t("ns1:RolePage.RoleList.HataOlustu"), type: MessageBoxType.Error });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      var api = new RoleMenuApi(conf);
      await api.apiRoleMenuRoleIdDelete(id);
      dispatchAlert({
        message: t("ns1:RolePage.RoleList.RolSilindi"),
        type: MessageBoxType.Success,
      });
      fetchData();
    } catch (error) {
      dispatchAlert({
        message: t("ns1:RolePage.RoleList.HataOlustu") + ": " + error,
        type: MessageBoxType.Error,
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const columns = [
    {
      Header: (
        <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>
          {t("ns1:RolePage.RoleList.RolAdi")}
        </div>
      ),
      accessor: "name",
      Cell: ({ value, row }: any) => <GlobalCell value={value} />,
    },

    // {
    //   Header: <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>Açıklama</div>,
    //   accessor: "description",
    // },

    // {
    //   Header: <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>Oluşturulma Tarihi</div>,
    //   accessor: "createdDate",
    // },

    // {
    //   Header: <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>Durum</div>,
    //   accessor: "status",
    // },

    {
      accessor: "actions",
      Header: (
        <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>
          {t("ns1:RolePage.RoleList.Islemler")}
        </div>
      ),
      Cell: ({ row }: any) => (
        <MDBox display="flex" alignItems="center">
          <>
            <Icon
              onClick={() => navigate(`/roles/detail/${row.original.id}`)}
              sx={{ cursor: "pointer" }}
              style={{ marginRight: "8px" }}
            >
              edit
            </Icon>
            <Icon sx={{ cursor: "pointer" }} onClick={() => handleOpenQuestionBox(row.original.id)}>
              delete
            </Icon>
          </>
        </MDBox>
      ),
    },
  ];

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
                  onClick={() => navigate(`/roles/detail`)}
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
                  {t("ns1:RolePage.RoleList.YeniRol")}
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
                {t("ns1:RolePage.RoleList.RoleTitle")}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#7b809a",
                }}
              >
                {t("ns1:RolePage.RoleList.RoleSubTitle")}
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
      </ObjectPage>
      <MessageBox
        isQuestionmessageBoxOpen={isQuestionMessageBoxOpen}
        handleCloseQuestionBox={handleCloseQuestionBox}
      />
      <Footer />
    </DashboardLayout>
  );
}

export default RolesList;
