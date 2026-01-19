/* eslint-disable no-unused-vars */
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

import { ReactNode, useState } from "react";

// @mui material components
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// Material Dashboard 2 PRO React TS contexts
import { useMaterialUIController } from "context";
import MDButton from "components/MDButton";
import { Dialog, DialogActions, DialogContent, DialogTitle, Icon, Tooltip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import DataTable from "examples/Tables/DataTable";

import { useTranslation } from "react-i18next";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert } from "layouts/pages/hooks/useAlert";
import getConfiguration from "confiuration";
import { FormAssignApi } from "api/generated";
import { MessageBoxType } from "@ui5/webcomponents-react";
import GlobalCell from "components/GlobalCell";
// Declaring prop types for DefaultStatisticsCard
interface Props {
  title: string;
  count: string | number;
  percentage?: {
    color: "primary" | "secondary" | "info" | "success" | "warning" | "error" | "dark" | "white";
    value: string | number;
    label: string;
  };
  dropdown?: {
    action: (...args: any) => void;
    menu: ReactNode;
    value: string;
  };
  [key: string]: any;
  isOpenCard?: boolean;
  page?: string
}

function DefaultStatisticsCard({ title, count, percentage, dropdown, isOpenCard, page }: Props): JSX.Element {
  const [controller] = useMaterialUIController();
  const { darkMode } = controller;
  const navigate = useNavigate();

  //formlar icin
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();
  const [openWaitingFormDialog, setopenWaitingFormDialog] = useState(false)
  const { t } = useTranslation();
  const [rowData, setRowData] = useState<any[]>([]);
  const [column, setColumns] = useState<any[]>([
    {
      accessor: "actions",
      Header: <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>{t("ns1:TicketPage.TicketTablePage.TableColumnProps.Islemler")}</div>,
      Cell: ({ row }: any) => (
        <MDBox mx={0}>
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

  const handlePreview = (id: string, assignId: string) => {
    navigate("/forms/view/" + id, {
      state: { formAssignId: assignId },
    });
  };

  const fetchData = async () => {
    try {
      dispatchBusy({ isBusy: true });
      var conf = getConfiguration();
      const api = new FormAssignApi(conf);

      //sutunlarin olusturulmasi
      var data = await api.apiFormAssignUserFormsGet(["1"]);
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
  const openFormDialog = async () => {
    await fetchData();
    setopenWaitingFormDialog(true);
  }
  const backgroundColor = (title: string): string => {
    switch (title) {
      case "Toplam Talep":
        return "#f5b041";
      case "Çözümlü Talep":
        return "#2ecc71   ";
      case "Açık Talep":
        return "#e74c3c  ";
      case "Açık Talep":
        return "#e74c3c  ";
      case "Bekleyen Formlar":
        return "#f5b041";
      case "Açık / Kapalı Talep Durumu":
        return "purple";
      default:
        return "white";
    }
  };

  return (
    <Card>
      <MDBox p={2} style={{ backgroundColor: backgroundColor(title) }}>
        <Grid container>
          <Grid item xs={12} md={12} lg={7}>
            <MDBox>
              <MDBox mb={0.5} lineHeight={1}>
                <MDTypography
                  variant="button"
                  fontWeight="medium"
                  color="light"
                  textTransform="capitalize"
                >
                  {title}
                </MDTypography>
              </MDBox>
              <MDBox lineHeight={1}>
                <MDTypography variant="h5" fontWeight="bold" color="light">
                  {count}
                </MDTypography>
                <MDTypography variant="button" fontWeight="bold" color="light">
                  {percentage.value}&nbsp;
                  <MDTypography
                    variant="button"
                    fontWeight="regular"
                    color={darkMode ? "text" : "light"}
                  >
                    {percentage.label}
                  </MDTypography>
                </MDTypography>
              </MDBox>
            </MDBox>
          </Grid>
          {isOpenCard && (
            <Grid item xs={12} md={12} lg={5} display="flex" justifyContent="center" alignItems="center" sx={{ marginLeft: "0px" }}>
              <MDBox>
                <MDButton
                  variant="outlined"
                  color="light"
                  onClick={() => {
                    page != "userFormList" ?
                      navigate(`/${page}`, { state: { onlyAllTicket: true } }) :
                      openFormDialog()
                    //{state: {onlyAllTicket: true}}
                  }}

                  endIcon={<Icon style={{ marginBottom: "2px" }}>arrow_forward</Icon>}
                >
                  Detaylar
                </MDButton>
              </MDBox>
            </Grid>
          )}
        </Grid>
      </MDBox>


      <Dialog open={openWaitingFormDialog} maxWidth="md" fullWidth>
        <DialogTitle>Bekleyen Formlar</DialogTitle>
        <DialogContent dividers>
          <DataTable
            table={{
              columns: column,
              rows: rowData,
            }}
          />
        </DialogContent>
        <DialogActions>
          <MDButton sx={{ mr: 2 }} variant="outlined" color="primary" onClick={() => setopenWaitingFormDialog(false)}>
            Kapat
          </MDButton>
        </DialogActions>
      </Dialog>

    </Card>
  );
}

// Setting default values for the props of DefaultStatisticsCard
DefaultStatisticsCard.defaultProps = {
  percentage: {
    color: "success",
    value: "",
    label: "",
  },
  dropdown: false,
};

export default DefaultStatisticsCard;
