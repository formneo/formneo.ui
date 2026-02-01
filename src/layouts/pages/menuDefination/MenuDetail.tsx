import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Grid,
  TextField,
  Button,
  Typography,
  Autocomplete,
  Card,
  Checkbox,
  FormControlLabel,
  FormControl,
} from "@mui/material";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import MDInput from "components/MDInput";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import getConfiguration from "confiuration";
import { IdentityRole, MenuApi, MenuListDto, RoleMenuApi } from "api/generated";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";
import Footer from "examples/Footer";
import { useBusy } from "../hooks/useBusy";
import { useAlert } from "../hooks/useAlert";
import { MessageBoxType } from "@ui5/webcomponents-react";
import { useTranslation } from "react-i18next";

// Query string'den parametreleri almak için yardımcı fonksiyon
const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

// Menü detay bileşeni
const MenuDetail = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();
  const menuItemId = query.get("id");
  const { t } = useTranslation();
  const [activeOptions, setActiveOptions] = useState([
    t("ns1:MenuPage.MenuDetail.Pasif"),
    t("ns1:MenuPage.MenuDetail.Aktif"),
  ]);
  const [parentMenu, setParentMenu] = useState([]);
  const [menuItem, setMenuItem] = useState(null);

  const [checkboxTrue, setCheckboxTrue] = useState(false);
  const [roles, setRoles] = useState<IdentityRole[]>([]);
  const [counterForRoles, setCounterForRoles] = useState(0);
  const [selectedRoles, setSelectedRoles] = useState<IdentityRole[]>([]);

  const [formData, setFormData] = useState({
    parentCode: "",
    code: "",
    name: "",
    description: "",
    href: "",
    order: 0,
    isActive: false,
    icon: "",
    showMenu: false,
    isTenantOnly: false,
    isGlobalOnly: false,
  });
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      // Only fetch data if id exists
      const fetchIdData = async () => {
        var conf = getConfiguration();
        var api = new MenuApi(conf);
        var data = await api.apiMenuIdGet(id);

        setFormData({
          parentCode: data.data.parentMenuId || "",
          code: data.data.menuCode || "",
          name: data.data.name || "",
          description: data.data.description || "",
          href: data.data.href || "",
          order: data.data.order || 0,
          isActive: data.data.isActive,
          icon: data.data.icon || "",
          showMenu: data.data.showMenu,
          isTenantOnly: data.data.isTenantOnly || false,
          isGlobalOnly: (data as any)?.data?.isGlobalOnly || false,
        });
      };
      fetchIdData();
    }
  }, [id]);

  useEffect(() => {
    const fetchParentMenu = async () => {
      var conf = getConfiguration();
      var api = new MenuApi(conf);
      var data = await api.apiMenuAllWithoutAuthGet();
      setParentMenu(data.data);
    };
    fetchParentMenu();
  }, []);

  useEffect(() => {
    if (menuItemId) {
      // Menü öğesini ID ile al
      fetchMenuItem(menuItemId).then((item) => {
        setMenuItem(item);
        setFormData({
          parentCode: item.parentCode,
          code: item.code,
          name: item.name,
          description: item.description,
          href: item.href,
          order: item.order,
          isActive: item.isActive,
          icon: item.icon,
          showMenu: item.showMenu,
          isTenantOnly: item.isTenantOnly || false,
          isGlobalOnly: (item as any)?.isGlobalOnly || false,
        });
      });
    }
  }, [menuItemId]);

  const fetchMenuItem = async (id: any) => {
    return {
      id,
      parentCode: "Üst Menü Kodu Örnek",
      code: "Menü Kodu Örnek",
      name: "Örnek Menü",
      description: "Bu bir örnek açıklamadır.",
      href: "/ornek-href",
      order: 15,
      isActive: false,
      icon: "database",
      showMenu: false,
      isTenantOnly: false,
      isGlobalOnly: false,
    };
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    if (name === "order" && value == "") {
      setFormData({ ...formData, [name]: 0 });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };



  const checkValues = () => {
    if (formData.icon && formData.parentCode) {
      dispatchAlert({
        message: t("ns1:MenuPage.MenuDetail.AltMenuIkonHata"),
        type: MessageBoxType.Error,
      });
      return false;
    }

    if (formData.code && formData.name && formData.description) {
      return true;
    } else {
      dispatchAlert({
        message: t("ns1:MenuPage.MenuDetail.TumAlanlariDoldurun"),
        type: MessageBoxType.Error,
      });
      return false;
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      if (!checkValues()) {
        return;
      }

      if (formData.order == null || formData.order == undefined) {
        dispatchAlert({
          message: t("ns1:MenuPage.MenuDetail.SiraNoSayisal"),
          type: MessageBoxType.Error,
        });
        return;
      }

      dispatchBusy({ isBusy: true });
      var conf = getConfiguration();
      var api = new MenuApi(conf);
      await api.apiMenuPost({
        menuCode: formData.code,
        name: formData.name,
        parentMenuId: formData.parentCode ? formData.parentCode : null,
        href: formData.href,
        description: formData.description,
        order: formData.order,
        isActive: formData.isActive,
        icon: formData.icon,
        showMenu: formData.showMenu,
        isTenantOnly: formData.isTenantOnly,
        isGlobalOnly: (formData as any).isGlobalOnly,
      });
      dispatchBusy({ isBusy: false });
      dispatchAlert({
        message: t("ns1:MenuPage.MenuDetail.MenuEklendi"),
        type: MessageBoxType.Success,
      });
      navigate("/menus");
    } catch (error) {
      console.error("Menü ekleme hatası:", error);
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const handleUpdate = async (e: any) => {
    e.preventDefault();
    try {
      if (!checkValues()) {
        return;
      }

      if (formData.order == null || formData.order == undefined) {
        dispatchAlert({
          message: t("ns1:MenuPage.MenuDetail.SiraNoSayisal"),
          type: MessageBoxType.Error,
        });
        return;
      }

      dispatchBusy({ isBusy: true });
      var conf = getConfiguration();
      var api = new MenuApi(conf);
      

      await api.apiMenuPut({
        id: id,
        menuCode: formData.code,
        name: formData.name,
        parentMenuId: formData.parentCode ? formData.parentCode : null,
        href: formData.href,
        description: formData.description,
        order: formData.order,
        isActive: formData.isActive,
        icon: formData.icon,
        showMenu: formData.showMenu,
        isTenantOnly: formData.isTenantOnly,
        isGlobalOnly: (formData as any).isGlobalOnly,
      });
      dispatchBusy({ isBusy: false });
      dispatchAlert({
        message: t("ns1:MenuPage.MenuDetail.MenuGuncellendi"),
        type: MessageBoxType.Success,
      });
      navigate("/menus");
    } catch (error) {
      console.error("Menü güncellenirken hata oluştu:", error);
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const renderRoles = () => {
    return (
      <Autocomplete
        options={roles}
        sx={{ mt: 2 }}
        getOptionLabel={(option) => option.name}
        value={selectedRoles ? selectedRoles : null}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        onChange={(event, newValue) => {
          if (!newValue) return;
          if (newValue) {
            setSelectedRoles(newValue);
          }
        }}
        multiple
        renderInput={(params) => (
          <MDInput
            {...params}
            label={t("ns1:MenuPage.MenuDetail.RolGoruntulemeYetkisi")}
            placeholder={t("ns1:MenuPage.MenuDetail.RolSeciniz")}
          />
        )}
      />
    );
  };

  useEffect(() => {
    if (counterForRoles === 1) {
      const fetchRoles = async () => {
        var conf = getConfiguration();
        var api = new RoleMenuApi(conf);
        var data = await api.apiRoleMenuAllOnlyHeadGet();
        setRoles(data.data);
      };
      fetchRoles();
    }
  }, [counterForRoles === 1]);

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <Grid container mt={3} mx={0.4}>
        <Grid item xs={12} lg={12}>
          <Card>
            <MDBox p={3}>
              <MDBox p={2}>
                <MDTypography variant="h4" gutterBottom>
                  {id
                    ? t("ns1:MenuPage.MenuDetail.MenuDetayi")
                    : t("ns1:MenuPage.MenuDetail.MenuEkle")}
                </MDTypography>
              </MDBox>
              <MDBox mt={2} p={3}>
                <Grid container spacing={3}>
                  {" "}
                  <Grid item xs={12} sm={6} lg={5.75}>
                    <MDInput
                      fullWidth
                      sx={{ mb: 3.2 }}
                      label={t("ns1:MenuPage.MenuDetail.MenuAdi")}
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </Grid>

                  <Grid item xs={12} sm={12} lg={12}>
                    <MDInput
                      fullWidth
                      sx={{ mb: 3.2 }}
                      label={t("ns1:MenuPage.MenuDetail.MenuKodu")}
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} lg={5.75}>
                    <MDInput
                      fullWidth
                      sx={{ mb: 3.2 }}
                      label={t("ns1:MenuPage.MenuDetail.HedefAdres")}
                      name="href"
                      value={formData.href}
                      onChange={handleChange}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} lg={5.75}>
                    <MDInput
                      sx={{ mb: 3.2 }}
                      value={formData.order}
                      type="number"
                      name="order"
                      label={t("ns1:MenuPage.MenuDetail.SiraNo")}
                      onChange={handleChange}
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} lg={5.75}>
                    <Autocomplete
                      renderInput={(params) => (
                        <MDInput
                          {...params}
                          type="text"
                          label={t("ns1:MenuPage.MenuDetail.Durum")}
                          value={
                            formData.isActive
                              ? t("ns1:MenuPage.MenuDetail.Aktif")
                              : t("ns1:MenuPage.MenuDetail.Pasif")
                          }
                          fullWidth
                        />
                      )}
                      value={
                        formData.isActive
                          ? t("ns1:MenuPage.MenuDetail.Aktif")
                          : t("ns1:MenuPage.MenuDetail.Pasif")
                      }
                      options={activeOptions}
                      size="medium"
                      sx={{ mb: 3.2 }}
                      onChange={(event, newValue) => {
                        setFormData((prev) => ({
                          ...prev,
                          isActive: newValue === t("ns1:MenuPage.MenuDetail.Aktif"),
                        }));
                      }}
                    />
                    <FormControl sx={{ marginLeft: "6px" }}>
                      <FormControlLabel
                        control={<Checkbox id="isTenantOnly" checked={formData.isTenantOnly} />}
                        label={
                          <MDTypography fontWeight="medium" variant="caption" color="text">
                            Tenant Modu
                          </MDTypography>
                        }
                        onChange={(event, newValue) => {
                          setFormData((prev) => ({
                            ...prev,
                            isTenantOnly: newValue,
                          }));
                        }}
                      />
                    </FormControl>
                    <FormControl sx={{ marginLeft: "6px" }}>
                      <FormControlLabel
                        control={<Checkbox id="isGlobalOnly" checked={(formData as any).isGlobalOnly} />}
                        label={
                          <MDTypography fontWeight="medium" variant="caption" color="text">
                            Global Modu
                          </MDTypography>
                        }
                        onChange={(event, newValue) => {
                          setFormData((prev: any) => ({
                            ...prev,
                            isGlobalOnly: newValue,
                          }));
                        }}
                      />
                    </FormControl>
                    <FormControl sx={{ marginLeft: "6px" }}>
                      <FormControlLabel
                        control={<Checkbox id="showMenu" checked={formData.showMenu} />}
                        label={
                          <MDTypography fontWeight="medium" variant="caption" color="text">
                            {t("ns1:MenuPage.MenuDetail.MenudeGoster")}
                          </MDTypography>
                        }
                        onChange={(event, newValue) => {
                          if (counterForRoles === 0) {
                            setCounterForRoles(counterForRoles + 1);
                          }
                          setCheckboxTrue(newValue);
                          setFormData((prev) => ({
                            ...prev,
                            showMenu: newValue,
                          }));
                        }}
                      />
                    </FormControl>
                    {checkboxTrue ? renderRoles() : null}
                  </Grid>
                  <Grid lg={0.5} />
                  {/* 2.alan */}
                  <Grid item xs={12} sm={6} lg={5.75}>
                    <MDInput
                      fullWidth
                      label={t("ns1:MenuPage.MenuDetail.Aciklama")}
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      sx={{ mb: 3.2 }}
                      multiline
                      rows={8}
                    />
                    <MDInput
                      fullWidth
                      label={t("ns1:MenuPage.MenuDetail.MenuIkonu")}
                      name="icon"
                      sx={{ mb: 3.2 }}
                      value={formData.icon}
                      onChange={handleChange}
                    />
                    <Autocomplete
                      sx={{ mb: 2.2 }}
                      value={
                        parentMenu.find((item: any) => item.id === formData.parentCode)?.name || ""
                      }
                      onChange={(event, newValue) => {
                        const selectedMenu = parentMenu.find((item: any) => item.name === newValue);
                        
                        setFormData((prev) => ({
                          ...prev,
                          parentCode: selectedMenu?.id || "",
                        }));
                      }}
                      options={parentMenu.map((item: any) => item.name)}
                      renderInput={(params) => (
                        <MDInput
                          {...params}
                          placeholder={t("ns1:MenuPage.MenuDetail.SecimYapiniz")}
                          label={t("ns1:MenuPage.MenuDetail.UstEkranKodu")}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </MDBox>
            </MDBox>
            <MDBox p={3} display="flex" justifyContent="flex-end" mt={22.5} width="100%">
              <MDButton
                sx={{ mr: 3 }}
                variant="outlined"
                color="primary"
                onClick={() => navigate("/menus")}
              >
                {t("ns1:MenuPage.MenuDetail.Iptal")}
              </MDButton>
              <MDButton
                variant="contained"
                color="info"
                type="submit"
                onClick={id ? handleUpdate : handleSubmit}
              >
                {t("ns1:MenuPage.MenuDetail.Kaydet")}
              </MDButton>
            </MDBox>
          </Card>
        </Grid>
      </Grid>
      <MDBox mt={1} />
      <Footer />
    </DashboardLayout>
  );
};

export default MenuDetail;
