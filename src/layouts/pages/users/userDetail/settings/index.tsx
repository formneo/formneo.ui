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
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";
import { TabContainer, Tab } from "@ui5/webcomponents-react";
import "@ui5/webcomponents-icons/dist/key.js";
import "@ui5/webcomponents-icons/dist/employee.js";
import "@ui5/webcomponents-icons/dist/contacts.js";
import "@ui5/webcomponents-icons/dist/task.js";
import "@ui5/webcomponents-icons/dist/shield.js";
import "@ui5/webcomponents-icons/dist/delete.js";
import "@ui5/webcomponents-icons/dist/group.js";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";

// Settings page components
import BaseLayout from "layouts/pages/account/components/BaseLayout";

import BasicInfo from "./components/BasicInfo";
import ChangePassword from "./components/ChangePassword";
import Authentication from "./components/Authentication";
import Accounts from "./components/Accounts";
import Notifications from "./components/Notifications";
import Sessions from "./components/Sessions";
import DeleteAccount from "./components/DeleteAccount";
import initialValues from "layouts/pages/users/new-user/schemas/initialValues";
import { Formik, Form } from "formik";
import { useEffect, useState } from "react";

import form from "layouts/pages/users/new-user/schemas/form";
import Header from "./components/Header";
import getConfiguration from "confiuration";
import { CreateUserDto, UpdateUserDto, UserApi } from "api/generated";
import UserTenantRoles from "./components/UserTenantRoles";
import UserTenantFormRoles from "./components/UserTenantFormRoles";
import UserTenantAdmin from "./components/UserTenantAdmin";
import UserOrganization from "./components/UserOrganization";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useNavigate, useLocation } from "react-router-dom";
import { MessageBoxType } from "@ui5/webcomponents-react";
import { useAlert } from "layouts/pages/hooks/useAlert";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import NewPaswword from "./components/ChangePassword/newpassord";

import validations from "layouts/pages/users/new-user/schemas/validations";

function Settings(): JSX.Element {
  const currentValidation = validations[0];
  const dispatchAlert = useAlert();
  const [formValues, setFormValues] = useState(initialValues);
  const { formId, formField } = form;

  const handleSubmit = async (values: any, actions: any) => {
    console.log("isMailSender Geliyor mu", values.isMailSender);
    
    // Edit modunda userId kontrolü (create modunda engelleme yapma)
    if (formGudid && !userId) {
      dispatchAlert({
        message: "Geçersiz kullanıcı ID'si. İşlem iptal edildi.",
        type: MessageBoxType.Error,
      });
      return;
    }
    
    if (formGudid) {
      dispatchBusy({ isBusy: true });
      var update = values as UpdateUserDto;
      var conf = getConfiguration();
      var api = new UserApi(conf);

      update.id = formGudid;

      if (update.isBlocked == null) {
        update.isBlocked = false;
      }
      if (update.isTestData == null) {
        update.isTestData = false;
      }


      try {
        console.log(update);

        var data = await api.apiUserPut(update);
        console.log("Başarılı:", data);
      } catch (error: any) {
        dispatchBusy({ isBusy: false });
        dispatchAlert({ message: error.response.data.errors[0], type: MessageBoxType.Error });
        actions.setSubmitting(false);
        return;
      }
      dispatchBusy({ isBusy: false });
      navigate("/users");
    } else {
      dispatchBusy({ isBusy: true });
      var create = values as CreateUserDto;
      var conf = getConfiguration();
      var api = new UserApi(conf);
      create.lastLoginIp = "";

      try {
        var data = await api.apiUserPost(values.isMailSender, create);
        console.log("Başarılı:", data);
      } catch (error: any) {
        dispatchBusy({ isBusy: false });
        dispatchAlert({ message: error.response.data.errors[0], type: MessageBoxType.Error });
        actions.setSubmitting(false);
        return;
      }
      dispatchBusy({ isBusy: false });
      navigate("/users");
    }
    // eslint-disable-next-line no-alert
    actions.setSubmitting(false);
    actions.resetForm();
  };

  const dispatchBusy = useBusy();
  const [activeStep, setActiveStep] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("profile");
  const [isTenantMode, setIsTenantMode] = useState<boolean>(false);
  const [isGlobalAdmin, setIsGlobalAdmin] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  
  // items array'ini computed olarak oluştur
  const items = [
    { label: "Profil", icon: "pi pi-user", key: "profile" },
    { label: "Şifre", icon: "pi pi-lock", key: "password" },
    // Global admin özellikleri sadece global modda göster
    ...(!isTenantMode && isGlobalAdmin ? [{ label: "Hesaplar", icon: "pi pi-id-card", key: "accounts" }] : []),
    ...(!isTenantMode && isGlobalAdmin ? [{ label: "Tenantlar", icon: "pi pi-users", key: "userTenants" }] : []),
    // Tenant özellikleri tenant modda göster
    ...(isTenantMode ? [{ label: "Organizasyon", icon: "pi pi-building", key: "organization" }] : []),
    ...(isTenantMode ? [{ label: "Ticket Yetkileri", icon: "pi pi-ticket", key: "ticket" }] : []),
    ...(isTenantMode ? [{ label: "Tenant Rolleri", icon: "pi pi-users", key: "tenantRoles" }] : []),
    ...(isTenantMode ? [{ label: "Form Rolleri", icon: "pi pi-shield", key: "tenantFormRoles" }] : []),
    { label: "Hesabı Sil", icon: "pi pi-trash", key: "danger" },
  ];

  // İlk yükleme - localStorage'dan değerleri al
  useEffect(() => {
    const tenantMode = Boolean(localStorage.getItem("selectedTenantId"));
    const globalAdmin = localStorage.getItem("isGlobalAdmin") === "true";
    
    setIsTenantMode(tenantMode);
    setIsGlobalAdmin(globalAdmin);
    setIsInitialized(true);
  }, []);

  // items değiştiğinde activeTab listedeyse koru, değilse ilk elemana al
  useEffect(() => {
    if (!isInitialized) return; // İlk yükleme tamamlanana kadar bekle
    
    const exists = items.some((i: any) => i.key === activeTab);
    if (!exists && items.length > 0) {
      setActiveTab(items[0].key as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGlobalAdmin, isTenantMode, isInitialized]);

  const activeIndex = Math.max(0, items.findIndex((i: any) => i.key === activeTab));

  const [formGudid, setFormId] = useState("");
  const [isValidUser, setIsValidUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate(); // Navig
  const location = useLocation();



  useEffect(() => {
    // State veya query'den userId al (hem state hem query desteklenir)
    const idFromState = location.state?.userId as string | undefined;
    const idFromQuery = new URLSearchParams(location.search).get('id') || undefined;
    const rawId = idFromState || idFromQuery;

    if (rawId !== undefined) {
      // XSS koruması için basit sanitizasyon
      const sanitizedId = rawId.replace(/[<>\"'&]/g, '');

      // Boş string kontrolü → create modu
      if (sanitizedId.trim() === '') {
        setIsValidUser(true);
        setIsLoading(false);
        return;
      }

      // Edit modu: detay çek
      setUserId(sanitizedId);
      fetchDetail(sanitizedId);
    } else {
      // ID yok → create modu
      setIsValidUser(true);
      setIsLoading(false);
    }
  }, []);



  // Global admin kontrolü (güvenilir sekme görünürlüğü için)
  useEffect(() => {
    if (!isInitialized) return; // İlk yükleme tamamlanana kadar bekle
    
    const checkGlobalAdmin = async () => {
      try {
        const conf = getConfiguration();
        const api = new UserApi(conf);
        const me = await api.apiUserGetLoginUserDetailGet();
        const userId = String((me as any)?.data?.id || (me as any)?.data?.userId || "");
        if (!userId) {
          setIsGlobalAdmin(false);
          localStorage.removeItem("isGlobalAdmin");
          return;
        }
        const res = await api.apiUserIsGlobalAdminGet(userId);
        const val = Boolean((res as any)?.data);
        setIsGlobalAdmin(val);
        if (val) localStorage.setItem("isGlobalAdmin", "true"); else localStorage.removeItem("isGlobalAdmin");
      } catch {
        setIsGlobalAdmin(false);
        localStorage.removeItem("isGlobalAdmin");
      }
    };
    checkGlobalAdmin();
  }, [isInitialized]);

  const fetchDetail = async (id: string) => {
    try {
      dispatchBusy({ isBusy: true });
      setIsLoading(true);
      
      var conf = getConfiguration();
      var api = new UserApi(conf);
      
      // API çağrısı yap
      var data = await api.apiUserGet(id);
      
      // API yanıtını kontrol et
      if (!data || !data.data) {
        throw new Error("Kullanıcı verisi bulunamadı");
      }
      
      var resultData = data.data;
      
      // Kullanıcı verilerini güvenli şekilde işle
      setFormId(resultData.id);
      setIsValidUser(true);
      
      setFormValues((prevValues) => ({
        ...prevValues,
        userName: data.data.userName || "",
        firstName: data.data.firstName || "",
        lastName: data.data.lastName || "",
        department: data.data.orgUnitId || "",
        title: data.data.title || "",
        email: data.data.email || "",
        linkedinUrl: data.data.linkedinUrl || "",
        isBlocked: data.data.isBlocked || false,
        isTestData: data.data.isTestData || false,
        isSystemAdmin: data.data.isSystemAdmin || false,
        canSsoLogin: data.data.canSsoLogin || false,
        vacationMode: data.data.vacationMode || false,
        profileInfo: data.data.profileInfo || "",
        photo: data.data.photo || "",
        roleIds: data.data.roles || [],
        positionId: data.data.positionId || null,
        userLevel: data.data.userLevel || null,
      }));

    } catch (error: any) {
      console.error("Kullanıcı verisi yüklenirken hata:", error);
      
      // Güvenli hata mesajı göster
      dispatchAlert({
        message: "Kullanıcı verisi yüklenirken hata oluştu. Bu kullanıcıya erişim yetkiniz olmayabilir.",
        type: MessageBoxType.Error,
      });
      
      // Kullanıcı listesine yönlendir
      navigate("/users");
      
    } finally {
      dispatchBusy({ isBusy: false });
      setIsLoading(false);
    }
  };
  // Loading durumunda göster
  if (isLoading || !isInitialized) {
    return (
      <BaseLayout>
        <DashboardNavbar />
        <MDBox mt={4} display="flex" justifyContent="center" alignItems="center">
          <MDTypography variant="h6" color="text">
            Kullanıcı verisi yükleniyor...
          </MDTypography>
        </MDBox>
      </BaseLayout>
    );
  }

  // Geçersiz kullanıcı durumunda göster
  if (!isValidUser) {
    return (
      <BaseLayout>
        <DashboardNavbar />
        <MDBox mt={4} display="flex" justifyContent="center" alignItems="center">
          <MDTypography variant="h6" color="error">
            Geçersiz kullanıcı. Yönlendiriliyorsunuz...
          </MDTypography>
        </MDBox>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout>
      <DashboardNavbar />

      <MDBox mt={0}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <MDBox mb={3}>
              <Formik
                initialValues={formValues}
                enableReinitialize
                validationSchema={currentValidation}
                onSubmit={handleSubmit}
              >
                {({ values, errors, touched, isSubmitting }) => (
                  <Form>
                    {/* Üst bilgi (Fotoğraf + İsim) – Tab bar'ın üstünde */}
                    <Grid container spacing={3} sx={{ mb: 1, mt: -3 }}>
                      <Grid item xs={12}>
                        <Header
                          formData={{
                            values,
                            touched,
                            formField,
                            errors,
                          }}
                        />
                      </Grid>
                    </Grid>

                    {/* Üst aksiyonlar */}
                    <MDBox mb={1} sx={{ position: "sticky", top: 48, zIndex: 5, bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider", backdropFilter: 'blur(6px)', boxShadow: (theme) => `0 2px 8px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,.35)' : 'rgba(0,0,0,.06)'}` }}>
                      <MDBox display="flex" alignItems="center" justifyContent="flex-end" sx={{ gap: 1, flexWrap: "wrap", py: 1 }}>
                        <MDButton variant="outlined" color="secondary" onClick={() => navigate(-1)} startIcon={<Icon>close</Icon>}>
                          İptal
                        </MDButton>
                        <MDButton type="submit" variant="gradient" color="info" startIcon={<Icon>save</Icon>}>
                          {formGudid ? "Kullanıcıyı Güncelle" : "Kullanıcı Oluştur"}
                        </MDButton>
                      </MDBox>
                    </MDBox>

                    {/* UI5 TabContainer */}
                    <TabContainer
                      collapsed={false}
                      onTabSelect={(e: any) => setActiveTab(String(e.detail?.tab?.dataset?.key || items[0]?.key))}
                      style={{ width: '100%' }}
                    >
                      {items.map((it: any) => {
                        const ui5Icon = ({
                          profile: 'sap-icon://employee',
                          password: 'sap-icon://key',
                          accounts: 'sap-icon://contacts',
                          organization: 'sap-icon://building',
                          ticket: 'sap-icon://task',
                          userTenants: 'sap-icon://group',
                          tenantRoles: 'sap-icon://shield',
                          tenantFormRoles: 'sap-icon://shield',
                          danger: 'sap-icon://delete',
                        } as any)[it.key];
                        return (
                          <Tab key={it.key} data-key={it.key} text={it.label} selected={activeTab === it.key} icon={ui5Icon}>
                            {it.key === "profile" && (
                              <MDBox sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, bgcolor: 'background.paper' }}>
                                <Grid container spacing={3}>
                                  <Grid item xs={12}>
                                    <BasicInfo
                                      readOnlyUserName={formGudid!!}
                                      formData={{ values, touched, formField, errors }}
                                    />
                                  </Grid>
                                </Grid>
                              </MDBox>
                            )}

                            {it.key === "password" && (
                              <MDBox sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, bgcolor: 'background.paper' }}>
                                <Grid container spacing={3}>
                                  <Grid item xs={12}>
                                    {formGudid ? (
                                      <ChangePassword formData={{ values, touched, formField, errors }} />
                                    ) : (
                                      <NewPaswword formData={{ values, touched, formField, errors }} />
                                    )}
                                  </Grid>
                                </Grid>
                              </MDBox>
                            )}

                            {it.key === "accounts" && isGlobalAdmin && (
                              <MDBox sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, bgcolor: 'background.paper' }}>
                                <Grid container spacing={3}>
                                  <Grid item xs={12}>
                                    {/* Accounts içeriği burada eklenebilir */}
                                  </Grid>
                                </Grid>
                              </MDBox>
                            )}

                            {it.key === "userTenants" && isGlobalAdmin && (
                              <MDBox sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, bgcolor: 'background.paper' }}>
                                <Grid container spacing={3}>
                                  <Grid item xs={12}>
                                    <UserTenantAdmin userId={formGudid || undefined} />
                                  </Grid>
                                </Grid>
                              </MDBox>
                            )}

                            {it.key === "organization" && isTenantMode && (
                              <MDBox sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, bgcolor: 'background.paper' }}>
                                <Grid container spacing={3}>
                                  <Grid item xs={12}>
                                    {formGudid || userId ? (
                                      <UserOrganization userId={formGudid || userId || undefined} />
                                    ) : (
                                      <MDBox p={3} textAlign="center">
                                        <MDTypography variant="body2" color="text">
                                          Kullanıcı bilgileri yükleniyor...
                                        </MDTypography>
                                      </MDBox>
                                    )}
                                  </Grid>
                                </Grid>
                              </MDBox>
                            )}

                            {it.key === "ticket" && isTenantMode && (
                              <MDBox sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, bgcolor: 'background.paper' }}>
                                <Grid container spacing={3}>
                                  <Grid item xs={12}>

                                  </Grid>
                                </Grid>
                              </MDBox>
                            )}

                            {it.key === "tenantRoles" && isTenantMode && (
                              <MDBox sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, bgcolor: 'background.paper' }}>
                                <Grid container spacing={3}>
                                  <Grid item xs={12}>
                                    <UserTenantRoles userId={formGudid || undefined} />
                                  </Grid>
                                </Grid>
                              </MDBox>
                            )}

                            {it.key === "tenantFormRoles" && isTenantMode && (
                              <MDBox sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, bgcolor: 'background.paper' }}>
                                <Grid container spacing={3}>
                                  <Grid item xs={12}>
                                    <UserTenantFormRoles userId={formGudid || undefined} />
                                  </Grid>
                                </Grid>
                              </MDBox>
                            )}

                            {it.key === "danger" && (
                              <MDBox sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, bgcolor: 'background.paper' }}>
                                <Grid container spacing={3}>
                                  <Grid item xs={12}>
                                    <DeleteAccount />
                                  </Grid>
                                </Grid>
                              </MDBox>
                            )}
                          </Tab>
                        );
                      })}
                    </TabContainer>
                  </Form>
                )}
              </Formik>
            </MDBox>
          </Grid>
        </Grid>
      </MDBox>
    </BaseLayout>
  );
}

export default Settings;
