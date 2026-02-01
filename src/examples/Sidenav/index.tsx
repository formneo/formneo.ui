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

import { useEffect, useState, ReactNode } from "react";

// react-router-dom components
import { useLocation, NavLink } from "react-router-dom";

// @mui material components
import Link from "@mui/material/Link";
import Icon from "@mui/material/Icon";
import {
  Box,
  IconButton,
  Tooltip,
  Avatar,
  Typography,
  Popper,
  Paper,
  Fade,
  ClickAwayListener,
  useTheme,
  alpha,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  RadioGroup,
  Radio,
  FormControlLabel,
  Grow,
  Zoom,
  Button,
  Modal,
} from "@mui/material";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";

// React Pro Sidebar components
import { Sidebar, Menu, MenuItem, SubMenu, menuClasses } from "react-pro-sidebar";
import "primeicons/primeicons.css";

// Custom styles for the Sidenav

import formneoLogo from "assets/images/formneolog.png";

// Material Dashboard 2 PRO React context
import {
  useMaterialUIController,
  setMiniSidenav,
  setTransparentSidenav,
  setWhiteSidenav,
} from "context";
import { AuthApi, MenuApi, MenuListDto } from "api/generated";
import getConfiguration, { getConfigurationAccessTokenLogin } from "confiuration";
import { useMenuAuth } from "hooks/useMenuAuth";

import SidenavRoot from "./SidenavRoot";
import { useTranslation } from "react-i18next";
import i18n from "i18n";
import MDButton from "components/MDButton";
import { menuAPIController } from "locales/controller";

interface Props {
  color?: "primary" | "secondary" | "info" | "success" | "warning" | "error" | "dark";
  brand?: string;
  brandName: string;
  routes: {
    [key: string]:
    | ReactNode
    | string
    | {
      [key: string]:
      | ReactNode
      | string
      | {
        [key: string]: ReactNode | string;
      }[];
    }[];
  }[];
  [key: string]: any;
}

type Theme = "light" | "dark";

export const themes = {
  light: {
    sidebar: {
      backgroundColor: "#ffffff",
      color: "#4A5568",
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)",
      borderRight: "1px solid #F0F2F5",
    },
    menu: {
      menuContent: "#ffffff",
      icon: "#3182CE",
      color: "#212121",
      hover: {
        backgroundColor: "#EBF8FF",
        color: "#2B6CB0",
      },
      active: {
        backgroundColor: "#E6F6FF",
        color: "#2C5282",
        borderLeft: "3px solid #3182CE",
      },
      disabled: {
        color: "#A0AEC0",
      },
    },
  },
  dark: {
    sidebar: {
      backgroundColor: "#171923",
      color: "#FFFDF6",
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.25), 0 1px 2px 0 rgba(0, 0, 0, 0.15)",
      borderRight: "1px solid #2D3748",
    },
    menu: {
      menuContent: "#171923",
      icon: "#63B3ED",
      color: "#ffffff !important",
      hover: {
        backgroundColor: "#2D3748",
        color: "#90CDF4",
      },
      active: {
        backgroundColor: "#2C3444",
        color: "#90CDF4",
        borderLeft: "3px solid #63B3ED",
      },
      disabled: {
        color: "#718096",
      },
    },
  },
};

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Ikonları PrimeIcons veya Material Icons olarak esnek biçimde render eder
const renderMenuIcon = (rawIconName: string | null | undefined, color: string): React.ReactNode => {
  const iconName = String(rawIconName || "").trim();
  if (!iconName) {
    return <Icon sx={{ color }}>menu</Icon>;
  }

  const lower = iconName.toLowerCase();
  // Prefiks ile açık seçim: mi:xyz => Material, pi:xyz => PrimeIcons
  if (lower.startsWith("mi:") || lower.startsWith("material:")) {
    const name = iconName.split(":")[1] || "";
    return <Icon sx={{ color }}>{name}</Icon>;
  }
  if (lower.startsWith("pi:") || lower.startsWith("prime:")) {
    const name = iconName.split(":")[1] || "";
    return <i className={`pi pi-${name} menu-item-icon`} style={{ color }}></i>;
  }

  // Heuristik: alt çizgi içerenler çoğu zaman Material Icons adlarıdır (ör. qr_code, shopping_basket)
  const materialLikely = iconName.includes("_") || [
    "home",
    "dashboard",
    "menu",
    "menu_open",
    "business",
    "group",
    "apps",
    "shopping_basket",
    "qr_code",
    "settings",
    "light_mode",
    "dark_mode",
    "edit",
    "translate",
    "airplay",
  ].includes(lower);

  if (materialLikely) {
    return <Icon sx={{ color }}>{iconName}</Icon>;
  }

  // Varsayılan: PrimeIcons
  return <i className={`pi pi-${iconName} menu-item-icon`} style={{ color }}></i>;
};

interface CollapsedSubmenuProps {
  item: MenuListDto;
  theme: Theme;
  navigate: (path: string) => void;
  isActive: (path: string) => boolean;
}

const hoverAnimation = {
  transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
  transform: "translateX(0)",
  "&:hover": {
    transform: "translateX(3px)",
  },
};

const typographyStyles = {
  menuLabel: {
    fontWeight: 500,
    fontSize: "0.875rem",
    letterSpacing: "0.01em",
  },
  menuItem: {
    fontWeight: 400,
    fontSize: "0.815rem",
    letterSpacing: "0.01em",
  },
};

function Sidenav({ color, brand, brandName, routes, ...rest }: Props): JSX.Element {
  const [controller, dispatch] = useMaterialUIController();
  const { miniSidenav, transparentSidenav, whiteSidenav, darkMode } = controller;
  const location = useLocation();
  const { pathname } = location;
  const [menuItems, setMenuItems] = useState<MenuListDto[]>([]);
  const [openSubMenus, setOpenSubMenus] = useState<Set<string>>(new Set());
  const [databaseName, setDatabaseName] = useState("");
  const [theme, setTheme] = useState<Theme>("light");
  const [settingsPop, setSettingsPop] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("tr");
  const { t } = useTranslation();

  useEffect(() => {
    const savedState = JSON.parse(localStorage.getItem("miniSidenavState") || "null");
    if (savedState !== null) {
      setMiniSidenav(dispatch, savedState);
    }

    const savedTheme = localStorage.getItem("themePreference");
    if (savedTheme) {
      setTheme(savedTheme as Theme);
    } else {
      if (darkMode) {
        setTheme("dark");
      }
    }
    const savedLanguage = localStorage.getItem("language");
    if (savedLanguage) {
      setSelectedLanguage(savedLanguage);
      i18n.changeLanguage(savedLanguage);
    }
  }, []);

  const handleMiniSidenav = () => {
    const newMiniState = !miniSidenav;
    setMiniSidenav(dispatch, newMiniState);
    localStorage.setItem("miniSidenavState", JSON.stringify(newMiniState));
    setOpenSubMenus(new Set());
  };

  const handleThemeToggle = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("themePreference", newTheme);
  };

  const handleSubMenuToggle = (menuId: string, isOpen: boolean) => {
    setOpenSubMenus((prev) => {
      const newSet = new Set(prev);
      if (isOpen) {
        newSet.add(menuId);
      } else {
        newSet.delete(menuId);
      }
      return newSet;
    });
  };

  const navigate = (path: string) => {
    if (path && path !== "#") {
      window.location.href = path;
    }
  };

  const isActiveRoute = (route: string) => {
    if (!route || route === "#") return false;
    return pathname === route;
  };

  // Cache'lenmiş menü yetkilerini kullan
  const { data: authData = [], isLoading: authLoading } = useMenuAuth();

  useEffect(() => {
    const fetchMenuItems = async () => {
      var conf = getConfigurationAccessTokenLogin();
      var api = new MenuApi(conf);
      var data = await api.apiMenuGet();
      
      
      // Yetkili menüleri filtrele (cache'den gelen veriyi kullan)
      if (authData && authData.length > 0) {
        
        
        // Yetkili menüleri filtrele
        const authorizedMenus = data.data.filter((menu: any) => {
          return authData.some((authMenu: any) => {
            const menuHref = menu.href || menu.route || "";
            const authHref = authMenu.href || authMenu.route || "";
            return menuHref === authHref || 
                   (menuHref.includes("/users") && authHref.includes("/users")) ||
                   (menuHref.includes("/tenants") && authHref.includes("/tenants"));
          });
        });
        
        // Parent menüleri de ekle (alt menülerin parent'ları)
        const parentIds = new Set(authorizedMenus.map((menu: any) => menu.parentMenuId).filter(Boolean));
        const parentMenus = data.data.filter((menu: any) => parentIds.has(menu.id));
        
        // Parent menüleri alt menülerle birleştir
        const allMenus = [...authorizedMenus, ...parentMenus];
        const uniqueMenus = allMenus.filter((menu, index, self) => 
          index === self.findIndex(m => m.id === menu.id)
        );
        
        
        
        
        
        
        setMenuItems(uniqueMenus);
      } else if (!authLoading) {
        // Cache henüz yüklenmediyse veya veri yoksa tüm menüleri göster
        setMenuItems(data.data);
      }
      
      findDb();
    };
    
    // Auth data yüklendiğinde veya değiştiğinde çalıştır
    if (!authLoading) {
      fetchMenuItems();
    }
  }, [authData, authLoading]);

  const findDb = async () => {
    var conf = getConfiguration();
    var api = new AuthApi(conf);
    var res = await api.apiAuthGetDatabaseNameGetDatabaseNameGet();
    setDatabaseName(res.data as any);
  };

  const handleLanguageChange = (event: React.ChangeEvent<HTMLInputElement>, value: string) => {
    i18n.changeLanguage(value);
    setSelectedLanguage(value);
    localStorage.setItem("language", value);
  };

  const handleSubmit = () => {
    //herhangi hata durumu için ek kontrol
    if (selectedLanguage !== localStorage.getItem("language")) {
      i18n.changeLanguage(selectedLanguage);
      localStorage.setItem("language", selectedLanguage);
    }
    //ayarları kapat
    setSettingsPop(false);
  };

  // Simplified CollapsedSubmenu component
  const CollapsedSubmenu: React.FC<CollapsedSubmenuProps> = ({
    item,
    theme,
    navigate,
    isActive,
  }) => {
    return (
      <Box>
        <Tooltip title={item.name} placement="right">
          <Box
            onClick={() => handleMiniSidenav()}
            sx={{
              cursor: "pointer",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "12px 0",
              borderRadius: "8px",
              margin: "4px 8px",
              transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
              "&:hover": {
                backgroundColor: themes[theme].menu.hover.backgroundColor,
                transform: "scale(1.05)",
              },
            }}
          >
            {renderMenuIcon(item.icon as any, themes[theme].menu.icon)}
          </Box>
        </Tooltip>
      </Box>
    );
  };

  // Enhanced menu item styles for react-pro-sidebar
  const menuItemStyles = {
    root: {
      fontSize: "14px",
      fontWeight: 550,
      transition: "all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)",
      marginBottom: "4px",
      color: themes[theme].menu.color,
      position: "relative" as const,
    },
    icon: {
      color: themes[theme].menu.icon,
      fontSize: "1.2rem",
      transition: "all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)",
      [`&.${menuClasses.disabled}`]: {
        color: themes[theme].menu.disabled.color,
      },
    },
    SubMenuExpandIcon: {
      color: themes[theme].sidebar.color,
      transition: "transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
      display: miniSidenav ? "none" : "block",
    },
    subMenuContent: ({ level }: any) => ({
      backgroundColor: themes[theme].menu.menuContent,
      transition: "height 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
      animationDuration: "0.3s",
      paddingLeft: level > 0 ? "12px" : undefined,
      boxShadow: level === 0 ? "inset 0 1px 2px rgba(0,0,0,0.05)" : "none",
    }),
    button: {
      padding: "10px 16px",
      borderRadius: "8px",
      transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
      marginLeft: "8px",
      marginRight: "8px",
      position: "relative" as const,
      [`&.${menuClasses.disabled}`]: {
        color: themes[theme].menu.disabled.color,
      },
      [`&.${menuClasses.active}`]: {
        backgroundColor: themes[theme].menu.active.backgroundColor,
        color: themes[theme].menu.active.color,
        fontWeight: 600,
        borderLeft: themes[theme].menu.active.borderLeft,
        "&::before": {
          content: '""',
          position: "absolute" as const,
          left: "-8px",
          top: 0,
          height: "100%",
          width: "3px",
          backgroundColor: themes[theme].menu.icon,
          borderTopRightRadius: "4px",
          borderBottomRightRadius: "4px",
          transform: "scaleY(0)",
          transition: "transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)",
        },
        "&:hover::before": {
          transform: "scaleY(1)",
        },
      },
      "&:hover": {
        backgroundColor: themes[theme].menu.hover.backgroundColor,
        color: themes[theme].menu.hover.color,
        transform: "translateX(3px)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      },
    },
    label: ({ open }: any) => ({
      fontWeight: open ? 600 : undefined,
      transition: "opacity 0.2s ease-in-out, color 0.2s ease-in-out",
      opacity: miniSidenav ? 0 : 1,
      ...typographyStyles.menuLabel,
    }),
  };

  const createExpandedMenu = (menuItems: MenuListDto[]) => {
    menuItems.map((item) => {
      if (item.subMenus && item.subMenus.length > 0) {
      }
    });
    return menuItems.map((item) => {
      if (item.subMenus && item.subMenus.length > 0) {
        const isAnyChildActive = item.subMenus.some((subItem) =>
          isActiveRoute(subItem.href || "#")
        );

        return (
          <SubMenu
            className="submenu"
            key={item.id}
            label={menuAPIController(item.name)}
            icon={renderMenuIcon(item.icon as any, themes[theme].menu.icon)}
            defaultOpen={isAnyChildActive || openSubMenus.has(item.id.toString())}
            onOpenChange={(open) => handleSubMenuToggle(item.id.toString(), open)}
          >
            {item.subMenus.map((subItem) => (
              <MenuItem
                key={subItem.id}
                style={{
                  paddingLeft: "60px",
                  fontSize: "13px",
                  ...typographyStyles.menuItem,
                }}
                active={isActiveRoute(subItem.href || "#")}
                onClick={() => navigate(subItem.href || "#")}
                icon={subItem.icon ? renderMenuIcon(subItem.icon as any, themes[theme].menu.icon) : undefined}
              >
                {menuAPIController(subItem.name)}
              </MenuItem>
            ))}
          </SubMenu>
        );
      }

      return (
        <MenuItem
          key={item.id}
          active={isActiveRoute(item.href || "#")}
          onClick={() => navigate(item.href || "#")}
          icon={renderMenuIcon(item.icon as any, themes[theme].menu.icon)}
        >
          {item.name}
        </MenuItem>
      );
    });
  };

  const createCollapsedMenu = (menuItems: MenuListDto[]) => {
    return menuItems.map((item) => {
      if (item.subMenus && item.subMenus.length > 0) {
        return (
          <CollapsedSubmenu
            key={item.id}
            item={item}
            theme={theme}
            navigate={navigate}
            isActive={isActiveRoute}
          />
        );
      }

      return (
        <Tooltip title={item.name} placement="right" key={item.id}>
          <Box
            onClick={() => navigate(item.href || "#")}
            sx={{
              cursor: "pointer",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "12px 0",
              borderRadius: "8px",
              margin: "4px 8px",
              backgroundColor: isActiveRoute(item.href || "#")
                ? themes[theme].menu.active.backgroundColor
                : "transparent",
              transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
              "&:hover": {
                backgroundColor: themes[theme].menu.hover.backgroundColor,
                transform: "scale(1.05)",
              },
            }}
          >
            {renderMenuIcon(item.icon as any, themes[theme].menu.icon)}
          </Box>
        </Tooltip>
      );
    });
  };

  return (
    <SidenavRoot
      {...rest}
      sx={{
        "@media (max-width: 1200px)": {
          display: "none",
        },
        width: miniSidenav ? "80px" : "260px",
        transition: "width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
        boxShadow: themes[theme].sidebar.boxShadow,
        borderRight: themes[theme].sidebar.borderRight,
      }}
      variant="permanent"
      ownerState={{ transparentSidenav, whiteSidenav, miniSidenav, darkMode }}
    >
      <Sidebar
        collapsed={miniSidenav}
        backgroundColor={themes[theme].sidebar.backgroundColor}
        style={{
          borderRight: "none",
          height: "100%",
          overflow: "hidden",
        }}
        width="260px"
        collapsedWidth="80px"
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            backgroundColor: themes[theme].sidebar.backgroundColor,
          }}
        >
          {/* Header with logo */}
          <Box
            sx={{
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: miniSidenav ? "center" : "space-between",
              borderBottom: `1px solid ${hexToRgba(themes[theme].sidebar.color, 0.1)}`,
            }}
          >
            {!miniSidenav ? (
              <Box sx={{ height: 28, maxWidth: 160, display: "flex", alignItems: "center" }}>
                <img
                  src={formneoLogo}
                  alt="FormNeo"
                  style={{ height: "100%", width: "auto", display: "block", objectFit: "contain" }}
                  loading="lazy"
                />
              </Box>
            ) : (
              <Box sx={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img
                  src={formneoLogo}
                  alt="FormNeo"
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  loading="lazy"
                />
              </Box>
            )}
          </Box>

          {/* Main menu area */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              msOverflowStyle: "none",
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": {
                display: "none",
              },
              padding: "20px 0",
            }}
          >
            {miniSidenav && (
              <Box sx={{ mb: 2, display: "flex", justifyContent: "center" }}>
                <Tooltip title={miniSidenav ? t("ns1:Genislet") : t("ns1:Daralt")}>
                  <IconButton
                    onClick={handleMiniSidenav}
                    size="small"
                    sx={{
                      color: themes[theme].menu.icon,
                      backgroundColor: hexToRgba(themes[theme].menu.hover.backgroundColor, 0.8),
                      borderRadius: "8px",
                      padding: "8px",
                      transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                      "&:hover": {
                        backgroundColor: themes[theme].menu.hover.backgroundColor,
                        transform: "rotate(180deg)",
                      },
                    }}
                  >
                    <Icon sx={{ fontSize: "20px" }}>{miniSidenav ? "menu" : "menu_open"}</Icon>
                  </IconButton>
                </Tooltip>
              </Box>
            )}

            {/* Menu content */}
            {miniSidenav ? (
              <Box sx={{ mt: 3 }}>{createCollapsedMenu(menuItems)}</Box>
            ) : (
              <Box sx={{ mt: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 3,
                    mb: 2,
                  }}
                >
                  <Typography
                    sx={{
                      color: hexToRgba(themes[theme].sidebar.color, 0.7),
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Menu
                  </Typography>
                  <Tooltip title={miniSidenav ? t("ns1:Genislet") : t("ns1:Daralt")}>
                    <IconButton
                      onClick={handleMiniSidenav}
                      size="small"
                      sx={{
                        color: themes[theme].menu.icon,
                        backgroundColor: hexToRgba(themes[theme].menu.hover.backgroundColor, 0.5),
                        borderRadius: "6px",
                        padding: "4px",
                        transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                        "&:hover": {
                          backgroundColor: themes[theme].menu.hover.backgroundColor,
                        },
                      }}
                    >
                      <Icon sx={{ fontSize: "18px" }}>{miniSidenav ? "menu" : "menu_open"}</Icon>
                    </IconButton>
                  </Tooltip>
                </Box>
                <Menu menuItemStyles={menuItemStyles}>{createExpandedMenu(menuItems)}</Menu>
              </Box>
            )}
          </Box>

          {/* Footer area */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
              borderTop: `1px solid ${hexToRgba(themes[theme].sidebar.color, 0.1)}`,
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {/* Theme toggle */}
            <Box
              sx={{
                display: "flex",
                gap: "12px",
                justifyContent: "center",
                flexDirection: miniSidenav ? "column" : "row",
              }}
            >
              {/* <Tooltip title={miniSidenav ? "Expand" : "Collapse"}>
                <IconButton
                  onClick={handleMiniSidenav}
                  size="small"
                  sx={{
                    color: themes[theme].menu.icon,
                    backgroundColor: hexToRgba(themes[theme].menu.hover.backgroundColor, 0.8),
                    borderRadius: "8px",
                    padding: "8px",
                    transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                    "&:hover": {
                      backgroundColor: themes[theme].menu.hover.backgroundColor,
                      transform: "rotate(12deg)",
                    },
                  }}
                >
                  <Icon sx={{ height: "25px", width: "25px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {miniSidenav ? "menu" : "menu_open"}
                  </Icon>
                </IconButton>
              </Tooltip> */}

              <Tooltip title="Ayarlar">
                <IconButton
                  onClick={() => setSettingsPop(true)}
                  sx={{
                    color: themes[theme].menu.icon,
                    backgroundColor: hexToRgba(themes[theme].menu.hover.backgroundColor, 0.5),
                    borderRadius: "8px",
                    padding: "8px",
                    transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                    "&:hover": {
                      backgroundColor: themes[theme].menu.hover.backgroundColor,
                      transform: "rotate(12deg)",
                    },
                  }}
                >
                  <Icon>settings</Icon>
                </IconButton>
              </Tooltip>

              <Tooltip title={theme === "light" ? "Dark Mode" : "Light Mode"}>
                <IconButton
                  onClick={handleThemeToggle}
                  sx={{
                    color: themes[theme].menu.icon,
                    backgroundColor: hexToRgba(themes[theme].menu.hover.backgroundColor, 0.5),
                    borderRadius: "8px",
                    padding: "8px",
                    transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                    "&:hover": {
                      backgroundColor: themes[theme].menu.hover.backgroundColor,
                      transform: "rotate(12deg)",
                    },
                  }}
                >
                  <Icon>{theme === "light" ? "dark_mode" : "light_mode"}</Icon>
                </IconButton>
              </Tooltip>
            </Box>

            {/* Database indicator */}
            {!miniSidenav && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  color: themes[theme].sidebar.color,
                  fontSize: "12px",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  backgroundColor: hexToRgba(themes[theme].sidebar.color, 0.05),
                  transition: "all 0.3s ease",
                  width: "100%",
                }}
              >
                <Icon
                  sx={{
                    fontSize: "16px",
                    color: themes[theme].menu.icon,
                  }}
                >
                  airplay
                </Icon>
                <Typography
                  sx={{
                    fontSize: "12px",
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={databaseName}
                >
                  {databaseName || "Database"}
                </Typography>
              </Box>
            )}

            {miniSidenav && (
              <Tooltip title={databaseName}>
                <IconButton
                  sx={{
                    color: themes[theme].menu.icon,
                    backgroundColor: hexToRgba(themes[theme].menu.hover.backgroundColor, 0.5),
                    borderRadius: "8px",
                    padding: "8px",
                    transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                  }}
                >
                  <Icon>airplay</Icon>
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Sidebar>
      {/* Settings Modal */}
      <Modal
        open={settingsPop}
        onClose={() => setSettingsPop(false)}
        closeAfterTransition
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          "&:focus": {
            outline: "none",
          },
          "& .MuiBackdrop-root": {
            backdropFilter: "blur(10px)",
            backgroundColor: theme === "dark" ? "rgba(0, 0, 0, 0.75)" : "rgba(255, 255, 255, 0.6)",
            transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
          },
        }}
      >
        <Fade in={settingsPop} timeout={300}>
          <Box
            className="relative overflow-hidden"
            sx={{
              width: { xs: "95%", sm: 480 },
              maxWidth: 520,
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              borderRadius: "16px",
              backdropFilter: "blur(20px)",
              backgroundColor:
                theme === "dark" ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.98)",
              backgroundImage:
                theme === "dark"
                  ? "linear-gradient(145deg, rgba(17, 24, 39, 0.98), rgba(15, 23, 42, 0.96))"
                  : "linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.97))",
              boxShadow:
                theme === "dark"
                  ? "0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 20px 40px -12px rgba(0, 0, 0, 0.4)"
                  : "0 25px 50px -12px rgba(0, 0, 0, 0.1), 0 20px 40px -12px rgba(0, 0, 0, 0.2)",
              border:
                theme === "dark"
                  ? "1px solid rgba(255, 255, 255, 0.1)"
                  : "1px solid rgba(0, 0, 0, 0.05)",
              transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
            }}
          >
            {/* Modal Header */}
            <Box
              className="flex items-center"
              sx={{
                display: "flex",
                py: 3.5,
                px: { xs: 3.5, sm: 4 },
                borderBottom: "1px solid",
                borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.07)",
                backgroundColor:
                  theme === "dark" ? "rgba(15, 23, 42, 0.5)" : "rgba(248, 250, 252, 0.8)",
              }}
            >
              <Icon
                sx={{
                  mr: 1,
                  mt: 0.7,
                  fontSize: "1.35rem",
                  color: themes[theme].menu.icon,
                  transition: "all 0.2s ease",
                }}
              >
                settings
              </Icon>
              <Typography
                variant="h6"
                className="font-medium tracking-tight flex items-center gap-2.5"
                sx={{
                  fontSize: "1.25rem",
                  color: theme === "dark" ? "#F8FAFC" : "#0F172A",
                  letterSpacing: "-0.02em",
                  fontWeight: 600,
                }}
              >
                {t("ns1:Ayarlar")}
              </Typography>
            </Box>

            {/* Modal Content */}
            <Box
              sx={{
                px: { xs: 3.5, sm: 4 },
                py: 4,
                overflowY: "auto",
                "&::-webkit-scrollbar": {
                  width: "6px",
                  backgroundColor: "transparent",
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor:
                    theme === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.15)",
                  borderRadius: "10px",
                },
                "&::-webkit-scrollbar-track": {
                  backgroundColor: "transparent",
                  borderRadius: "10px",
                  margin: "4px 0",
                },
              }}
            >
              <Box className="space-y-6">
                {/* Section Title */}
                <Box sx={{ mb: 3.5 }}>
                  <Typography
                    className="font-medium mb-2 flex items-center"
                    sx={{
                      fontSize: "1rem",
                      color: theme === "dark" ? "#F1F5F9" : "#1E293B",
                      letterSpacing: "-0.01em",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                    }}
                  >
                    <Icon
                      sx={{
                        fontSize: "1.2rem",
                        color: theme === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
                      }}
                    >
                      translate
                    </Icon>
                    {t("ns1:UygulamaDili")}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
                      fontSize: "0.875rem",
                      mb: 2,
                      lineHeight: 1.5,
                    }}
                  >
                    {t("ns1:UygulamaDili")}
                  </Typography>
                </Box>

                {/* Language Selection RadioGroup  */}
                <RadioGroup
                  aria-labelledby="language-radio-buttons-group"
                  name="language-radio-buttons-group"
                  value={selectedLanguage}
                  onChange={(event, value) => handleLanguageChange(event, value)}
                  className="space-y-3.5"
                >
                  {[
                    {
                      value: "tr",
                      label: "Türkçe",
                      sublabel: "Turkish",
                      flag: "🇹🇷",
                    },
                    {
                      value: "en",
                      label: "English",
                      sublabel: "İngilizce",
                      flag: "🇬🇧",
                    },
                  ].map((lang) => (
                    <Box
                      key={lang.value}
                      component="label"
                      htmlFor={`radio-${lang.value}`}
                      sx={{
                        display: "block",
                        cursor: "pointer",
                        "&:hover .MuiPaper-root": {
                          transform: "translateY(-2px)",
                          boxShadow:
                            theme === "dark"
                              ? "0 6px 16px rgba(0, 0, 0, 0.25)"
                              : "0 6px 16px rgba(0, 0, 0, 0.1)",
                        },
                      }}
                    >
                      <Paper
                        elevation={0}
                        sx={{
                          p: 0,
                          backgroundColor:
                            theme === "dark" ? "rgba(15, 23, 42, 0.5)" : "rgba(248, 250, 252, 0.8)",
                          borderRadius: "12px",
                          border: "1px solid",
                          borderColor:
                            selectedLanguage === lang.value
                              ? themes[theme].menu.icon
                              : theme === "dark"
                                ? "rgba(255, 255, 255, 0.1)"
                                : "rgba(0, 0, 0, 0.08)",
                          overflow: "hidden",
                          transition: "all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)",
                          transform:
                            selectedLanguage === lang.value ? "translateY(-2px)" : "translateY(0)",
                          boxShadow:
                            selectedLanguage === lang.value
                              ? theme === "dark"
                                ? "0 6px 16px rgba(0, 0, 0, 0.25)"
                                : "0 6px 16px rgba(0, 0, 0, 0.1)"
                              : "none",
                        }}
                      >
                        <Box className="flex items-center py-3 px-4">
                          <Radio
                            id={`radio-${lang.value}`}
                            value={lang.value}
                            sx={{
                              mr: 1.5,
                              padding: 0.75,
                              "& .MuiSvgIcon-root": {
                                fontSize: 24,
                                color:
                                  selectedLanguage === lang.value
                                    ? themes[theme].menu.icon
                                    : theme === "dark"
                                      ? "rgba(255, 255, 255, 0.5)"
                                      : "rgba(0, 0, 0, 0.4)",
                                transition: "transform 0.2s ease, color 0.2s ease",
                              },
                              "&.Mui-checked .MuiSvgIcon-root": {
                                transform: "scale(1.15)",
                                color: themes[theme].menu.icon,
                              },
                            }}
                          />

                          <Box className="flex flex-col ml-2 flex-grow">
                            <Box className="flex items-center gap-2">
                              <Typography
                                sx={{
                                  fontSize: "1rem",
                                  fontWeight: selectedLanguage === lang.value ? 600 : 500,
                                  color: theme === "dark" ? "#F1F5F9" : "#1E293B",
                                  letterSpacing: "-0.01em",
                                  transition: "font-weight 0.15s ease",
                                }}
                              >
                                {lang.label}
                              </Typography>
                              {/* <Typography sx={{ fontSize: "1rem" }}>{lang.flag}</Typography> */}
                            </Box>
                            <Typography
                              sx={{
                                fontSize: "0.8125rem",
                                color:
                                  theme === "dark"
                                    ? "rgba(255, 255, 255, 0.6)"
                                    : "rgba(0, 0, 0, 0.6)",
                                letterSpacing: "0.01em",
                                mt: 0.5,
                              }}
                            >
                              {lang.sublabel}
                            </Typography>
                          </Box>

                          {selectedLanguage === lang.value && (
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                backgroundColor: themes[theme].menu.icon,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                ml: "auto",
                              }}
                            >
                              <Icon sx={{ color: "#fff", fontSize: "0.875rem" }}>check</Icon>
                            </Box>
                          )}
                        </Box>
                      </Paper>
                    </Box>
                  ))}
                </RadioGroup>

                {/* Bottom Action Bar */}
                <Box
                  sx={{
                    mt: 6,
                    pt: 3.5,
                    borderTop: "1px solid",
                    borderColor:
                      theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.07)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Button
                    onClick={() => setSettingsPop(false)}
                    sx={{
                      py: 1.5,
                      px: 3,
                      borderRadius: "10px",
                      backgroundColor: "transparent",
                      color: theme === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
                      fontSize: "0.8375rem",
                      fontWeight: 450,
                      letterSpacing: "0.01em",
                      border: "1px solid",
                      borderColor:
                        theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)",
                      "&:hover": {
                        backgroundColor:
                          theme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
                      },
                    }}
                  >
                    {t("ns1:Iptal")}
                  </Button>

                  <Button
                    onClick={handleSubmit}
                    variant="contained"
                    className="transition-all duration-200 ease-in-out focus:outline-none"
                    startIcon={<Icon sx={{ fontSize: "1.1rem" }}>check</Icon>}
                    sx={{
                      py: 1.5,
                      px: 3.5,
                      borderRadius: "10px",
                      backgroundColor: themes[theme].menu.icon,
                      color: "#FFFFFF",
                      fontSize: "0.8375rem",
                      fontWeight: 450,
                      letterSpacing: "0.01em",
                      border: "none",
                      cursor: "pointer",
                      boxShadow:
                        theme === "dark"
                          ? "0 4px 14px rgba(0, 0, 0, 0.35)"
                          : "0 4px 14px rgba(0, 0, 0, 0.15)",
                      "&:hover": {
                        backgroundColor: theme === "dark" ? "#3B82F6" : "#2563EB",
                        transform: "translateY(-2px)",
                        boxShadow:
                          theme === "dark"
                            ? "0 8px 20px rgba(0, 0, 0, 0.45)"
                            : "0 8px 20px rgba(0, 0, 0, 0.2)",
                      },
                      "&:active": {
                        transform: "translateY(0px)",
                        boxShadow:
                          theme === "dark"
                            ? "0 4px 14px rgba(0, 0, 0, 0.35)"
                            : "0 4px 14px rgba(0, 0, 0, 0.15)",
                      },
                    }}
                  >
                    {t("ns1:Kaydet")}
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>
        </Fade>
      </Modal>
    </SidenavRoot>
  );
}

// Declaring default props for Sidenav
Sidenav.defaultProps = {
  color: "info",
  brand: "",
};

export default Sidenav;
