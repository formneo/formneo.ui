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

import { useState, useEffect } from "react";

// react-router components
import { useLocation, Link, useNavigate } from "react-router-dom";

// @material-ui core components
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import Icon from "@mui/material/Icon";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDInput from "components/MDInput";
import MDBadge from "components/MDBadge";
import profile from "../../../assets/images/profile-icon.png";
import logoSon from "../../../assets/images/logoson.svg";

// Material Dashboard 2 PRO React TS examples components
import Breadcrumbs from "examples/Breadcrumbs";
import NotificationItem from "examples/Items/NotificationItem";

// Custom styles for DashboardNavbar
import {
  navbar,
  navbarContainer,
  navbarRow,
  navbarIconButton,
  navbarDesktopMenu,
  navbarMobileMenu,
} from "examples/Navbars/DashboardNavbar/styles";

// Material Dashboard 2 PRO React context
import {
  useMaterialUIController,
  setTransparentNavbar,
  setMiniSidenav,
  setOpenConfigurator,
  setSelectedTenantId,
} from "context";
import {
  Avatar,
  Input,
  ListItemStandard,
  MessageBoxType,
  ShellBar,
  ShellBarItem,
  SuggestionItem,
  SuggestionItemGroup,
} from "@ui5/webcomponents-react";
import {
  InputBase,
  ListItemText,
  ListItem,
  List,
  ListItemIcon,
  Modal,
  Paper,
  Popover,
  ListSubheader,
  ListItemButton,
  Divider,
  MenuItem,
  Box,
  Typography,
  Button,
  Badge,
  Tooltip,
  Drawer,
  useMediaQuery,
  Avatar as MuiAvatar,
} from "@mui/material";
import {
  Menu as NavMenuIcon,
  NotificationsOutlined as NavNotificationsIcon,
  KeyboardArrowDown as NavArrowDownIcon,
} from "@mui/icons-material";
import formneoLogo from "assets/images/formneolog.png";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import {
  MenuApi,
  UserApi,
  ApproveItemsApi,
  ForgotPasswordApi,
  ClientApi,
  UserTenantsApi,
} from "api/generated/api";
import { Configuration } from "api/generated";
import getConfiguration from "confiuration";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { themes } from "examples/Sidenav";
import { useRootMenus } from "hooks/useRootMenus";
import { useMenuAuth } from "hooks/useMenuAuth";
import { useUserTenants } from "hooks/useUserTenants";
import "primeicons/primeicons.css";

// Menü ikonunu Material Icons veya PrimeIcons olarak render eder (Sidenav ile uyumlu)
const renderNavMenuIcon = (rawIconName: string | null | undefined, color: string, fontSize?: number): React.ReactNode => {
  const size = fontSize ?? 20;
  const iconName = String(rawIconName || "").trim();
  if (!iconName) return <Icon sx={{ color, fontSize: size }}>folder</Icon>;
  const lower = iconName.toLowerCase();
  if (lower.startsWith("mi:") || lower.startsWith("material:")) {
    const name = iconName.split(":")[1] || "";
    return <Icon sx={{ color, fontSize: size }}>{name}</Icon>;
  }
  if (lower.startsWith("pi:") || lower.startsWith("prime:")) {
    const name = iconName.split(":")[1] || "";
    return <i className={`pi pi-${name}`} style={{ color, fontSize: size - 2 }} />;
  }
  const materialLikely = iconName.includes("_") || ["home", "dashboard", "menu", "business", "group", "apps", "settings", "edit"].includes(lower);
  if (materialLikely) return <Icon sx={{ color, fontSize: size }}>{iconName}</Icon>;
  return <i className={`pi pi-${iconName}`} style={{ color, fontSize: size - 2 }} />;
};

// Declaring prop types for DashboardNavbar
interface Props {
  absolute?: boolean;
  light?: boolean;
  isMini?: boolean;
}

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 500,
  p: 4,
};

type Theme = "light" | "dark";
function DashboardNavbar({ absolute, light, isMini }: Props): JSX.Element {
  const [navbarType, setNavbarType] = useState<
    "fixed" | "absolute" | "relative" | "static" | "sticky"
  >();
  const [userPhoto, setuserPhoto] = useState("");
  const [photoSrc, setPhotoSrc] = useState<string>("");
  const [userFullName, setUserFullName] = useState<string>("");
  const [controller, dispatch] = useMaterialUIController();
  const { miniSidenav, transparentNavbar, fixedNavbar, openConfigurator, darkMode } = controller;
  const [openMenu, setOpenMenu] = useState<any>(false);
  const [isDeleteModalOpen, setisDeleteModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [anchorElNoNotification, setAnchorElNoNotification] = useState<null | HTMLElement>(null);
  const route = useLocation().pathname.split("/").slice(1);
  const currentPath = useLocation().pathname;
  const [menuData, setMenuData] = useState<any>(null);
  const [filteredMenuData, setFilteredMenuData] = useState<any>(null);
  const [menuDropdownAnchor, setMenuDropdownAnchor] = useState<null | HTMLElement>(null);
  const [menuDropdownMenuId, setMenuDropdownMenuId] = useState<string | null>(null);
  const [menuDropdownSubs, setMenuDropdownSubs] = useState<any[]>([]);
  const [menuDropdownLoading, setMenuDropdownLoading] = useState(false);
  const navigate = useNavigate();
  const { data: menuAuth = [] } = useMenuAuth();

  const [theme, setTheme] = useState<Theme>(
    (localStorage.getItem("themePreference") as Theme) || "light"
  );

  const [waitingCount, setwaitingCount] = useState(0);
  const [showNoNotification, setShowNoNotification] = useState(false);
  const [tenants, setTenants] = useState<{ id: string; label: string }[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<{ id: string; label: string } | null>(null);
  const savedTenantIdLS = typeof window !== "undefined" ? localStorage.getItem("selectedTenantId") : null;
  const isGlobalMode = !(selectedTenant?.id || savedTenantIdLS);

  //sifre sifirlama
  const [currentPw, setcurrentPw] = useState<string>("");
  const [newPw, setnewPw] = useState<string>("");
  const [newPwConfirm, setnewPwConfirm] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [pswTrue, setPswTrue] = useState(true);
  const [loginMail, setloginMail] = useState<string>("");

  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();

  //
  useEffect(() => {
    // Senkron ön-yükleme: kullanıcı adı ve seçili şirket adı (label)
    try {
      const cachedFullName = localStorage.getItem("userFullName");
      if (cachedFullName) setUserFullName(cachedFullName);
      const id = localStorage.getItem("selectedTenantId");
      const label = localStorage.getItem("selectedTenantLabel");
      if (id && label && !selectedTenant) {
        setSelectedTenant({ id, label });
      }
    } catch { }

    const handleStorageChange = () => {
      const currentTheme = (localStorage.getItem("themePreference") as Theme) || "light";
      setTheme(currentTheme);
    };

    const handleThemeChange = (event: CustomEvent) => {
      setTheme(event.detail as Theme);
    };

    // Set up event listeners (polling kaldırıldı)
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("themeChange", handleThemeChange as EventListener);

    // İlk yüklemede localStorage'tan uygula
    handleStorageChange();

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("themeChange", handleThemeChange as EventListener);
    };
  }, []);

  // Fotoğrafı ilk render sonrası boşta yükle
  useEffect(() => {
    const raw = userPhoto;
    if (!raw) {
      setPhotoSrc("");
      return;
    }
    const nextSrc = `data:image/jpeg;base64,${raw}`;
    const ric: any = (window as any).requestIdleCallback || ((cb: any) => setTimeout(cb, 120));
    let cancelled = false;
    ric(() => {
      if (cancelled) return;
      const img = new Image();
      (img as any).decoding = "async";
      (img as any).loading = "lazy";
      img.src = nextSrc;
      img.onload = () => { if (!cancelled) setPhotoSrc(nextSrc); };
      img.onerror = () => { if (!cancelled) setPhotoSrc(""); };
    });
    return () => { cancelled = true; };
  }, [userPhoto]);

  // useEffect(()=> {
  //   const currentTheme = localStorage.getItem("themePreference") as Theme;
  //   if (currentTheme !== theme) {
  //     setTheme(currentTheme);
  //   }
  // }, [localStorage.getItem("themePreference")]);

  const isSpecialRoute = currentPath.startsWith("/authentication") || currentPath.startsWith("/NotAuthorization");
  const { data: tenantOpts = [], isSuccess: tenantOptsLoaded } = useUserTenants(!isSpecialRoute);

  // Tenant listesi cache'den gelince sadece seçili tenant'ı localStorage ile senkronize et
  useEffect(() => {
    if (isSpecialRoute || !tenantOptsLoaded) return;
    const opts = tenantOpts;
    setTenants(opts);
    if (opts.length === 0) {
      setSelectedTenant(null);
      localStorage.removeItem("selectedTenantId");
      localStorage.removeItem("selectedTenantLabel");
      setSelectedTenantId(dispatch as any, null as any);
      return;
    }
    const savedTenantId = localStorage.getItem("selectedTenantId");
    if (savedTenantId && opts.some((o) => o.id === savedTenantId)) {
      const match = opts.find((o) => o.id === savedTenantId) || null;
      setSelectedTenant(match);
      setSelectedTenantId(dispatch as any, savedTenantId);
      if (match?.label) localStorage.setItem("selectedTenantLabel", match.label);
    } else if (savedTenantId) {
      (async () => {
        try {
          const conf = getConfiguration();
          const clientsApi = new ClientApi(conf);
          const one = await clientsApi.apiClientIdGet(savedTenantId);
          const payloadOne: any = (one as any)?.data;
          const label = payloadOne?.name || payloadOne?.clientName || payloadOne?.title || "-";
          const fallback: any = { id: savedTenantId, label, name: label };
          setTenants((curr) => (curr.some((c) => c.id === savedTenantId) ? curr : [...curr, fallback]));
          setSelectedTenant(fallback);
          setSelectedTenantId(dispatch as any, savedTenantId);
          localStorage.setItem("selectedTenantLabel", label);
        } catch {
          const fallback: any = { id: savedTenantId, label: "-", name: "-" };
          setTenants((curr) => (curr.some((c) => c.id === savedTenantId) ? curr : [...curr, fallback]));
          setSelectedTenant(fallback);
          setSelectedTenantId(dispatch as any, savedTenantId);
          localStorage.setItem("selectedTenantLabel", "-");
        }
      })();
    } else {
      setSelectedTenant(null);
      localStorage.removeItem("selectedTenantId");
      localStorage.removeItem("selectedTenantLabel");
      setSelectedTenantId(dispatch as any, null as any);
    }
  }, [isSpecialRoute, tenantOptsLoaded, tenantOpts, dispatch]);

  // ✅ Ana menüleri cache'lenmiş hook'tan al (tekrar çağrı yapmaz)
  const { data: rootMenus = [] } = useRootMenus();

  // Navbar dropdown açıldığında alt menüleri çek
  useEffect(() => {
    if (!menuDropdownAnchor || !menuDropdownMenuId) {
      setMenuDropdownSubs([]);
      return;
    }
    let cancelled = false;
    setMenuDropdownLoading(true);
    const api = new MenuApi(getConfiguration());
    api
      .apiMenuSubMenusMenuIdGet(menuDropdownMenuId)
      .then((res) => {
        if (cancelled) return;
        const raw = res.data || [];
        const hasAuth = (m: any) => {
          const href = (m.href && String(m.href).trim()) || (m.route && String(m.route).trim()) || "";
          const norm = "/" + href.split("/").slice(1, 2).join("/");
          return menuAuth.some((a: any) => ("/" + String(a.href || "").split("/").slice(1, 2).join("/")) === norm);
        };
        const filtered = raw.filter((m: any) => hasAuth(m));
        setMenuDropdownSubs(filtered.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)));
      })
      .catch(() => {
        if (!cancelled) setMenuDropdownSubs([]);
      })
      .finally(() => {
        if (!cancelled) setMenuDropdownLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [menuDropdownAnchor, menuDropdownMenuId, menuAuth]);

  useEffect(() => {
    const isSpecialRoute = currentPath.startsWith("/authentication") || currentPath.startsWith("/NotAuthorization");
    if (!isSpecialRoute && rootMenus.length > 0) {
      setMenuData(rootMenus);
    }
  }, [currentPath, rootMenus]);

  useEffect(() => {
    setShellInfo();
    // Setting the navbar type
    if (fixedNavbar) {
      setNavbarType("sticky");
    } else {
      setNavbarType("static");
    }

    // A function that sets the transparent state of the navbar.
    function handleTransparentNavbar() {
      setTransparentNavbar(dispatch, (fixedNavbar && window.scrollY === 0) || !fixedNavbar);
    }

    /**
     The event listener that's calling the handleTransparentNavbar function when
     scrolling the window.
    */
    window.addEventListener("scroll", handleTransparentNavbar);

    // Call the handleTransparentNavbar function to set the state with the initial value.
    handleTransparentNavbar();

    // Remove event listener on cleanup
    return () => window.removeEventListener("scroll", handleTransparentNavbar);
  }, [dispatch, fixedNavbar]);

  const handleMiniSidenav = () => setMiniSidenav(dispatch, !miniSidenav);
  const handleConfiguratorOpen = () => setOpenConfigurator(dispatch, !openConfigurator);
  const handleOpenMenu = (event: any) => setOpenMenu(event.currentTarget);
  const handleCloseMenu = () => setOpenMenu(false);

  // Styles for the navbar icons
  const iconsStyle = ({
    palette: { dark, white, text },
    functions: { rgba },
  }: {
    palette: any;
    functions: any;
  }) => ({
    color: () => {
      let colorValue = light || darkMode ? white.main : dark.main;

      if (transparentNavbar && !light) {
        colorValue = darkMode ? rgba(text.main, 0.6) : text.main;
      }

      return colorValue;
    },
  });

  function setShellInfo() {
    var photo = localStorage.getItem("userPhoto");

    setuserPhoto(photo);
    const cachedFullName = localStorage.getItem("userFullName");
    if (cachedFullName) setUserFullName(cachedFullName);
  }

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = (event: any) => {
    setAnchorEl(event.detail.targetRef);
  };

  const switchToGlobal = () => {
    const current = selectedTenant?.id || localStorage.getItem("selectedTenantId");
    if (current) localStorage.setItem("prevTenantId", current);
    setSelectedTenant(null);
    localStorage.removeItem("selectedTenantId");
    localStorage.removeItem("selectedTenantLabel");
    setSelectedTenantId(dispatch as any, null as any);
    // Tam yenileme: tüm context ve header'lar sıfırlansın
    window.location.href = "/tenants/management";
  };

  const switchBackToTenant = async () => {
    const prev = localStorage.getItem("prevTenantId");
    if (!prev) return;
    let match = tenants.find((t) => t.id === prev) || null;
    if (!match) {
      try {
        const conf = getConfiguration();
        const clientApi = new ClientApi(conf);
        const res = await clientApi.apiClientIdGet(prev);
        const payload: any = (res as any)?.data;
        const label = payload?.name || payload?.clientName || payload?.title || "-";
        match = { id: prev, label, name: label } as any;
        setTenants((curr) => (curr.some((c) => c.id === prev) ? curr : [...curr, match as any]));
      } catch {
        match = { id: prev, label: "-", name: "-" } as any;
        setTenants((curr) => (curr.some((c) => c.id === prev) ? curr : [...curr, match as any]));
      }
    }
    setSelectedTenant(match);
    if (match) {
      localStorage.setItem("selectedTenantId", match.id);
      if ((match as any).label) localStorage.setItem("selectedTenantLabel", (match as any).label);
      setSelectedTenantId(dispatch as any, match.id);
      // Tam yenileme: mevcut rota korunarak yeniden yükle
      window.location.href = window.location.pathname + window.location.search;
    }
  };

  const popoverOpen = Boolean(anchorEl);
  const popoverOpenNoNotification = Boolean(anchorElNoNotification);

  // Yeni AppBar için ek state ve handler'lar
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isNavDesktop = useMediaQuery("(min-width:900px)");
  const userInitials = (userFullName || "")
    .split(" ").filter(Boolean).slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? "").join("");

  const handleMuiProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget as any);
  };

  const handleNotificationClickMui = (event: React.MouseEvent<HTMLElement>) => {
    if (waitingCount > 0) {
      navigate("/approve");
    } else {
      setAnchorElNoNotification(event.currentTarget as any);
      setShowNoNotification(true);
    }
  };

  const handleNoNotificationClick = (event: any) => {
    setAnchorElNoNotification(event.detail.targetRef);
  };

  const handleNoNotificationClose = () => {
    setAnchorElNoNotification(null);
  };

  const handleDeleteCloseModal = () => {
    setnewPw("");
    setnewPwConfirm("");
    setisDeleteModalOpen(false);
  };

  const handleChangePassword = () => {
    setisDeleteModalOpen(true);
  };

  async function getApproveDetail(userId: any) {
    var conf = getConfiguration();
    let api = new ApproveItemsApi(conf);
    var result = await api.apiApproveItemsGetPendingCountGetPendingCountGet();
    setwaitingCount(result.data);
  }

  const handleNotificationClick = (event: any) => {
    if (waitingCount > 0) {
      navigate("/approve");
    } else {
      setAnchorElNoNotification(event.detail.targetRef);
      setShowNoNotification(true);
    }
  };

  //sifre sifirlama
  const validatePassword = (password: string): string => {
    if (password.length < 6) {
      return "Parola en az 6 karakter uzunluğunda olmalıdır";
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return "Parola en az bir özel karakter içermelidir";
    }
    if (!/\d/.test(password)) {
      return "Parola en az bir rakam içermelidir";
    }
    if (!/[A-Z]/.test(password)) {
      return "Parola en az bir büyük harf (A-Z) içermelidir";
    }
    return "";
  };

  const handlePasswordChange = (pw: string) => {
    const newPass = pw;
    setnewPw(newPass);

    const validationError = validatePassword(newPass);
    if (validationError) {
      setPasswordError(validationError);
    } else {
      setPasswordError("");
    }
  };

  const handleConfirmPasswordChange = (pw: string) => {
    const confirmPass = pw;
    setnewPwConfirm(confirmPass);

    const validationError = validatePassword(confirmPass);
    if (validationError) {
      setPasswordError(validationError);
      setPswTrue(true);
    } else if (newPw && confirmPass !== newPw) {
      setPasswordError("Şifreler eşleşmiyor..!");
      setPswTrue(true);
    } else {
      setPasswordError("");
      setPswTrue(false);
    }
  };
  const changePassword = async () => {
    try {
      dispatchBusy({ isBusy: true });
      if (validatePassword(newPw) || validatePassword(newPwConfirm) || newPw !== newPwConfirm) {
        dispatchAlert({
          message: "Şifre geçerli değil. Lütfen kontrol edin.",
          type: MessageBoxType.Error,
        });
        return;
      }

      var conf = getConfiguration();
      var api = new UserApi(conf);
      var result = await api.apiUserResetPassWordGet(loginMail, newPw);

      dispatchAlert({ message: "Şifre başarıyla güncellendi", type: MessageBoxType.Success });
      dispatchBusy({ isBusy: false });
      handleDeleteCloseModal();
    } catch (error) {
      dispatchAlert({ message: `Hata: ${error}`, type: MessageBoxType.Error });
      handleDeleteCloseModal();
    } finally {
      dispatchBusy({ isBusy: false });
      handleDeleteCloseModal();
    }
  };
  const passwordRequirements = [
    "Parola en az 6 karakter uzunluğunda olmalıdır",
    "Parola en az bir özel karakter içermelidir",
    "Parola en az bir rakam içermelidir",
    "Parola en az bir büyük harf (A-Z) içermelidir",
  ];
  const renderPasswordRequirements = passwordRequirements.map((item, key) => {
    const itemKey = `element-${key}`;

    return (
      <MDBox key={itemKey} component="li" color={themes[theme].menu.color} fontSize="8px" lineHeight={1}>
        <MDTypography variant="button" color={themes[theme].menu.color} fontWeight="regular">
          {item}
        </MDTypography>
      </MDBox>
    );
  });

  const deleteModal = () => {
    return (
      <DashboardLayout>
        <Modal open={isDeleteModalOpen} onClose={handleDeleteCloseModal}>
          <MDBox>
            <MDBox
              sx={style}
              // backgroundColor: theme == "light" ? themes[theme].menu.menuContent : themes[theme].menu.menuContent,
              style={{ height: "400px", backgroundColor: theme == "light" ? themes[theme].menu.menuContent : themes[theme].menu.menuContent }}
              textAlign="center"
              borderRadius="16px"
            >
              <MDBox
                variant="gradient"
                style={{
                  backgroundColor: "#1383ce",
                  position: "absolute",
                  top: "20%",
                  left: "49.2%",
                  transform: "translate(-50%, -50%)",
                  width: 440,
                  height: 50,
                  borderRadius: "20px",
                }}
                sx={style}
                borderRadius="lg"
                zIndex={2}
                coloredShadow="dark"
                mx={2}
                mt={-4}
                p={3}
                mb={1}
                textAlign="center"
              >
                <MDBox mb={-2} />
                <MDTypography variant="h4" fontWeight="medium" color="white">
                  Şifre Değiştirme Ekranı
                </MDTypography>
                <MDBox mb={-1} />
              </MDBox>

              <MDBox mt={8} mb={-1}>
                <MDBox mx={2} mb={4} lineHeight={0} display="flex" flexDirection="column" gap={2}>
                  {/* <MDBox>
                    <MDInput value={currentPw} label="Mevcut Şifre" fullWidth />
                  </MDBox> */}
                  <MDBox>
                    <MDInput
                      sx={{ input: { color: themes[theme].menu.color } }}
                      value={newPw}
                      label="Yeni Şifre"
                      fullWidth
                      error={!!passwordError}
                      onChange={(e: any) => handlePasswordChange(e.target.value)}
                    />
                  </MDBox>
                  <MDBox>
                    <MDInput
                      sx={{ input: { color: themes[theme].menu.color } }}
                      value={newPwConfirm}
                      label="Yeni Şifre Tekrar"
                      fullWidth
                      error={!!passwordError}
                      onChange={(e: any) => handleConfirmPasswordChange(e.target.value)}
                    />
                  </MDBox>
                  <MDBox component="ul" m={0} pl={3.25} mb={{ xs: 8, sm: 0 }}>
                    {renderPasswordRequirements}
                  </MDBox>
                </MDBox>
                <MDBox display="flex" alignItems="end" justifyContent="end" mx={2}>
                  <MDButton onClick={handleDeleteCloseModal} variant="contained" color="error">
                    İptal
                  </MDButton>

                  <MDButton
                    disabled={pswTrue}
                    onClick={changePassword}
                    variant="contained"
                    color="success"
                    style={{ marginLeft: "10px" }}
                  >
                    Evet
                  </MDButton>
                </MDBox>
              </MDBox>
            </MDBox>
          </MDBox>
        </Modal>
      </DashboardLayout>
    );
  };

  return (
  <>
    {/* ══════ FORMNEO APPBAR ══════ */}
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #e2e8f0",
        color: "#0f172a",
        zIndex: 1100,
      }}
    >
      <Toolbar sx={{ px: { xs: 2, md: 3 }, gap: 1, minHeight: { xs: 60, sm: 64 } }}>
        {/* Hamburger — sadece mobil */}
        {!isNavDesktop && (
          <IconButton edge="start" onClick={() => setMobileMenuOpen(true)} sx={{ color: "#0f172a", mr: 0.5 }}>
            <NavMenuIcon />
          </IconButton>
        )}

        {/* Logo */}
        <Box
          component="img"
          src={formneoLogo}
          alt="Formneo"
          onClick={() => navigate("/dashboards/analytics")}
          sx={{ height: 34, maxWidth: 130, objectFit: "contain", mr: { md: 3 }, cursor: "pointer", flexShrink: 0 }}
        />

        {/* Masaüstü — DB'den gelen root menüler */}
        {isNavDesktop && (
          <Box sx={{ display: "flex", gap: 0.5, flexGrow: 1, overflow: "hidden" }}>
            {(rootMenus as any[])
              .filter((m: any) => !m.parentMenuId || String(m.parentMenuId).trim() === "")
              .filter((m: any) => m.isActive ?? true)
              .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
              .map((m: any) => {
                const href =
                  (m.href && String(m.href).trim()) ||
                  (m.route && String(m.route).trim()) ||
                  "/menu/" + (m.id || m.menuCode);
                const isHub = href.startsWith("/menu/");
                const active =
                  !isHub &&
                  href !== "#" &&
                  (currentPath === href || currentPath.startsWith(href + "/"));
                return (
                  <Button
                    key={String(m.id || m.menuCode)}
                    onClick={(e) => {
                      if (isHub) {
                        setMenuDropdownAnchor(e.currentTarget);
                        setMenuDropdownMenuId(String(m.id || m.menuCode));
                      } else if (href !== "#") {
                        navigate(href);
                      }
                    }}
                    sx={{
                      px: 1.5,
                      py: 0.75,
                      borderRadius: 2,
                      color: active ? "#4f46e5" : "#64748b",
                      bgcolor: active ? "rgba(79,70,229,0.08)" : "transparent",
                      fontWeight: active ? 700 : 500,
                      fontSize: "0.82rem",
                      whiteSpace: "nowrap",
                      minWidth: "auto",
                      textTransform: "none",
                      "&:hover": { bgcolor: "rgba(79,70,229,0.06)", color: "#4f46e5" },
                    }}
                  >
                    <Box component="span" sx={{ display: "flex", alignItems: "center", mr: 0.5 }}>
                      {renderNavMenuIcon(m.icon, active ? "#4f46e5" : "#64748b", 16)}
                    </Box>
                    {m.name}
                    {isHub && <Icon sx={{ fontSize: 16, ml: -0.25 }}>expand_more</Icon>}
                  </Button>
                );
              })}
          </Box>
        )}

        <Box sx={{ flexGrow: isNavDesktop ? 0 : 1 }} />

        {/* Bildirim zili */}
        <Tooltip title="Bildirimler">
          <IconButton onClick={handleNotificationClickMui} sx={{ color: "#64748b" }}>
            <Badge badgeContent={waitingCount || 0} color="error" max={99}>
              <NavNotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* Profil */}
        <Box
          onClick={handleMuiProfileClick}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            pl: 1.5,
            ml: 0.5,
            borderLeft: "1px solid #e2e8f0",
            cursor: "pointer",
            "&:hover": { opacity: 0.8 },
          }}
        >
          <MuiAvatar
            sx={{ width: 36, height: 36, background: "linear-gradient(135deg, #4f46e5, #7c3aed)", fontSize: "0.78rem", fontWeight: 700 }}
          >
            {photoSrc ? (
              <img src={photoSrc} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              userInitials || "U"
            )}
          </MuiAvatar>
          {isNavDesktop && (
            <Box>
              <Typography
                variant="caption"
                component="div"
                sx={{ fontWeight: 700, color: "#0f172a", lineHeight: 1.4, whiteSpace: "nowrap" }}
              >
                {userFullName || "Kullanici"}
              </Typography>
              <Typography
                variant="caption"
                component="div"
                sx={{ color: "#64748b", fontSize: "0.68rem", lineHeight: 1.4 }}
              >
                {selectedTenant?.label || "Formneo"}
              </Typography>
            </Box>
          )}
          <NavArrowDownIcon sx={{ fontSize: 18, color: "#64748b" }} />
        </Box>
      </Toolbar>
    </AppBar>

    {/* Mobil Drawer */}
    <Drawer
      anchor="left"
      open={mobileMenuOpen}
      onClose={() => setMobileMenuOpen(false)}
      PaperProps={{ sx: { width: 265, pt: 2, bgcolor: "#fff" } }}
    >
      <Box sx={{ px: 2, mb: 2 }}>
        <Box
          component="img"
          src={formneoLogo}
          alt="Formneo"
          sx={{ height: 32, maxWidth: 130, objectFit: "contain" }}
        />
      </Box>
      <Divider sx={{ mb: 1 }} />
      <List sx={{ px: 1 }}>
        {(rootMenus as any[])
          .filter((m: any) => !m.parentMenuId || String(m.parentMenuId).trim() === "")
          .filter((m: any) => m.isActive ?? true)
          .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
          .map((m: any) => {
            const href =
              (m.href && String(m.href).trim()) ||
              (m.route && String(m.route).trim()) ||
              "/menu/" + (m.id || m.menuCode);
            const active = currentPath === href || currentPath.startsWith(href + "/");
            return (
              <ListItemButton
                key={String(m.id || m.menuCode)}
                selected={active}
                onClick={() => {
                  navigate(href);
                  setMobileMenuOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  "&.Mui-selected": { bgcolor: "rgba(79,70,229,0.1)", color: "#4f46e5" },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {renderNavMenuIcon(m.icon, active ? "#4f46e5" : "#64748b", 18)}
                </ListItemIcon>
                <ListItemText
                  primary={m.name}
                  primaryTypographyProps={{ fontSize: "0.875rem", fontWeight: active ? 700 : 500 }}
                />
              </ListItemButton>
            );
          })}
      </List>
    </Drawer>


      {/* Navbar alt menü dropdown (gerçek uygulamalardaki gibi) */}
      <Menu
        anchorEl={menuDropdownAnchor}
        open={Boolean(menuDropdownAnchor)}
        onClose={() => {
          setMenuDropdownAnchor(null);
          setMenuDropdownMenuId(null);
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{
          sx: {
            minWidth: 280,
            maxHeight: 400,
            mt: 1.5,
            borderRadius: 2,
            boxShadow: darkMode ? "0 8px 32px rgba(0,0,0,0.4)" : "0 8px 24px rgba(0,0,0,0.12)",
            bgcolor: darkMode ? "#1e293b" : "#ffffff",
            border: darkMode ? "1px solid #334155" : "1px solid #e2e8f0",
            "& .MuiList-root": { py: 0.5 },
          },
        }}
      >
        {menuDropdownLoading ? (
          <MenuItem disabled sx={{ justifyContent: "center", py: 3, color: darkMode ? "#94a3b8" : "#64748b" }}>
            Yükleniyor…
          </MenuItem>
        ) : (
          <>
            {menuDropdownSubs.map((sub: any) => {
              const subHref = (sub.href && String(sub.href).trim()) || (sub.route && String(sub.route).trim()) || "#";
              const canGo = subHref !== "#";
              return (
                <MenuItem
                  key={String(sub.id || sub.menuCode)}
                  onClick={() => {
                    if (canGo) {
                      navigate(subHref);
                      setMenuDropdownAnchor(null);
                      setMenuDropdownMenuId(null);
                    }
                  }}
                  sx={{
                    py: 1.25,
                    px: 2,
                    gap: 1.5,
                    color: darkMode ? "#e2e8f0" : "#0f172a",
                    "&:hover": { bgcolor: darkMode ? "rgba(56,189,248,0.12)" : "rgba(2,132,199,0.08)" },
                  }}
                  disabled={!canGo}
                >
                  <MDBox sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 1, bgcolor: darkMode ? "rgba(56,189,248,0.15)" : "rgba(2,132,199,0.1)" }}>
                    {renderNavMenuIcon(sub.icon, darkMode ? "#38bdf8" : "#0284c7", 18)}
                  </MDBox>
                  <MDBox sx={{ flex: 1, minWidth: 0 }}>
                    <MDTypography variant="body2" fontWeight={500}>
                      {sub.name}
                    </MDTypography>
                    {sub.description && (
                      <MDTypography variant="caption" sx={{ color: darkMode ? "#94a3b8" : "#64748b", display: "block" }}>
                        {sub.description}
                      </MDTypography>
                    )}
                  </MDBox>
                </MenuItem>
              );
            })}
            {menuDropdownMenuId && (
              <>
                <Divider sx={{ my: 0.5 }} />
                <MenuItem
                  onClick={() => {
                    navigate(`/menu/${menuDropdownMenuId}`);
                    setMenuDropdownAnchor(null);
                    setMenuDropdownMenuId(null);
                  }}
                  sx={{
                    py: 1,
                    px: 2,
                    color: darkMode ? "#38bdf8" : "#0284c7",
                    fontWeight: 600,
                    "&:hover": { bgcolor: darkMode ? "rgba(56,189,248,0.12)" : "rgba(2,132,199,0.08)" },
                  }}
                >
                  <Icon sx={{ fontSize: 20, mr: 1 }}>apps</Icon>
                  Tümünü gör
                </MenuItem>
              </>
            )}
          </>
        )}
      </Menu>

      <Popover
        open={popoverOpen}
        onClose={handlePopoverClose}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{
          "& .MuiPopover-paper": {
            background: "white",
            minWidth: "220px",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          },
        }}
      >
        <MDBox mt={1} mb={1} mx={2} display="flex" justifyContent="center" flexDirection="column">
          {/* Kullanıcı — Şirket bilgisi */}
          <MDBox mb={1}>
            <MDTypography variant="button" sx={{ fontWeight: 600, color: darkMode ? "#e2e8f0" : "#0f172a" }}>

            </MDTypography>
            <MDTypography variant="caption" sx={{ display: "block", color: darkMode ? "#94a3b8" : "#64748b" }}>
              {selectedTenant?.label || (isGlobalMode ? "Global Mod" : "")}
            </MDTypography>
          </MDBox>
          <Divider sx={{ my: 1, opacity: 0.5 }} />
          <MDButton
            variant="contained"
            fullWidth
            onClick={() => navigate("/profile/profile-overview")}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontSize: "14px",
              padding: "8px 16px",
              marginBottom: "10px",

              "&:hover": {
                transform: "scale(1.05)",
              },
            }}
          >
            Profilim
          </MDButton>
          <MDButton
            variant="contained"
            fullWidth
            onClick={() => navigate("/tickets")}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontSize: "14px",
              padding: "8px 16px",
              marginBottom: "10px",

              "&:hover": {
                transform: "scale(1.05)",
              },
            }}
          >
            Talep Yönetimi
          </MDButton>
          <MDButton
            variant="contained"
            fullWidth
            onClick={() => navigate("/solveAllTicket")}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontSize: "14px",
              padding: "8px 16px",
              marginBottom: "10px",

              "&:hover": {
                transform: "scale(1.05)",
              },
            }}
          >
            Talep Çözümleme
          </MDButton>
          <MDButton
            variant="contained"
            fullWidth
            onClick={() => navigate("/profile/all-projects")}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontSize: "14px",
              padding: "8px 16px",
              marginBottom: "10px",

              "&:hover": {
                transform: "scale(1.05)",
              },
            }}
          >
            Projelerim
          </MDButton>
          <MDButton
            variant="contained"
            onClick={handleChangePassword}
            fullWidth
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontSize: "14px",
              padding: "8px 16px",

              "&:hover": {
                transform: "scale(1.05)",
              },
            }}
          >
            Şifre Değiştir
          </MDButton>
          {/* Global Admin veya Tenant mod geçiş butonları shellbardan kaldırıldı */}
          <MDButton
            variant="contained"
            fullWidth
            onClick={() => navigate("/logout")}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontSize: "14px",
              padding: "8px 16px",
              color: "red",
              "&:hover": {
                color: "red",
                transform: "scale(1.05)",
              },
            }}
          >
            Çıkış Yap
          </MDButton>
        </MDBox>
      </Popover>
      {deleteModal()}

      {showNoNotification && (
        <Popover
          open={showNoNotification}
          onClose={() => setShowNoNotification(false)}
          anchorEl={anchorElNoNotification}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
          sx={{
            "& .MuiPopover-paper": {
              background: darkMode ? "#1a2035" : "white",
              minWidth: "200px",
              borderRadius: "10px",
              boxShadow: "0 8px 16px 0 rgba(0,0,0,0.2)",
            },
          }}
        >
          <MDTypography
            variant="h6"
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontSize: "14px",
              padding: "8px 16px",
              color: darkMode ? "#fff" : "#344767",
            }}
          >
            Bildiriminiz Bulunmamaktadır
          </MDTypography>
        </Popover>
      )}
  </>
  );
}

// Declaring default props for DashboardNavbar
DashboardNavbar.defaultProps = {
  absolute: false,
  light: false,
  isMini: false,
};

export default DashboardNavbar;
