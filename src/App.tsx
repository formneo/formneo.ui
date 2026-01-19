const ContactPage = lazy(() => import("pages/contact/ContactPage"));
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

import { useState, useEffect, useMemo, JSXElementConstructor, Key, ReactElement, Suspense, lazy } from "react";

// react-router components
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// @mui material components
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Icon from "@mui/material/Icon";
import "wx-react-gantt/dist/gantt.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";


// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";

// Material Dashboard 2 PRO React TS exampless
import Configurator from "examples/Configurator";

// Material Dashboard 2 PRO React TS themes
import theme from "assets/theme";
import themeRTL from "assets/theme/theme-rtl";

// Material Dashboard 2 PRO React TS Dark Mode themes
import themeDark from "assets/theme-dark";
import themeDarkRTL from "assets/theme-dark/theme-rtl";

// RTL plugins
import rtlPlugin from "stylis-plugin-rtl";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";

// Material Dashboard 2 PRO React TS routes
import routes from "routes";

// Material Dashboard 2 PRO React TS contexts
import { useMaterialUIController, setMiniSidenav, setOpenConfigurator } from "context";

// Images

const NewUser = lazy(() => import("layouts/pages/users/new-user"));
const UserDetail = lazy(() => import("layouts/pages/users/userDetail/settings/index"));
const AllDemos = lazy(() => import("layouts/pages/demos/all-projects"));
const Logout = lazy(() => import("layouts/authentication/sign-in/cover/Logout"));
import PrivateRoute from "layouts/authentication/sign-in/cover/PrivateRoute";
const Cover = lazy(() => import("layouts/authentication/sign-in/cover"));
const LandingPage = lazy(() => import("layouts/pages/landing"));
const ProcessDetail = lazy(() => import("layouts/pages/landing/ProcessDetail"));
const CompanyRegister = lazy(() => import("layouts/authentication/company-register"));
const AllProjects = lazy(() => import("layouts/pages/profile/all-projects"));
const MessagePage = lazy(() => import("layouts/applications/chat/MessagePage"));
const MenuList = lazy(() => import("layouts/pages/menuDefination/MenuList"));
const MenuDetail = lazy(() => import("layouts/pages/menuDefination/MenuDetail"));
const ParametersPage = lazy(() => import("layouts/pages/settings/ParametersPage"));
const NotAuthorizationPage = lazy(() => import("layouts/pages/notAuthorizationPage"));
const ResetCover = lazy(() => import("layouts/authentication/reset-password/cover"));
const Analytics = lazy(() => import("layouts/dashboards/analytics"));
const Sales = lazy(() => import("layouts/dashboards/sales"));
const CustomerSales = lazy(() => import("layouts/dashboards/customer"));

// import ChatPage from "layouts/applications/chat/chatpage";

const PositionPage = lazy(() => import("layouts/pages/position"));
const PositionDetailPage = lazy(() => import("layouts/pages/position/details"));
const IsTakipYazilimi = lazy(() => import("layouts/pages/articles/IsTakipYazilimi"));
const ProjeYonetimiYazilimi = lazy(() => import("layouts/pages/articles/ProjeYonetimiYazilimi"));
const FormRoleList = lazy(() => import("layouts/pages/FormManagement/form-role/list"));
const FormRoleDetail = lazy(() => import("layouts/pages/FormManagement/form-role/detail"));
import { useTranslation } from "react-i18next";


const FormAuth = lazy(() => import("layouts/pages/FormManagement/FormAuth/FormAuth"));
const FormAuthDetail = lazy(() => import("layouts/pages/FormManagement/FormAuth/FormAuthDetail"));
const FormList = lazy(() => import("layouts/pages/FormManagement/UsersForm/FormList"));
const TenantFormRole = lazy(() => import("layouts/pages/FormManagement/tenant-form-role"));
const TenantFormRoleList = lazy(() => import("layouts/pages/FormManagement/tenant-form-role/list"));
const ResumeBuild = lazy(() => import("layouts/pages/resumeBuilder"));
const VpnDashboard = lazy(() => import("layouts/pages/vpnPage"));
const KanbanPage = lazy(() => import("layouts/pages/kanban"));
const CustomerList = lazy(() => import("layouts/pages/customer"));
const CustomerDetail = lazy(() => import("layouts/pages/customer/detail"));
const CustomersPage = lazy(() => import("pages/customers/CustomersPage"));
const CustomerDashboardPage = lazy(() => import("pages/customer/CustomerDashboardPage"));
const CustomerFormPage = lazy(() => import("pages/customer/CustomerFormPage"));
const OrdersConsolePage = lazy(() => import("layouts/pages/orders/Console"));
const ProjectsDashboard = lazy(() => import("layouts/pages/projects/Dashboard"));
const ProjectShell = lazy(() => import("layouts/pages/projects/ProjectShell"));
// axios interceptors (global) – must be imported once at startup
import "api/interceptors";
import { ActionBarProvider } from "context/ActionBarContext";
import OpportunityFormPage from "./pages/opportunities/OpportunityFormPage";
// Publicly exposed WorkFlow & FormManagement pages
const WorkFlowList = lazy(() => import("layouts/pages/WorkFlow/WorkFlowList"));
const WorkFlowDetail = lazy(() => import("layouts/pages/WorkFlow/WorkFlowDetail.jsx"));
const WorkflowMyTasks = lazy(() => import("layouts/pages/WorkFlow/WorkflowMyTasks"));
const WorkflowRuntime = lazy(() => import("layouts/pages/WorkFlow/WorkflowRuntime"));
const ListFormPublic = lazy(() => import("layouts/pages/FormManagement/listForm"));
const CreateFormPublic = lazy(() => import("layouts/pages/FormManagement/ParamtetersDefination"));
const ParameterEditPublic = lazy(() => import("layouts/pages/FormManagement/ParameterEdit"));
const ParameterViewPublic = lazy(() => import("layouts/pages/FormManagement/listForm/ParameterView"));
const FormDesigner = lazy(() => import("layouts/pages/FormManagement/FormDesigner"));
const FormEditor = lazy(() => import("layouts/pages/FormEditor/FormEditorV2"));
const FormilyDesigner = lazy(() => import("layouts/pages/FormEditor/FormilyDesigner"));
const FormilyPreviewPage = lazy(() => import("pages/forms/FormilyPreviewPage"));
const UserFormCrudPage = lazy(() => import("pages/forms/UserFormCrudPage"));

export default function App() {
  const [controller, dispatch] = useMaterialUIController();
  const {
    direction,
    layout,
    openConfigurator,
    darkMode,
  } = controller;
  const [onMouseEnter, setOnMouseEnter] = useState(false);
  const [rtlCache, setRtlCache] = useState(null);
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const isTenantSelectRoute = pathname.startsWith('/authentication/tenant-select');

  // Cache for the rtl
  useMemo(() => {
    const pluginRtl: any = rtlPlugin;
    const cacheRtl = createCache({
      key: "rtl",
      stylisPlugins: [pluginRtl],
    });

    setRtlCache(cacheRtl);
  }, []);

  // // Open sidenav when mouse enter on mini sidenav
  // const handleOnMouseEnter = () => {
  //   if (miniSidenav && !onMouseEnter) {
  //     setMiniSidenav(dispatch, false);
  //     setOnMouseEnter(true);
  //   }
  // };

  // // Close sidenav when mouse leave mini sidenav
  // const handleOnMouseLeave = () => {
  //   if (onMouseEnter) {
  //     setMiniSidenav(dispatch, true);
  //     setOnMouseEnter(false);
  //   }
  // };

  // Change the openConfigurator state
  const handleConfiguratorOpen = () => setOpenConfigurator(dispatch, !openConfigurator);

  // Setting the dir attribute for the body element
  useEffect(() => {
    document.body.setAttribute("dir", direction);
  }, [direction]);

  // Setting page scroll to 0 when changing the route
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
  }, [pathname]);

  const getRoutes = (allRoutes: any[]): any =>
    allRoutes.map(
      (route: {
        collapse: any;
        route: string;
        component: ReactElement<any, string | JSXElementConstructor<any>>;
        key: Key;
      }) => {
        if (route.collapse) {
          return getRoutes(route.collapse);
        }

        if (route.route) {
          return <Route path={route.route} element={route.component} key={route.key} />;
        }

        return null;
      }
    );

  // const configsButton = (
  //   // <MDBox
  //   //   display="flex"
  //   //   justifyContent="center"
  //   //   alignItems="center"
  //   //   width="3.25rem"
  //   //   height="3.25rem"
  //   //   bgColor="white"
  //   //   shadow="sm"
  //   //   borderRadius="50%"
  //   //   position="fixed"
  //   //   right="2rem"
  //   //   bottom="2rem"
  //   //   zIndex={99}
  //   //   color="dark"
  //   //   sx={{ cursor: "pointer" }}
  //   //   onClick={handleConfiguratorOpen}
  //   // >
  //   //   {/* <Icon fontSize="small" color="inherit">
  //   //     settings
  //   //   </Icon> */}
  //   // </MDBox>
  // );

  return direction === "rtl" ? (
    <CacheProvider value={rtlCache}>
      <ThemeProvider theme={darkMode ? themeDarkRTL : themeRTL}>
        <CssBaseline />
        {/* Sidenav gizlendi */}
        {/* {layout === "vr" && <Configurator />}
        <Routes>
          {getRoutes(routes)}
          <Route path="*" element={<Navigate to="/dashboards/analytics" />} />
          <Route path="/userDetail" element={<Navigate to="/dashboards/analytics" />} />
        </Routes> */}
      </ThemeProvider>
    </CacheProvider>
  ) : (
    <ThemeProvider theme={darkMode ? themeDark : theme}>
      <CssBaseline />
      {/* Sidenav gizlendi */}
      {layout === "vr" && <Configurator />}

      <ActionBarProvider>
        <Suspense fallback={<div style={{ padding: 24 }}>Yükleniyor…</div>}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/processes/:key" element={<ProcessDetail />} />
            <Route path="/forms/designer" element={<FormilyDesigner />} />
            <Route path="/forms/designer/:id" element={<FormilyDesigner />} />
            <Route path="/authentication/sign-in/cover" element={<Cover />} />
            <Route path="/authentication/company-register" element={<CompanyRegister />} />
            <Route path="/LogOut" element={<Logout />} />

            {/* İletişim Sayfası Public Route */}
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/authentication/reset-password" element={<ResetCover />} />
            <Route path="/tickets/customer" element={<CustomerSales />} />
            <Route path="/orders/console" element={<OrdersConsolePage />} />
            {/* Public WorkFlow routes */}
            <Route path="/workflowList" element={<WorkFlowList />} />
            <Route path="/WorkFlowList/detail" element={<WorkFlowDetail />} />
            <Route path="/WorkFlowList/detail/:id" element={<WorkFlowDetail />} />
            <Route path="/workflows/my-tasks" element={<WorkflowMyTasks />} />
            <Route path="/workflows/runtime/:id" element={<WorkflowRuntime />} />
            <Route path="/workflows/runtime/new" element={<WorkflowRuntime />} />
            {/* Public FormManagement routes (istenen şekilde public) */}
            <Route path="/forms" element={<ListFormPublic />} />
            <Route path="/forms/detail" element={<FormDesigner />} />
            <Route path="/forms/detail/:id" element={<FormDesigner />} />
            <Route path="/forms/editor" element={<FormEditor />} />
            <Route path="/forms/editor/:id" element={<FormEditor />} />

            <Route path="/ParameterEdit/" element={<ParameterEditPublic />} />
            <Route path="/forms/view/:formId/:formRunId?/:isVisibility?" element={<ParameterViewPublic />} />
            {/* Yeni Formily preview: Formily şeması varsa burada, değilse eski viewer'a fallback edilir */}
            <Route path="/forms/preview/:id" element={<FormilyPreviewPage />} />
            {/* Kullanıcı formu (CRUD) */}
            <Route path="/userForm/:id" element={<UserFormCrudPage />} />
            {/* SEO Articles */}
            <Route path="/makale/is-takip-yazilimi" element={<IsTakipYazilimi />} />
            <Route path="/makale/proje-yonetimi-yazilimi" element={<ProjeYonetimiYazilimi />} />
            {/* Projects (Public for now) */}
            <Route path="/projects" element={<ProjectsDashboard />} />
            <Route path="/projects/:id" element={<ProjectsDashboard />} />
            <Route path="/projects/:id/:tab" element={<ProjectsDashboard />} />
            {/* Dashboard Routes - Genel erişim */}
            <Route path="/dashboards/analytics" element={
              <Suspense fallback={<div style={{ padding: 24 }}>Yükleniyor…</div>}>
                <Analytics />
              </Suspense>
            } />
            <Route path="/dashboards/sales" element={
              <Suspense fallback={<div style={{ padding: 24 }}>Yükleniyor…</div>}>
                <Sales />
              </Suspense>
            } />
            
            {/* Private Routes */}
            <Route element={<PrivateRoute />}>
              {getRoutes(routes)} {/* Tüm özel rotaları ekler */}
              <Route path="/dashboard" element={<Navigate to="/dashboards/analytics" />} />
              <Route path="*" element={<Navigate to="/dashboards/analytics" />} />
              <Route path="/users/detail" element={<UserDetail />} />
              <Route path="/Messages" element={<MessagePage />} />
              <Route path="/Menus" element={<MenuList />} />
              <Route path="/MenuDetail" element={<MenuDetail />} />
              <Route path="/parameters" element={<ParametersPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/customers/new" element={<CustomerFormPage />} />
              <Route path="/customers/edit" element={<CustomerFormPage />} />
              <Route path="/opportunities/new" element={<OpportunityFormPage />} />
              <Route path="/opportunities/:id" element={<OpportunityFormPage />} />
              
              <Route path="/pages/demos/alldemos" element={<AllDemos />} />
              <Route path="/tickets/statistic" element={<Sales />} />
    

              <Route path="/position" element={<PositionPage />} />
              <Route path="/position/detail" element={<PositionDetailPage />} />
              <Route path="/position/detail/:id" element={<PositionDetailPage />} />
              <Route path="/form-role" element={<FormRoleList />} />
              <Route path="/form-role/detail" element={<FormRoleDetail />} />
              <Route path="/form-role/detail/:id" element={<FormRoleDetail />} />
              <Route path="/resumeBuild" element={<ResumeBuild />} />
              <Route path="/vpn" element={<VpnDashboard />} />
              <Route path="/kanban" element={<KanbanPage />} />
 
              <Route path="/customer" element={<CustomerList />} />
              <Route path="/customer/detail" element={<CustomerDetail />} />
              <Route path="/customer/detail/:id" element={<CustomerDetail />} />

              <Route path="/formAuth" element={<FormAuth />} />
              <Route path="/formAuth/detail" element={<FormAuthDetail />} />
              <Route path="/formAuth/detail/:id" element={<FormAuthDetail />} />

              <Route path="/formList/:formId" element={<FormList />} />
              <Route path="/tenant/form-role" element={<TenantFormRoleList />} />
              <Route path="/tenant/form-role/detail" element={<TenantFormRole />} />
              <Route path="/tenant/form-role/detail/:id" element={<TenantFormRole />} />
              {/* <Route path="/mmessages" element={<ChatPage />} /> */}
            </Route>

            <Route path="/NotAuthorization" element={<NotAuthorizationPage />} />

            {/* Tüm Eşleşmeyen URL'ler için Yönlendirme */}
            {/* <Route path="*" element={<Navigate to="/dashboards/analytics" replace />} /> */}
          </Routes>
        </Suspense>
      </ActionBarProvider>
    </ThemeProvider>
  );
}
