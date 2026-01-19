const TenantAdminPage = lazy(() => import("pages/tenant-admin"));
// Removed the misplaced TenantAdminPage route object
const SpecialDaysPage = lazy(() => import("pages/specialdays/SpecialDaysPage"));
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

/**
  All of the routes for the Material Dashboard 2 PRO React are added here,
  You can add a new route, customize the routes and delete the routes here.

  Once you add a new route on this file it will be visible automatically on
  the Sidenav.
    {
      type: "collapse",
      name: "Tenant Admin (Yeni)",
      key: "tenant-admin-page",
      icon: <Icon fontSize="medium">admin_panel_settings</Icon>,
      route: "/tenant-admin",
      component: <TenantAdminPage />,
      noCollapse: true,
    },

  For adding a new route you can follow the existing routes in the routes array.
  1. The `type` key with the `collapse` value is used for a route.
  2. The `type` key with the `title` value is used for a title inside the Sidenav.
  3. The `type` key with the `divider` value is used for a divider between Sidenav items.
  4. The `name` key is used for the name of the route on the Sidenav.
  5. The `key` key is used for the key of the route (It will help you with the key prop inside a loop).
  6. The `icon` key is used for the icon of the route on the Sidenav, you have to add a node.
  7. The `collapse` key is used for making a collapsible item on the Sidenav that contains other routes
  inside (nested routes), you need to pass the nested routes inside an array as a value for the `collapse` key.
  8. The `route` key is used to store the route location which is used for the react router.
  9. The `href` key is used to store the external links location.
  10. The `title` key is only for the item with the type of `title` and its used for the title text on the Sidenav.
  10. The `component` key is used to store the component of its route.
*/

import { lazy } from "react";

// Material Dashboard 2 PRO React layouts (lazy loaded)
const Analytics = lazy(() => import("layouts/dashboards/analytics"));
const Sales = lazy(() => import("layouts/dashboards/sales"));
const ProfileOverview = lazy(() => import("layouts/pages/profile/profile-overview"));
const AllProjects = lazy(() => import("layouts/pages/profile/all-projects"));
const NewUser = lazy(() => import("layouts/pages/users/new-user"));
const ListUser = lazy(() => import("layouts/pages/users/list-user"));

const Billing = lazy(() => import("layouts/pages/account/billing"));
const Invoice = lazy(() => import("layouts/pages/account/invoice"));
const Timeline = lazy(() => import("layouts/pages/projects/timeline"));
const PricingPage = lazy(() => import("layouts/pages/pricing-page"));
const Widgets = lazy(() => import("layouts/pages/widgets"));
const RTL = lazy(() => import("layouts/pages/rtl"));
const Charts = lazy(() => import("layouts/pages/charts"));
const Notifications = lazy(() => import("layouts/pages/notifications"));
const Kanban = lazy(() => import("layouts/applications/kanban"));
const Wizard = lazy(() => import("layouts/applications/wizard"));

const ContactListPage = lazy(() => import("pages/contact/ContactListPage"));
const ContactPage = lazy(() => import("pages/contact/ContactPage"));

const Calendar = lazy(() => import("layouts/applications/calendar"));
const OpportunitiesListPage = lazy(() => import("pages/opportunities/OpportunitiesListPage"));
const OpportunityFormPage = lazy(() => import("pages/opportunities/OpportunityFormPage"));
const OpportunitiesKanbanBoard = lazy(() => import("pages/opportunities/OpportunitiesKanbanBoard"));
const ProjectsDashboard = lazy(() => import("layouts/pages/projects/Dashboard"));
const ProjectShell = lazy(() => import("layouts/pages/projects/ProjectShell"));
const OpportunitiesKanbanPage = lazy(() => import("pages/opportunities/OpportunitiesKanbanPage"));
const SeedOpportunityStagesPage = lazy(() => import("pages/settings/SeedOpportunityStagesPage"));
const OrdersConsolePage = lazy(() => import("layouts/pages/orders/Console"));
const NewProduct = lazy(() => import("layouts/ecommerce/products/new-product"));
const EditProduct = lazy(() => import("layouts/ecommerce/products/edit-product"));
const ProductPage = lazy(() => import("layouts/ecommerce/products/product-page"));
const OrderList = lazy(() => import("layouts/ecommerce/orders/order-list"));
const OrderDetails = lazy(() => import("layouts/ecommerce/orders/order-details"));
const SignInBasic = lazy(() => import("layouts/authentication/sign-in/basic"));
const SignInCover = lazy(() => import("layouts/authentication/sign-in/cover"));
const SignInIllustration = lazy(() => import("layouts/authentication/sign-in/illustration"));
const SignUpCover = lazy(() => import("layouts/authentication/sign-up/cover"));
const ResetCover = lazy(() => import("layouts/authentication/reset-password/cover"));
const TenantSelect = lazy(() => import("layouts/authentication/tenant-select"));

// Material Dashboard 2 PRO React TS components
import MDAvatar from "components/MDAvatar";

// @mui icons
import Icon from "@mui/material/Icon";

// Images
import profilePicture from "assets/images/team-3.jpg";
import { useUser } from "layouts/pages/hooks/userName";
const Logout = lazy(() => import("layouts/authentication/sign-in/cover/Logout"));
const EditProject = lazy(() => import("layouts/pages/profile/all-projects/edit-product"));


const MenuList = lazy(() => import("layouts/pages/menuDefination/MenuList"));
const MenuDetail = lazy(() => import("layouts/pages/menuDefination/MenuDetail"));
const ListForm = lazy(() => import("layouts/pages/FormManagement/listForm"));
const CreateForm = lazy(() => import("layouts/pages/FormManagement/ParamtetersDefination"));
const ParameterEdit = lazy(() => import("layouts/pages/FormManagement/ParameterEdit"));

const UserFormList = lazy(() => import("layouts/pages/FormManagement/UsersForm/UserForms"));



const RolesDefination = lazy(() => import("layouts/pages/roles/RoleList"));
const RoleScreenDefination = lazy(() => import("layouts/pages/roles/RoleScreen"));
const RolesList = lazy(() => import("layouts/pages/roles/RoleList"));
const NotAuthorizationPage = lazy(() => import("layouts/pages/notAuthorizationPage"));
const DataTables = lazy(() => import("layouts/pages/users/list-user"));
const Settings = lazy(() => import("layouts/pages/users/userDetail/settings"));

const WorkFlowList = lazy(() => import("layouts/pages/WorkFlow/WorkFlowList"));
const WorkFlowDetail = lazy(() => import("layouts/pages/WorkFlow/WorkFlowDetail.jsx"));
const ApproveList = lazy(() => import("layouts/pages/WorkFlow/ApproveList"));
const ParameterView = lazy(() => import("layouts/pages/FormManagement/listForm/ParameterView"));
const FormilyDesigner = lazy(() => import("layouts/pages/FormEditor/FormilyDesigner"));
const TenantsList = lazy(() => import("layouts/pages/tenants/index"));
const TenantDetail = lazy(() => import("layouts/pages/tenants/detail"));
const TenantsManagement = lazy(() => import("layouts/pages/tenants/tenantsmanagement"));
const TenantRoles = lazy(() => import("layouts/pages/tenants/tenantsmanagement/roles"));
const TenantUsers = lazy(() => import("layouts/pages/tenants/tenantsmanagement/users"));
const TenantPermissions = lazy(() => import("layouts/pages/tenants/tenantsmanagement/permissions"));
const DepartmentManagement = lazy(() => import("layouts/pages/tenants/tenantsmanagement/department"));
const PositionManagement = lazy(() => import("layouts/pages/tenants/tenantsmanagement/position"));
const TenantRolesDetail = lazy(() => import("layouts/pages/tenantroles/detail"));
const TenantUsersForTenant = lazy(() => import("layouts/pages/tenants/users"));
const SuccessFactorsHome = lazy(() => import("layouts/pages/successfactors"));
const ParametersPage = lazy(() => import("layouts/pages/settings/ParametersPage"));
const ParametersAdminPage = lazy(() => import("layouts/pages/settings/ParametersAdminPage"));
const LookupAdminPage = lazy(() => import("layouts/pages/settings/LookupAdminPage"));
const MenuHubPage = lazy(() => import("layouts/pages/menuHub/MenuHubPage"));
// User Tenants pages (under tenantsuser)
const UserTenantsList = lazy(() => import("layouts/pages/tenantsuser"));
const UserTenantsDetail = lazy(() => import("layouts/pages/tenantsuser/detail"));

// QR Menu pages
const QRMenuListPage = lazy(() => import("pages/qrmenu/QRMenuListPage"));
const QRMenuFormPage = lazy(() => import("pages/qrmenu/QRMenuFormPage"));
const QRMenuPreviewPage = lazy(() => import("pages/qrmenu/QRMenuPreviewPage"));

// const { userAppDto } = useUser(); // Context'ten veriyi alıyoruz


const routes = [


  {
    type: "collapse",
    name: "Tenant Admin",
    key: "tenant-admin",
    icon: <Icon fontSize="medium">admin_panel_settings</Icon>,
    collapse: [
      {
        name: "Form Yetkisi",
        key: "form-role",
        route: "/tenant/form-role",
        component: <TenantsManagement />,
      },
      {
        name: "Sistem Ayarları",
        key: "settings-parameters",
        route: "/settings/parameters",
        component: <ParametersPage />,
      },
      {
        name: "Tenant Kullanıcı Yönetimi",
        key: "tenant-users",
        route: "/tenant/users",
        component: <TenantUsers />,
      },
      {
        name: "Departman Tanımlama",
        key: "department-management",
        route: "/tenant/department-management",
        component: <DepartmentManagement />,
      },
      {
        name: "Pozisyon Tanımlama",
        key: "position-management",
        route: "/tenant/position-management",
        component: <PositionManagement />,
      },
    ],
  },

  {
    type: "collapse",
    name: "Global Admin",
    key: "global-admin",
    icon: <Icon fontSize="medium">admin_panel_settings</Icon>,
    collapse: [
      {
        name: "İletişim Mesajları",
        key: "contact-form",
        icon: <Icon fontSize="small">email</Icon>,
        route: "/global-admin/contact-form",
        component: <ContactListPage />,
      },
    ],
  },

  {
    type: "collapse",
    name: "Özel Günler",
    key: "specialdays",
    route: "/specialdays",
    component: <SpecialDaysPage />,
    icon: <Icon fontSize="medium">event</Icon>,
    noCollapse: true,
  },

  {
    type: "collapse",
    name: "Ana Sayfa",
    key: "home",
    icon: <Icon fontSize="medium">home</Icon>,
    collapse: [
      {
        name: "Home",
        key: "home",
        route: "/home",
        component: <SuccessFactorsHome />,
      },
    ],
  },
  {
    type: "collapse",
    name: "İletişim",
    key: "contact",
    route: "/contact",
    component: <ContactPage />,
    icon: <Icon fontSize="medium">contact_support</Icon>, // Veya 'contacts'
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "User Form List",
    key: "userFormList",
    icon: <Icon fontSize="medium">memory</Icon>,
    collapse: [
      {
        name: "userFormList",
        key: "userFormList",
        route: "/userFormList",
        component: <UserFormList />,
      },
    ],
  },
  {
    type: "collapse",
    name: "Work Company System",
    key: "workflowList",
    icon: <Icon fontSize="medium">memory</Icon>,
    collapse: [
      {
        name: "workflowList",
        key: "workflowList",
        route: "/workflowList",
        component: <WorkFlowList />,
      },
    ],
  },
  {
    type: "collapse",
    name: "Work Company System",
    key: "workflowdetail",
    icon: <Icon fontSize="medium">memory</Icon>,
    collapse: [
      {
        name: "workflowdetail",
        key: "workflowdetail",
        route: "/WorkFlowList/detail/:id",
        component: <WorkFlowDetail />,
      },
    ],
  },
  {
    type: "collapse",
    name: "Work Company System",
    key: "workflowdetailCreate",
    icon: <Icon fontSize="medium">memory</Icon>,
    collapse: [
      {
        name: "workflowdetail",
        key: "workflowdetail",
        route: "/WorkFlowList/detail",
        component: <WorkFlowDetail />,
      },


    ],
  },

  {
    type: "collapse",
    name: "Onay",
    key: "approve",
    icon: <Icon fontSize="medium">memory</Icon>,
    collapse: [
      {
        name: "approve",
        key: "approve",
        route: "/approve",
        component: <ApproveList />,
      },
    ],
  },

  {
    type: "collapse",
    name: "My Profile",
    key: "my-profile",
    icon: <MDAvatar src={profilePicture} alt="Brooklyn Alice" size="sm" />,
    collapse: [
      {
        name: "My Profile",
        key: "my-profile",
        route: "/pages/profile/profile-overview",
        component: <ProfileOverview />,

      },
      {
        name: "Settings",
        key: "profile-settings",
        route: "/pages/account/settings",
        component: <Settings />,
      },
      {
        name: "Logout",
        key: "logout",
        route: "/LogOut",
        component: <Logout />,
      },
    ],
  },
  {
    type: "hidden",
    name: "Menüler",
    key: "menus",
    icon: <Icon fontSize="medium">menu</Icon>,
    collapse: [
      {
        name: "Menü Listesi",
        key: "menu-list",
        route: "/menus",
        component: <MenuList />,
      },
    ],
  },
  {
    type: "hidden",
    name: "Menü Detayları",
    key: "menu-detail",
    icon: <Icon fontSize="medium">menu</Icon>,
    collapse: [
      {
        name: "Menü Detayları",
        key: "menu-detail",
        route: "/menus/detail",
        component: <MenuDetail />,
      },
    ],
  },
  {
    type: "hidden",
    name: "Menü Detayları With Params",
    key: "menu-detail-with-params",
    icon: <Icon fontSize="medium">menu</Icon>,
    collapse: [
      {
        name: "Menü Detayları With Params",
        key: "menu-detail-with-params",
        route: "/menus/detail/:id",
        component: <MenuDetail />,

      },
    ],
  },
  {
    type: "hidden",
    name: "Projeler",
    key: "projects",
    icon: <Icon fontSize="medium">memory</Icon>,
    collapse: [
      {
        name: "Proje Detayları",
        key: "edit-product",
        route: "/profile/all-projects/edit-project/:id", // Düzenleme rotası
        icon: <Icon fontSize="small">edit</Icon>, // Düzenleme ikonu
        component: <EditProject />, // EditProduct bileşeni
      },
      {
        name: "Proje Detayları",
        key: "edit-product",
        route: "/profile/all-projects/edit-project/", // Düzenleme rotası
        icon: <Icon fontSize="small">edit</Icon>, // Düzenleme ikonu
        component: <EditProject />, // EditProduct bileşeni
      },
    ],
  },
  {
    type: "hidden",
    name: "Roles List",
    key: "rolesList",
    icon: <Icon fontSize="medium">memory</Icon>,
    collapse: [
      {
        name: "Roles List",
        key: "rolesList",
        route: "/roles",
        component: <RolesList />,
      },
    ],
  },
  {
    type: "hidden",
    name: "edit Roles",
    key: "editRoles",
    icon: <Icon fontSize="medium">memory</Icon>,
    collapse: [
      {
        name: "edit Roles",
        key: "editRoles",
        route: "/roles/detail/:id",
        component: <RoleScreenDefination />,

      },
    ],
  },
  {
    type: "hidden",
    name: "Role Screen",
    key: "roleScreen",
    icon: <Icon fontSize="medium">memory</Icon>,
    collapse: [
      {
        name: "Role Screen",
        key: "roleScreen",
        route: "/roles/detail",
        component: <RoleScreenDefination />,

      },
    ],
  },
  {
    type: "collapse",
    name: "Formily Designer",
    key: "formily-designer",
    icon: <Icon fontSize="medium">design_services</Icon>,
    collapse: [
      {
        name: "Designer",
        key: "formily-designer",
        route: "/forms/designer",
        component: <FormilyDesigner />,
      },
    ],
  },
  {
    type: "hidden",
    name: "Form Yönetimi",
    key: "formManagement",
    icon: <Icon fontSize="medium">memory</Icon>,
    collapse: [
      {
        name: "Formlar",
        key: "forms",
        route: "/forms",
        component: <ListForm />,
      },
    ],
  },
  {
    type: "hidden",
    name: "Form Oluştur",
    key: "createForm",
    icon: <Icon fontSize="medium">memory</Icon>,
    collapse: [
      {
        name: "Yeni Form",
        key: "createForm",
        route: "/forms/detail",
        component: <CreateForm />,

      },
    ],
  },

  {
    type: "hidden",
    name: "Create Form",
    key: "createForm",
    icon: <Icon fontSize="medium">memory</Icon>,
    collapse: [
      {
        name: "Create Form",
        key: "createForm",
        route: "/ParameterEdit/",
        component: <ParameterEdit />,

      },
    ],
  },

  {
    type: "hidden",
    name: "Create Form",
    key: "createForm",
    icon: <Icon fontSize="medium">memory</Icon>,
    collapse: [
      {
        name: "Create Form",
        key: "createForm",
        route: "/forms/view/:formId/:formRunId?/:isVisibility?",
        component: <ParameterView />,

      },
    ],
  },
  {
    type: "hidden",
    name: "Formu Düzenle",
    key: "createFormWithParams",
    icon: <Icon fontSize="medium">memory</Icon>,
    collapse: [
      {
        name: "Form Düzenle",
        key: "createFormWithParams",
        route: "/forms/detail/:id",
        component: <CreateForm />,

      },
    ],
  },
  {
    type: "hidden",
    name: "all Projects w/Params",
    key: "projectsID",
    icon: <Icon fontSize="medium">memory</Icon>,
    collapse: [
      {
        name: "All Projects",
        key: "all-projects-id",
        route: "/profile/all-projects/:id",
        component: <AllProjects />,
      },
    ],
  },

  {
    type: "hidden",
    name: "User List",
    key: "userList",
    icon: <Icon fontSize="medium">memory</Icon>,
    collapse: [
      {
        name: "User List",
        key: "userList",
        route: "/users",
        component: <DataTables />,
      },
    ],
  },
  {
    type: "hidden",
    name: "User Create",
    key: "userCreate",
    icon: <Icon fontSize="medium">memory</Icon>,

    collapse: [
      {
        name: "User Create",
        key: "userCreate",
        route: "/users/detail",
        component: <Settings />,
      },

    ],
  },
  {
    type: "hidden",
    name: "User Edit",
    key: "userEdit",
    icon: <Icon fontSize="medium">memory</Icon>,

    collapse: [
      {
        name: "User Edit",
        key: "userEdit",
        route: "/users/detail/?id",
        component: <Settings />,

      },
    ],
  },



  { type: "title", title: "Pages", key: "title-pages" },
  {
    type: "collapse",
    name: "Formneo Destek Yönetim",
    key: "pages",
    icon: <Icon fontSize="medium">image</Icon>,
    collapse: [
      {
        name: "Profile",
        key: "profile",
        collapse: [
          {
            name: "Profile Overview",
            key: "profile-overview",
            route: "/profile/profile-overview",
            component: <ProfileOverview />,
          },
          {
            name: "All Projects",
            key: "all-projects",
            route: "/profile/all-projects",
            component: <AllProjects />,
          },
        ],
      },
      {
        name: "Users",
        key: "users",
        collapse: [
          {
            name: "Kullanıcı Listesi",
            key: "users",
            route: "users",
            component: <ListUser />,
          },
        ],
      },
      {
        name: "Account",
        key: "account",
        collapse: [
          {
            name: "Settings",
            key: "settings",
            route: "/pages/account/settings",
            component: <Settings />,
          },
          {
            name: "Billing",
            key: "billing",
            route: "/pages/account/billing",
            component: <Billing />,
          },
          {
            name: "Invoice",
            key: "invoice",
            route: "/pages/account/invoice",
            component: <Invoice />,
          },
        ],
      },
      {
        name: "Projects",
        key: "projects",
        collapse: [
          {
            name: "Timeline",
            key: "timeline",
            route: "/pages/projects/timeline",
            component: <Timeline />,
          },
        ],
      },
      {
        name: "Pricing Page",
        key: "pricing-page",
        route: "/pages/pricing-page",
        component: <PricingPage />,
      },
      { name: "RTL", key: "rtl", route: "/pages/rtl", component: <RTL /> },
      { name: "Widgets", key: "widgets", route: "/pages/widgets", component: <Widgets /> },
      { name: "Charts", key: "charts", route: "/pages/charts", component: <Charts /> },
      {
        name: "Notfications",
        key: "notifications",
        route: "/pages/notifications",
        component: <Notifications />,
      },
    ],
  },
  {
    type: "collapse",
    name: "Applications",
    key: "applications",
    icon: <Icon fontSize="medium">apps</Icon>,
    collapse: [
      {
        name: "Projeler",
        key: "projects-dashboard",
        route: "/projects",
        component: <ProjectsDashboard />,
      },
      {
        name: "Fırsatlar",
        key: "opportunities",
        route: "/opportunities",
        component: <OpportunitiesKanbanBoard />,
      },
      {
        name: "Fırsatlar Kanban",
        key: "opportunities-kanban",
        route: "/opportunities/kanban",
        component: <OpportunitiesKanbanBoard />,
      },
      {
        name: "Fırsat Formu",
        key: "opportunity-form",
        route: "/opportunities/:id",
        component: <OpportunityFormPage />,
      },
      {
        name: "Parameters",
        key: "parameters",
        route: "/settings/parameters",
        component: <ParametersPage />,
      },
      {
        name: "Parameters Admin",
        key: "parameters-admin",
        route: "/settings/parameters/admin",
        component: <ParametersAdminPage />,
      },
      {
        name: "Seed Opportunity Stages",
        key: "seed-opportunity-stages",
        route: "/settings/seed/opportunity-stages",
        component: <SeedOpportunityStagesPage />,
      },
      {
        name: "Lookup Admin",
        key: "lookup-admin",
        route: "/settings/lookups",
        component: <LookupAdminPage />,
      },
      {
        name: "Menu Hub",
        key: "menu-hub",
        route: "/menu/:id",
        component: <MenuHubPage />,
      },
      {
        name: "Kanban",
        key: "kanban",
        route: "/applications/kanban",
        component: <Kanban />,
      },
      {
        name: "Wizard",
        key: "wizard",
        route: "/applications/wizard",
        component: <Wizard />,
      },
      {
        name: "Data Tables",
        key: "data-tables",
        route: "/applications/data-tables",
        component: <DataTables />,
      },
      {
        name: "Calendar",
        key: "calendar",
        route: "/applications/calendar",
        component: <Calendar />,
      },
      {
        name: "Proje",
        key: "project-shell-tab",
        route: "/projects/:id/:tab",
        component: <ProjectShell />,
      },
      {
        name: "Proje (root)",
        key: "project-shell-root",
        route: "/projects/:id",
        component: <ProjectShell />,
      },
      {
        name: "Orders Console",
        key: "orders-console",
        route: "/orders/console",
        component: <OrdersConsolePage />,
      },
    ],
  },
  {
    type: "collapse",
    name: "Ecommerce",
    key: "ecommerce",
    icon: <Icon fontSize="medium">shopping_basket</Icon>,
    collapse: [
      {
        name: "Products",
        key: "products",
        collapse: [
          {
            name: "New Product",
            key: "new-product",
            route: "/ecommerce/products/new-product",
            component: <NewProduct />,
          },
          {
            name: "Edit Product",
            key: "edit-product",
            route: "/ecommerce/products/edit-product",
            component: <EditProduct />,
          },
          {
            name: "Product Page",
            key: "product-page",
            route: "/ecommerce/products/product-page",
            component: <ProductPage />,
          },
        ],
      },
      {
        name: "Orders",
        key: "orders",
        collapse: [
          {
            name: "Order List",
            key: "order-list",
            route: "/ecommerce/orders/order-list",
            component: <OrderList />,
          },
          {
            name: "Order Details",
            key: "order-details",
            route: "/ecommerce/orders/order-details",
            component: <OrderDetails />,
          },
        ],
      },
    ],
  },
  {
    type: "collapse",
    name: "Authentication",
    key: "authentication",
    icon: <Icon fontSize="medium">content_paste</Icon>,
    collapse: [
      {
        name: "Sign In",
        key: "sign-in",
        collapse: [
          {
            name: "Basic",
            key: "basic",
            route: "/authentication/sign-in/basic",
            component: <SignInBasic />,
          },
          {
            name: "Illustration",
            key: "illustration",
            route: "/authentication/sign-in/illustration",
            component: <SignInIllustration />,
          },
        ],
      },
      {
        name: "Sign Up",
        key: "sign-up",
        collapse: [
          {
            name: "Cover",
            key: "cover",
            route: "/authentication/sign-up/cover",
            component: <SignUpCover />,
          },
        ],
      },
      {
        name: "Reset Password",
        key: "reset-password",
        collapse: [
          {
            name: "Cover",
            key: "cover",
            route: "/authentication/reset-password",
            component: <ResetCover />,
          },
        ],
      },
      {
        name: "Tenant Select",
        key: "tenant-select",
        collapse: [
          {
            name: "Select",
            key: "select",
            route: "/authentication/tenant-select",
            component: <TenantSelect />,
          },
        ],
      },
    ],
  },
  { type: "divider", key: "divider-1" },
  { type: "title", title: "Docs", key: "title-docs" },
  {
    type: "collapse",
    name: "Basic",
    key: "basic",
    icon: <Icon fontSize="medium">upcoming</Icon>,
    collapse: [
      {
        name: "Getting Started",
        key: "getting-started",
        collapse: [
          {
            name: "Overview",
            key: "overview",
            href: "https://www.creative-tim.com/learning-lab/react/overview/material-dashboard/",
          },
          {
            name: "License",
            key: "license",
            href: "https://www.creative-tim.com/learning-lab/react/license/material-dashboard/",
          },
          {
            name: "Quick Start",
            key: "quick-start",
            href: "https://www.creative-tim.com/learning-lab/react/quick-start/material-dashboard/",
          },
          {
            name: "Build Tools",
            key: "build-tools",
            href: "https://www.creative-tim.com/learning-lab/react/build-tools/material-dashboard/",
          },
        ],
      },
      {
        name: "Foundation",
        key: "foundation",
        collapse: [
          {
            name: "Colors",
            key: "colors",
            href: "https://www.creative-tim.com/learning-lab/react/colors/material-dashboard/",
          },
          {
            name: "Grid",
            key: "grid",
            href: "https://www.creative-tim.com/learning-lab/react/grid/material-dashboard/",
          },
          {
            name: "Typography",
            key: "base-typography",
            href: "https://www.creative-tim.com/learning-lab/react/base-typography/material-dashboard/",
          },
          {
            name: "Borders",
            key: "borders",
            href: "https://www.creative-tim.com/learning-lab/react/borders/material-dashboard/",
          },
          {
            name: "Box Shadows",
            key: "box-shadows",
            href: "https://www.creative-tim.com/learning-lab/react/box-shadows/material-dashboard/",
          },
          {
            name: "Functions",
            key: "functions",
            href: "https://www.creative-tim.com/learning-lab/react/functions/material-dashboard/",
          },
          {
            name: "Routing System",
            key: "routing-system",
            href: "https://www.creative-tim.com/learning-lab/react/routing-system/material-dashboard/",
          },
        ],
      },
    ],
  },
  {
    type: "collapse",
    name: "Components",
    key: "components",
    icon: <Icon fontSize="medium">view_in_ar</Icon>,
    collapse: [
      {
        name: "Alerts",
        key: "alerts",
        href: "https://www.creative-tim.com/learning-lab/react/alerts/material-dashboard/",
      },
      {
        name: "Avatar",
        key: "avatar",
        href: "https://www.creative-tim.com/learning-lab/react/avatar/material-dashboard/",
      },
      {
        name: "Badge",
        key: "badge",
        href: "https://www.creative-tim.com/learning-lab/react/badge/material-dashboard/",
      },
      {
        name: "Badge Dot",
        key: "badge-dot",
        href: "https://www.creative-tim.com/learning-lab/react/badge-dot/material-dashboard/",
      },
      {
        name: "Box",
        key: "box",
        href: "https://www.creative-tim.com/learning-lab/react/box/material-dashboard/",
      },
      {
        name: "Buttons",
        key: "buttons",
        href: "https://www.creative-tim.com/learning-lab/react/buttons/material-dashboard/",
      },
      {
        name: "Date Picker",
        key: "date-picker",
        href: "https://www.creative-tim.com/learning-lab/react/datepicker/material-dashboard/",
      },
      {
        name: "Dropzone",
        key: "dropzone",
        href: "https://www.creative-tim.com/learning-lab/react/dropzone/material-dashboard/",
      },
      {
        name: "Editor",
        key: "editor",
        href: "https://www.creative-tim.com/learning-lab/react/quill/material-dashboard/",
      },
      {
        name: "Input",
        key: "input",
        href: "https://www.creative-tim.com/learning-lab/react/input/material-dashboard/",
      },
      {
        name: "Pagination",
        key: "pagination",
        href: "https://www.creative-tim.com/learning-lab/react/pagination/material-dashboard/",
      },
      {
        name: "Progress",
        key: "progress",
        href: "https://www.creative-tim.com/learning-lab/react/progress/material-dashboard/",
      },
      {
        name: "Snackbar",
        key: "snackbar",
        href: "https://www.creative-tim.com/learning-lab/react/snackbar/material-dashboard/",
      },
      {
        name: "Social Button",
        key: "social-button",
        href: "https://www.creative-tim.com/learning-lab/react/social-buttons/material-dashboard/",
      },
      {
        name: "Typography",
        key: "typography",
        href: "https://www.creative-tim.com/learning-lab/react/typography/material-dashboard/",
      },
    ],
  },
  {
    type: "collapse",
    name: "Change Log",
    key: "changelog",
    href: "https://github.com/creativetimofficial/ct-material-dashboard-pro-react/blob/main/CHANGELOG.md",
    icon: <Icon fontSize="medium">receipt_long</Icon>,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Tenants",
    key: "tenants",
    icon: <Icon fontSize="medium">business</Icon>,
    collapse: [
      {
        name: "Tenant List",
        key: "tenant-list",
        route: "/tenants",
        component: <TenantsList />,
      },
      {
        name: "Tenant Detail",
        key: "tenant-detail",
        route: "/tenants/detail",
        component: <TenantDetail />,
      },
      {
        name: "Tenants Management",
        key: "tenants-management",
        route: "/tenants/management",
        component: <TenantsManagement />,
      },
      {
        name: "Tenants Management Roles",
        key: "tenants-management-roles",
        route: "/tenants/management/roles",
        component: <TenantRolesDetail />,
      },
      {
        name: "Tenants Management Users",
        key: "tenants-management-users",
        route: "/tenants/management/users",
        component: <TenantUsers />,
      },
      {
        name: "Tenant Users (Scoped)",
        key: "tenants-management-users-scoped",
        route: "/tenants/:tenantId/users",
        component: <TenantUsersForTenant />,
      },
      {
        name: "Tenants Management Permissions",
        key: "tenants-management-permissions",
        route: "/tenants/management/permissions",
        component: <TenantPermissions />,
      },
    ],
  },
  {
    type: "collapse",
    name: "User Tenants",
    key: "user-tenants",
    icon: <Icon fontSize="medium">group</Icon>,
    collapse: [
      {
        name: "User Tenants List",
        key: "user-tenants-list",
        route: "/tenantsuser",
        component: <UserTenantsList />,
      },
      {
        name: "User Tenants Detail",
        key: "user-tenants-detail",
        route: "/tenantsuser/detail",
        component: <UserTenantsDetail />,
      },
    ],
  },
  {
    type: "collapse",
    name: "QR Menü",
    key: "qr-menu",
    icon: <Icon fontSize="medium">qr_code</Icon>,
    collapse: [
      {
        name: "Menü Listesi",
        key: "qr-menu-list",
        route: "/qrmenu",
        component: <QRMenuListPage />,
      },
      {
        name: "Yeni Menü",
        key: "qr-menu-new",
        route: "/qrmenu/new",
        component: <QRMenuFormPage />,
      },
    ],
  },
  {
    type: "hidden",
    name: "QR Menu Edit",
    key: "qr-menu-edit",
    icon: <Icon fontSize="medium">qr_code</Icon>,
    collapse: [
      {
        name: "Menü Düzenle",
        key: "qr-menu-edit",
        route: "/qrmenu/edit/:id",
        component: <QRMenuFormPage />,
      },
    ],
  },
  {
    type: "hidden",
    name: "QR Menu Preview",
    key: "qr-menu-preview",
    icon: <Icon fontSize="medium">qr_code</Icon>,
    collapse: [
      {
        name: "Menü Önizleme",
        key: "qr-menu-preview",
        route: "/qrmenu/preview/:id",
        component: <QRMenuPreviewPage />,
      },
    ],
  },
  {
    type: "hidden",
    name: "QR Menu Public",
    key: "qr-menu-public",
    icon: <Icon fontSize="medium">qr_code</Icon>,
    collapse: [
      {
        name: "Menü Görünümü",
        key: "qr-menu-public",
        route: "/menu/:id",
        component: <QRMenuPreviewPage />,
      },
    ],
  },
];

export default routes;
function GetFullName() {
  return localStorage.getItem("menuNameSurmane");

  return Math.floor(Math.random() * 100); // 0 ile 99 arasında rastgele sayı

  return "33";
  // // const fullName = useFullName(); // Custom hook'u çağırıyoruz

  // // return fullName;
}
