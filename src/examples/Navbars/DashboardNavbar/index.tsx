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
  Modal,
  Paper,
  Popover,
  ListSubheader,
  ListItemButton,
  Divider,
} from "@mui/material";
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
  const navigate = useNavigate();

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

  useEffect(() => {
    const isSpecialRoute = currentPath.startsWith("/authentication") || currentPath.startsWith("/NotAuthorization");
    if (isSpecialRoute) return;


    // Tenant options for ShellBar search field
    (async () => {
      try {
        if (isSpecialRoute) return;
        const conf = getConfiguration();
        const userApi = new UserApi(conf);
        const user = await userApi.apiUserGetLoginUserDetailGet();
        const userId = String((user as any)?.data?.id || (user as any)?.data?.userId || "");
        if (!userId) {
          setTenants([]);
          setSelectedTenant(null);
          localStorage.removeItem("selectedTenantId");
          localStorage.removeItem("selectedTenantLabel");
          setSelectedTenantId(dispatch as any, null as any);
          return;
        }
        const utApi = new UserTenantsApi(conf);
        const res = await utApi.apiUserTenantsByUserUserIdGet(userId);
        const upayload: any = (res as any)?.data;
        const ulist: any[] = Array.isArray(upayload)
          ? upayload
          : Array.isArray(upayload?.items)
            ? upayload.items
            : Array.isArray(upayload?.data)
              ? upayload.data
              : Array.isArray(upayload?.result)
                ? upayload.result
                : [];
        // Ağır tüm-şirket çekimi kaldırıldı; kullanıcı-tenant kaydındaki adları kullan

        const opts = Array.from(
          new Map(
            (ulist || []).map((r: any) => {
              const id = String(r.tenantId || r.id || r.clientId || r.uid || "");
              const label = r.tenantName || r.name || r.clientName || r.title || "-";
              return [id, { id, label, name: label }];
            })
          ).values()
        );
        setTenants(opts);
        const savedTenantId = localStorage.getItem("selectedTenantId");
        if (savedTenantId && opts.some((o) => o.id === savedTenantId)) {
          const match = opts.find((o) => o.id === savedTenantId) || null;
          setSelectedTenant(match);
          setSelectedTenantId(dispatch as any, savedTenantId);
          if (match?.label) localStorage.setItem("selectedTenantLabel", match.label);
        } else if (savedTenantId) {
          // Kayit yoksa id'ye göre şirket adını çekip placeholder ekle
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
        } else {
          // Hiç tenant yoksa global mod
          setSelectedTenant(null);
          localStorage.removeItem("selectedTenantId");
          localStorage.removeItem("selectedTenantLabel");
          setSelectedTenantId(dispatch as any, null as any);
        }
      } catch (e) {
        setTenants([]);
      }
    })();
  }, []);

  // ✅ Ana menüleri cache'lenmiş hook'tan al (tekrar çağrı yapmaz)
  const { data: rootMenus = [] } = useRootMenus();

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
    <div style={{ position: "sticky", top: 0, zIndex: 1000, width: "100%" }}>
      {/* Full-bleed wrapper: ShellBar sol/sağ kenara tam yapışır */}
      <MDBox
        sx={{
          position: "relative",
          left: "50%",
          right: "50%",
          marginLeft: "-50vw",
          marginRight: "-50vw",
          width: "100vw",
        }}
      >
        {/* Büyük logo - ShellBar dışında, sola yapışık ve dikey ortalı */}
        <MDBox
          sx={{
            position: "absolute",
            left: 24,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            alignItems: "center",
            zIndex: 2,
            cursor: "pointer",
          }}
          onClick={() => navigate("/dashboards/analytics")}
        >
          <MDBox
            component="img"
            src={logoSon}
            alt="FormNeo"
            loading="lazy"
            sx={{
              height: { xs: 64, sm: 80, md: 92, lg: 104, xl: 112 },
              width: "auto",
              display: "block",
              objectFit: "contain",
              filter: "none",
              imageRendering: "-webkit-optimize-contrast",
            }}
          />
        </MDBox>
        {/* Şirket etiketi: sağda, profile yakın (mobilde gizle) */}
        {selectedTenant?.label && (
          <MDBox
            sx={{
              position: "absolute",
              right: 280,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 2,
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              maxWidth: "30vw",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: darkMode ? '#0f172a' : '#0f172a',
                backgroundColor: darkMode ? '#e2e8f0' : '#e2e8f0',
                border: `1px solid ${darkMode ? '#cbd5e1' : '#cbd5e1'}`,
                padding: '4px 10px',
                borderRadius: 9999,
                lineHeight: 1.1,
              }}
              title={selectedTenant?.label || ''}
            >
              {(selectedTenant?.label || '').toString()}{isGlobalMode ? ' · Global' : ''}
            </span>
          </MDBox>
        )}
        <ShellBar
          // backgroundColor: theme == "light" ? themes[theme].menu.menuContent : themes[theme].menu.menuContent
          style={{
            paddingLeft: 240,
            paddingRight: 12,
            minHeight: 52,
            ...(isGlobalMode
              ? {
                background: darkMode ? "#2b3445" : "#fff8e1",
                borderBottom: darkMode ? "2px solid #f59e0b" : "2px solid #f59e0b",
              }
              : {}),
          }}
          // menuItems={<><ListItemStandard data-key="1">Menu Item 1</ListItemStandard><ListItemStandard data-key="2">Menu Item 2</ListItemStandard><ListItemStandard data-key="3">Menu Item 3</ListItemStandard></>}
          notificationsCount={waitingCount.toString()}
          onLogoClick={() => navigate("/dashboards/analytics")}
          onMenuItemClick={function Ki() { }}
          onNotificationsClick={handleNotificationClick}
          onProductSwitchClick={function Ki() { }}
          onProfileClick={handleProfileClick}
          onSearchButtonClick={function Ki() { }}
          primaryTitle=""
          placeholder="Search"
          profile={
            <Avatar>
              {photoSrc ? (
                <img
                  src={photoSrc}
                  alt="Profile"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  loading="lazy"
                />
              ) : (
                <img
                  src={profile}
                  alt="Default Avatar"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  loading="lazy"
                />
              )}
            </Avatar>
          }
          // searchField={
          //   <div>
          //     <InputBase
          //       sx={{
          //         border: darkMode ? "1px solid #ffffff40" : "1px solid #e0e0e0",
          //         borderRadius: "5px",
          //         fontSize: "16px",
          //         width: "400px",
          //         padding: "1px 12px",
          //         color: darkMode ? "#fff" : "#344767",
          //         "& input::placeholder": {
          //           color: darkMode ? "#ffffff80" : "#66666f",
          //           opacity: 1,
          //         },
          //         "&:hover": {
          //           border: darkMode ? "1px solid #ffffff80" : "1px solid #1383ce",
          //         },
          //         "&.Mui-focused": {
          //           border: "1px solid #1383ce",
          //           boxShadow: "0 0 0 2px rgba(19, 131, 206, 0.2)",
          //         },
          //         transition: "all 0.2s ease-in-out",
          //       }}
          //       placeholder="Arama"
          //       autoComplete="on"
          //       onKeyDown={(e: React.KeyboardEvent) => {
          //         if (e.key === "Enter" && filteredMenuData?.length > 0) {
          //           const searchValue = (e.target as HTMLInputElement).value.toLowerCase();
          //           const exactMatch = filteredMenuData.find(
          //             (item: any) => item.menuCode.toLowerCase() === searchValue
          //           );
          //           if (exactMatch?.href) {
          //             navigate(exactMatch.href);
          //             setFilteredMenuData([]);
          //           }
          //         }
          //       }}
          //       onChange={(e: any) => {
          //         if (e.target.value === "") {
          //           setFilteredMenuData([]);
          //         } else {
          //           const searchValue = e.target.value.toLowerCase();
          //           const filteredData = menuData?.filter(
          //             (item: any) =>
          //               item.name.toLowerCase().includes(searchValue) ||
          //               item.menuCode?.toLowerCase().includes(searchValue)
          //           );
          //           setFilteredMenuData(filteredData || []);
          //         }
          //       }}
          //     />
          //     {filteredMenuData?.length > 0 && (
          //       <Paper
          //         style={{
          //           position: "absolute",
          //           zIndex: 1,
          //           width: "400px",
          //           maxHeight: "auto",
          //           overflowY: "auto",
          //         }}
          //       >
          //         <List
          //           subheader={
          //             <ListSubheader
          //               component="div"
          //               id="nested-list-subheader"
          //               sx={{
          //                 fontSize: "16px",
          //                 fontWeight: "bold",
          //                 color: darkMode ? "#fff" : "#344767",
          //               }}
          //             >
          //               Uygulamalar
          //             </ListSubheader>
          //           }
          //         >
          //           {filteredMenuData.map((item: any, index: any) =>
          //             item.href && item.href.trim() !== "" ? (
          //               <ListItem key={index}>
          //                 <ListItemButton
          //                   onClick={() => {
          //                     navigate(item.href);
          //                     setFilteredMenuData([]);
          //                   }}
          //                   tabIndex={0}
          //                 >
          //                   <ListItemText
          //                     primary={`${item.name} - ${item.menuCode || ""}`}
          //                     sx={{
          //                       "& .MuiListItemText-primary": {
          //                         fontSize: "14px",
          //                         color: darkMode ? "#fff" : "#344767",
          //                         "&:hover": {
          //                           color: "#1383ce",
          //                         },
          //                       },
          //                     }}
          //                   />
          //                 </ListItemButton>
          //               </ListItem>
          //             ) : null
          //           )}
          //         </List>
          //       </Paper>
          //     )}
          //   </div>
          // }
          showNotifications
          showProductSwitch
          searchField={
            <div style={{ minWidth: 260 }}>
              <MDButton variant="outlined" color="info" size="small" onClick={() => navigate('/authentication/tenant-select')}>
                Şirket Değiştir
              </MDButton>
            </div>
          }
        >
          {selectedTenant?.label && (
            <ShellBarItem
              text={`Şirket: ${selectedTenant.label}`}
              icon="building"
              onClick={() => { }}
            />
          )}
        </ShellBar>
      </MDBox>

      {/* ShellBar altı: dinamik üst menüler (SideNav ile aynı kaynak) */}
      {(() => {
        const menus: any[] = Array.isArray(menuData) ? menuData : [];
        if (!menus.length) return null;

        // Kök: bir üst menüsü (parentMenuId) olmayanlar
        const rawRoots = menus.filter((m: any) => !m.parentMenuId || String(m.parentMenuId).trim() === "");
        const roots = rawRoots
          .filter((m: any) => (m.isActive ?? true))
          .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

        const resolveHref = (m: any): string => {
          // Kural: Kök menüler (parentMenuId yok/boş) daima hub'a gider
          if (!m.parentMenuId || String(m.parentMenuId).trim() === "") {
            return `/menu/${m.id || m.menuCode}`;
          }
          // Alt menüsü olan ara düğümler de hub'a gidebilir
          if (Array.isArray(m.subMenus) && m.subMenus.length > 0) {
            return `/menu/${m.id || m.menuCode}`;
          }
          const h = (m.href && String(m.href).trim()) || (m.route && String(m.route).trim());
          return h || "#";
        };
        const isActiveTab = (href: string) => href !== "#" && (currentPath === href || currentPath.startsWith(href + "/"));

        return (
          <MDBox
            sx={{
              position: "relative",
              left: "50%",
              right: "50%",
              marginLeft: "-50vw",
              marginRight: "-50vw",
              width: "100vw",
              backgroundColor: darkMode ? "#1a2035" : "#ffffff",
              borderBottom: darkMode ? "1px solid #2d3748" : "1px solid #e5e7eb",
              zIndex: 3,
              pointerEvents: "auto",
            }}
          >
            <MDBox
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                height: 40,
                px: 1.5,
                overflowX: "auto",
                whiteSpace: "nowrap",
                "&::-webkit-scrollbar": { height: 6 },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: darkMode ? "#334155" : "#cbd5e1",
                  borderRadius: 8,
                },
              }}
            >
              {roots.map((m: any) => {
                const href = resolveHref(m);
                const active = isActiveTab(href);
                return (
                  <MDBox
                    key={String(m.id || m.menuCode || m.name)}
                    onClick={(e: any) => { e.preventDefault(); e.stopPropagation(); if (href !== "#") navigate(href); }}
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      px: 1.5,
                      height: 40,
                      cursor: href === "#" ? "default" : "pointer",
                      borderBottom: active
                        ? `2px solid ${darkMode ? "#38bdf8" : "#0284c7"}`
                        : "2px solid transparent",
                      color: active
                        ? darkMode
                          ? "#7dd3fc"
                          : "#0369a1"
                        : darkMode
                          ? "#cbd5e1"
                          : "#475569",
                      fontWeight: active ? 600 : 500,
                      fontSize: 14,
                      transition: "color .15s ease, transform .15s ease",
                      '&:hover': {
                        color: active ? undefined : (darkMode ? '#e2e8f0' : '#0f172a'),
                        transform: active || href === "#" ? undefined : 'translateY(-1px)'
                      }
                    }}
                  >
                    {m.name}
                  </MDBox>
                );
              })}
            </MDBox>
          </MDBox>
        );
      })()}

      <Popover
        open={popoverOpen}
        onClose={handlePopoverClose}
        anchorEl={anchorEl}
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
    </div>
  );
}

// Declaring default props for DashboardNavbar
DashboardNavbar.defaultProps = {
  absolute: false,
  light: false,
  isMini: false,
};

export default DashboardNavbar;
