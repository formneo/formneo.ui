import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

import { PickList } from "primereact/picklist";
import React, { useEffect, useState } from "react";
import "primereact/resources/themes/lara-light-indigo/theme.css"; //theme
import "primereact/resources/primereact.min.css"; //core css
import "primeicons/primeicons.css"; //icons
import "./index.css";
import { MenuApi, MenuListDto, RoleMenuApi } from "api/generated";
import getConfiguration from "confiuration";
import MDTypography from "components/MDTypography";
import { Card, Grid } from "@mui/material";
import MDBox from "components/MDBox";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import Footer from "examples/Footer";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { MessageBoxType } from "@ui5/webcomponents-react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

function RoleScreenDefination() {
  const [source, setSource] = useState([]);
  const [target, setTarget] = useState([]);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [roleNameError, setRoleNameError] = useState(false);
  const [roleDescriptionError, setRoleDescriptionError] = useState(false);
  const [targetError, setTargetError] = useState(false);
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useTranslation();

  const fetchData = async () => {
    try {
      var conf = getConfiguration();
      var api = new MenuApi(conf);
      var response = await api.apiMenuTenantOnlyGet();
      var data = response.data;

      // Sadece atanabilir alt menüler: parent'ı olanlar
      const filteredData = data.filter((item: any) => item.parentMenuId !== null);

      if (id) {
        dispatchBusy({ isBusy: true });
        var apiRole = new RoleMenuApi(conf);
        var dataRole = await apiRole.apiRoleMenuGetByIdRoleIdGet(id);
        console.log("dataRole", dataRole.data);

        // Get the selected menus for target (yalnızca isTenantOnly olanlar dahil edilir)
        const selectedMenus = filteredData.filter((item: any) =>
          dataRole.data.menuPermissions.some((roleItem: any) => roleItem.menuId === item.id)
        );

        setSource(filteredData.filter((item) => !selectedMenus.includes(item)));
        setTarget(selectedMenus);
        setRoleName(dataRole.data.roleName);
        setRoleDescription(dataRole.data.description);
      } else {

        setSource(filteredData);
      }
    } catch (error) {
      dispatchAlert({
        message: t("ns1:RolePage.RoleScreen.HataOlustu"),
        type: MessageBoxType.Error,
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    let hasError = false;

    if (!roleName.trim()) {
      setRoleNameError(true);
      hasError = true;
    } else {
      setRoleNameError(false);
    }

    if (!roleDescription.trim()) {
      setRoleDescriptionError(true);
      hasError = true;
    } else {
      setRoleDescriptionError(false);
    }

    if (target.length === 0) {
      setTargetError(true);
      hasError = true;
    } else {
      setTargetError(false);
    }

    if (hasError) {
      return;
    }
    // Continue with save logic
    if (id) {
      try {
        dispatchBusy({ isBusy: true });
        var conf = getConfiguration();
        var api = new RoleMenuApi(conf);
        await api.apiRoleMenuPut({
          roleId: id,
          roleName: roleName,
          description: roleDescription,
          // Güvenlik: yalnızca isTenantOnly === true öğeleri kaydet
          menuPermissions: target
            ?.filter((item: any) => item?.isTenantOnly === true)
            .map((item: any) => {
              return {
                menuId: item.id,
                canView: true,
                canAdd: true,
                canEdit: true,
                canDelete: true,
              };
            }),
        });
        dispatchAlert({
          message: t("ns1:RolePage.RoleScreen.RolOlusturuldu"),
          type: MessageBoxType.Success,
        });
      } catch (error) {
        dispatchAlert({
          message: t("ns1:RolePage.RoleScreen.HataOlustu"),
          type: MessageBoxType.Error,
        });
      } finally {
        dispatchBusy({ isBusy: false });
      }
    } else {
      try {
        dispatchBusy({ isBusy: true });
        var conf = getConfiguration();
        var api = new RoleMenuApi(conf);
        await api.apiRoleMenuPost({
          roleName: roleName,
          description: roleDescription,
          // Güvenlik: yalnızca isTenantOnly === true öğeleri kaydet
          menuPermissions: target
            ?.filter((item: any) => item?.isTenantOnly === true)
            .map((item: any) => {
              return {
                menuId: item.id,
                canView: true,
                canAdd: true,
                canEdit: true,
                canDelete: true,
              };
            }),
        });

        dispatchAlert({
          message: t("ns1:RolePage.RoleScreen.RolOlusturuldu"),
          type: MessageBoxType.Success,
        });
      } catch (error) {
        dispatchAlert({ message: `${error}`, type: MessageBoxType.Error });
      } finally {
        dispatchBusy({ isBusy: false });
      }
    }
    navigate("/roles");
  };

  const onChange = (event: any) => {
    setSource(event.source);
    setTarget(event.target);
  };

  const itemTemplate = (item: any) => {
    return (
      <div className="flex align-items-center p-3 w-full">
        <div className="flex" style={{ alignItems: "center", gap: 12, width: "100%" }}>
          <i className="pi pi-box" style={{ fontSize: "1.5rem" }}></i>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span className="font-bold text-lg mb-2">{item.name}</span>
            <div className="flex align-items-center gap-2">
              <MDTypography variant="subtitle2" color="text" className="text-sm">
                {item.menuCode}
              </MDTypography>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <Card>
        <MDBox p={3}>
          <MDBox p={3}>
            <MDTypography variant="h4" gutterBottom>
              {t("ns1:RolePage.RoleScreen.RolTanimlama")}
            </MDTypography>
          </MDBox>
          <Grid container>
            <Grid item xs={12} lg={6}>
              <MDBox mt={3} p={3} mb={-3}>
                <MDInput
                  fullWidth
                  type="text"
                  value={roleName}
                  label={t("ns1:RolePage.RoleScreen.RolAdi")}
                  onChange={(e: any) => {
                    setRoleName(e.target.value);
                    setRoleNameError(false);
                  }}
                  error={roleNameError}
                  helperText={roleNameError ? t("ns1:RolePage.RoleScreen.RolAdiError") : ""}
                  FormHelperTextProps={{ style: { color: roleNameError ? "#f44335" : "inherit" } }}
                />
              </MDBox>
              <MDBox mt={1} p={3} mb={-3}>
                <MDInput
                  multiline
                  rows={4}
                  fullWidth
                  type="text"
                  label={t("ns1:RolePage.RoleScreen.RolAciklamasi")}
                  value={roleDescription}
                  onChange={(e: any) => {
                    setRoleDescription(e.target.value);
                    setRoleDescriptionError(false);
                  }}
                  error={roleDescriptionError}
                  helperText={
                    roleDescriptionError ? t("ns1:RolePage.RoleScreen.RolAciklamasiError") : ""
                  }
                  FormHelperTextProps={{
                    style: { color: roleDescriptionError ? "#f44335" : "inherit" },
                  }}
                />
              </MDBox>
            </Grid>
          </Grid>
        </MDBox>

        <div className="surface-card shadow-2 border-round p-4 m-4">
          <PickList
            dataKey="id"
            source={source}
            target={target}
            onChange={(event) => {
              onChange(event);
              setTargetError(false);
            }}
            itemTemplate={itemTemplate}
            sourceItemTemplate={itemTemplate}
            targetItemTemplate={itemTemplate}
            filter
            filterBy="name,menuCode"
            breakpoint="1280px"
            sourceHeader={
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <MDTypography style={{ color: "#757ce8" }}>
                  {t("ns1:RolePage.RoleScreen.TumUygulamalar")}
                </MDTypography>
              </div>
            }
            targetHeader={
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <MDTypography style={{ color: "#757ce8" }}>
                  {t("ns1:RolePage.RoleScreen.AtananUygulamalar")}
                </MDTypography>
                {targetError && (
                  <MDTypography variant="subtitle2" color="error" style={{ marginLeft: "8px" }}>
                    {t("ns1:RolePage.RoleScreen.UygulamaAtanmaliError")}
                  </MDTypography>
                )}
              </div>
            }
            sourceStyle={{
              height: "24rem",
              width: "100%",
            }}
            targetStyle={{
              height: "24rem",
              width: "100%",
            }}
            sourceFilterPlaceholder={t("ns1:RolePage.RoleScreen.IsimKodAra")}
            targetFilterPlaceholder={t("ns1:RolePage.RoleScreen.IsimKodAra")}
            showSourceControls={false}
            showTargetControls={false}
            className="picklist-custom"
          />
        </div>
        <MDBox p={3}>
          <MDBox p={2}>
            <MDBox display="flex" justifyContent="flex-end">
              <MDBox mr={2}>
                <MDButton onClick={() => navigate("/roles")} variant="outlined" color="error">
                  {t("ns1:RolePage.RoleScreen.Iptal")}
                </MDButton>
              </MDBox>
              <MDButton onClick={() => handleSave()} variant="gradient" color="info">
                {t("ns1:RolePage.RoleScreen.Kaydet")}
              </MDButton>
            </MDBox>
          </MDBox>
        </MDBox>
      </Card>
      <Footer />
    </DashboardLayout>
  );
}

export default RoleScreenDefination;
