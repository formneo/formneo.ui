import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Avatar,
  Chip,
  Badge,
  LinearProgress,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  InputBase,
  Tooltip,
  alpha,
  useMediaQuery,
  useTheme as useMuiTheme,
  Menu,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import Icon from "@mui/material/Icon";
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  NotificationsOutlined as NotificationsIcon,
  Add as AddIcon,
  CheckCircleOutline as CheckCircleIcon,
  AccessTime as PendingIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Close as CloseIcon,
  VisibilityOutlined as ViewIcon,
  Check as ApproveIcon,
  Person as PersonIcon,
  BoltOutlined as BoltIcon,
  ArrowForwardIos as ArrowForwardIosIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  PlaylistAddCheck as PlaylistAddCheckIcon,
  FiberManualRecord as DotIcon,
  AutoAwesome as AutoAwesomeIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import formneoLogo from "assets/images/formneosvg.svg";
import { MenuApi, MenuListDto, ProcessHubApi, PendingApprovalSummaryDto } from "api/generated/api";
import getConfiguration from "confiuration";
import { useRootMenus } from "hooks/useRootMenus";
import { useMenuAuth } from "hooks/useMenuAuth";
import { useUser } from "layouts/pages/hooks/userName";

// ─────────────────────────────────────────────
// TEMA
// Proje PaletteOptions/ThemeOptions genişletmelerini
// atlamak için `as any` kullanılır.
// ─────────────────────────────────────────────
const dashboardTheme = createTheme({
  palette: {
    primary:     { main: "#4f46e5", light: "#818cf8", dark: "#3730a3", contrastText: "#ffffff" },
    secondary:   { main: "#10b981", light: "#34d399", dark: "#059669", contrastText: "#ffffff" },
    background:  { default: "#f8fafc", paper: "#ffffff" },
    text:        { main: "#0f172a", focus: "#0f172a", primary: "#0f172a", secondary: "#64748b" },
    white:       { main: "#ffffff", focus: "#ffffff" },
    transparent: { main: "rgba(0,0,0,0)" },
    black:       { light: "#000000", main: "#000000", focus: "#000000" },
    light:       { main: "#f0f2f5", focus: "#f0f2f5" },
    dark:        { main: "#344767", focus: "#2c3c58" },
    info:        { main: "#1A73E8", focus: "#1662C4" },
    success:     { main: "#4CAF50", focus: "#67bb6a" },
    warning:     { main: "#fb8c00", focus: "#fc9d26" },
    error:       { main: "#F44335", focus: "#f65f53" },
    gradients: {
      primary:   { main: "#EC407A", state: "#D81B60" },
      secondary: { main: "#747b8a", state: "#495361" },
      info:      { main: "#49a3f1", state: "#1A73E8" },
      success:   { main: "#66BB6A", state: "#43A047" },
      warning:   { main: "#FFA726", state: "#FB8C00" },
      error:     { main: "#EF5350", state: "#E53935" },
      light:     { main: "#EBEFF4", state: "#CED4DA" },
      dark:      { main: "#42424a", state: "#191919" },
    },
    socialMediaColors: {
      facebook:  { main: "#3b5998", dark: "#344e86" },
      twitter:   { main: "#55acee", dark: "#3ea1ec" },
      instagram: { main: "#125688", dark: "#0e456d" },
      linkedin:  { main: "#0077b5", dark: "#00669c" },
      pinterest: { main: "#cc2127", dark: "#b21d22" },
      youtube:   { main: "#e52d27", dark: "#d41f1a" },
      vimeo:     { main: "#1ab7ea", dark: "#13a3d2" },
      slack:     { main: "#3aaf85", dark: "#329874" },
      dribbble:  { main: "#ea4c89", dark: "#e73177" },
      github:    { main: "#24292e", dark: "#171a1d" },
      reddit:    { main: "#ff4500", dark: "#e03d00" },
      tumblr:    { main: "#35465c", dark: "#2a3749" },
    },
    badgeColors: {
      primary:   { background: "#f8b3ca", text: "#cc084b" },
      secondary: { background: "#d7d9e1", text: "#6c757d" },
      info:      { background: "#aecef7", text: "#095bc6" },
      success:   { background: "#bce2be", text: "#339537" },
      warning:   { background: "#ffd59f", text: "#c87000" },
      error:     { background: "#fcd3d0", text: "#f61200" },
      light:     { background: "#ffffff", text: "#c7d3de" },
      dark:      { background: "#8097bf", text: "#1e2e4a" },
    },
    coloredShadows: {
      primary: "#e91e62", secondary: "#110e0e", info: "#00bbd4",
      success: "#4caf4f", warning: "#ff9900", error: "#f44336",
      light: "#adb5bd", dark: "#404040",
    },
    inputBorderColor: "#d2d6da",
    tabs: { indicator: { boxShadow: "#ddd" } },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 800 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
  },
  shape: { borderRadius: 12 },
  // Proje ThemeOptions augmentation zorunlu alanları
  boxShadows: {
    xs: "none", sm: "none", md: "none", lg: "none", xl: "none", xxl: "none", inset: "none",
    colored: { primary:"none",secondary:"none",info:"none",success:"none",warning:"none",error:"none",light:"none",dark:"none" },
    navbarBoxShadow: "none",
    sliderBoxShadow: { thumb: "none" },
    tabsBoxShadow:   { indicator: "none" },
  },
  borders: {
    borderColor: "#d2d6da",
    borderWidth: { 0: 0, 1: "1px", 2: "2px", 3: "3px", 4: "4px", 5: "5px" },
    borderRadius: { xs: "2px", sm: "4px", md: "8px", lg: "12px", xl: "16px", xxl: "24px", section: "160px" },
  },
  functions: {},
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.05)",
          border: "1px solid #f1f5f9",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, textTransform: "none", fontWeight: 600 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600 },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 10, height: 6 },
      },
    },
  },
} as any);

// ─────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────

// Mevcut DashboardNavbar'daki icon render mantığını aynen kullan
function renderNavMenuIcon(
  rawIconName: string | null | undefined,
  color: string,
  fontSize = 18
): React.ReactNode {
  const iconName = String(rawIconName || "").trim();
  if (!iconName) return <Icon sx={{ color, fontSize }}>folder</Icon>;
  const lower = iconName.toLowerCase();
  if (lower.startsWith("mi:") || lower.startsWith("material:")) {
    return <Icon sx={{ color, fontSize }}>{iconName.split(":")[1] || ""}</Icon>;
  }
  if (lower.startsWith("pi:") || lower.startsWith("prime:")) {
    return <i className={`pi pi-${iconName.split(":")[1] || ""}`} style={{ color, fontSize: fontSize - 2 }} />;
  }
  const isMaterial =
    iconName.includes("_") ||
    ["home","dashboard","menu","business","group","apps","settings","edit"].includes(lower);
  if (isMaterial) return <Icon sx={{ color, fontSize }}>{iconName}</Icon>;
  return <i className={`pi pi-${iconName}`} style={{ color, fontSize: fontSize - 2 }} />;
}

// MenuListDto'dan navigasyon URL'si üret
function getMenuUrl(m: MenuListDto): string | null {
  if (m.href && m.href.trim()) return m.href.trim();
  if (m.route && m.route.trim()) return m.route.trim();
  return null;
}

interface Stat {
  id: number;
  title: string;
  value: string;
  trend: string;
  trendUp: boolean;
  Icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}

const STATS: Stat[] = [
  {
    id: 1,
    title: "Bekleyen Onaylar",
    value: "24",
    trend: "+12%",
    trendUp: true,
    Icon: PendingIcon,
    iconColor: "#d97706",
    iconBg: "#fef3c7",
  },
  {
    id: 2,
    title: "Aktif Formlar",
    value: "143",
    trend: "+8%",
    trendUp: true,
    Icon: PlaylistAddCheckIcon,
    iconColor: "#4f46e5",
    iconBg: "#ede9fe",
  },
  {
    id: 3,
    title: "Tamamlanan Süreçler",
    value: "89",
    trend: "+24%",
    trendUp: true,
    Icon: CheckCircleIcon,
    iconColor: "#10b981",
    iconBg: "#d1fae5",
  },
  {
    id: 4,
    title: "Toplam Kullanıcı",
    value: "512",
    trend: "-3%",
    trendUp: false,
    Icon: PersonIcon,
    iconColor: "#e11d48",
    iconBg: "#ffe4e6",
  },
];

const AVATAR_COLORS = ["#4f46e5","#0891b2","#059669","#9333ea","#ea580c","#be185d","#0d9488","#b45309"];

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

type ProgressColor = "primary" | "secondary" | "success" | "warning" | "error" | "info";

interface Process {
  id: number;
  title: string;
  progress: number;
  color: ProgressColor;
  status: string;
  step: string;
}

const PROCESSES: Process[] = [
  { id: 1, title: "İşe Alım Süreci", progress: 75, color: "primary", status: "Devam ediyor", step: "3/4" },
  { id: 2, title: "Bütçe Onay Akışı", progress: 45, color: "secondary", status: "Beklemede", step: "2/4" },
  { id: 3, title: "Müşteri Onboarding", progress: 90, color: "success", status: "Tamamlanmak üzere", step: "4/4" },
  { id: 4, title: "IT Destek Talebi", progress: 30, color: "warning", status: "Başlangıç aşaması", step: "1/3" },
];

interface Activity {
  id: number;
  text: string;
  user: string;
  time: string;
  color: string;
}

const ACTIVITIES: Activity[] = [
  { id: 1, text: "Yeni form şablonu oluşturuldu", user: "Siz", time: "10 dk önce", color: "#4f46e5" },
  { id: 2, text: "İzin talebi onaylandı", user: "Ahmet Y.", time: "1 saat önce", color: "#10b981" },
  { id: 3, text: "Satın alma formu reddedildi", user: "Fatma D.", time: "3 saat önce", color: "#f43f5e" },
  { id: 4, text: "Yeni süreç başlatıldı", user: "Mehmet K.", time: "5 saat önce", color: "#f59e0b" },
  { id: 5, text: "Rapor dışa aktarıldı", user: "Zeynep A.", time: "1 gün önce", color: "#8b5cf6" },
];

// ─────────────────────────────────────────────
// TOP NAVBAR
// ─────────────────────────────────────────────
function TopNavbar({ onMenuClick }: { onMenuClick: () => void }) {
  const muiTheme = useMuiTheme();
  const isDesktop = useMediaQuery(muiTheme.breakpoints.up("md"));
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { loginUserNameSurname, userAppDto } = useUser();

  // DB'den menüler
  const { data: rootMenus = [] } = useRootMenus();
  const { data: menuAuth = [] } = useMenuAuth();

  // Sub-menü dropdown state
  const [dropdownAnchor, setDropdownAnchor] = useState<null | HTMLElement>(null);
  const [dropdownMenuId, setDropdownMenuId] = useState<string | null>(null);
  const [dropdownSubs, setDropdownSubs] = useState<MenuListDto[]>([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const dropdownOpen = Boolean(dropdownAnchor);

  // Sub-menüleri DB'den çek (DashboardNavbar ile aynı mantık)
  useEffect(() => {
    if (!dropdownAnchor || !dropdownMenuId) { setDropdownSubs([]); return; }
    let cancelled = false;
    setDropdownLoading(true);
    const api = new MenuApi(getConfiguration());
    api.apiMenuSubMenusMenuIdGet(dropdownMenuId)
      .then((res) => {
        if (cancelled) return;
        const raw = res.data || [];
        const hasAuth = (m: MenuListDto) => {
          const href = (m.href && String(m.href).trim()) || (m.route && String(m.route).trim()) || "";
          const norm = "/" + href.split("/").slice(1, 2).join("/");
          return (menuAuth as any[]).some(
            (a: any) => ("/" + String(a.href || "").split("/").slice(1, 2).join("/")) === norm
          );
        };
        const filtered = raw.filter(hasAuth);
        setDropdownSubs(filtered.sort((a, b) => (a.order || 0) - (b.order || 0)));
      })
      .catch(() => { if (!cancelled) setDropdownSubs([]); })
      .finally(() => { if (!cancelled) setDropdownLoading(false); });
    return () => { cancelled = true; };
  }, [dropdownAnchor, dropdownMenuId, menuAuth]);

  const handleMenuBtnClick = (e: React.MouseEvent<HTMLElement>, menu: MenuListDto) => {
    const url = getMenuUrl(menu);
    if (url) {
      navigate(url);
    } else {
      setDropdownAnchor(e.currentTarget);
      setDropdownMenuId(menu.id ?? null);
    }
  };

  const handleDropdownClose = () => {
    setDropdownAnchor(null);
    setDropdownMenuId(null);
  };

  const handleSubMenuClick = (sub: MenuListDto) => {
    const url = getMenuUrl(sub);
    if (url) navigate(url);
    handleDropdownClose();
  };

  const fullName = loginUserNameSurname || localStorage.getItem("userFullName") || "Kullanıcı";
  const companyName = userAppDto?.company || localStorage.getItem("selectedTenantLabel") || "Formneo";
  const initials = fullName.split(" ").filter(Boolean).slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? "").join("");

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        color: "#0f172a",
        boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
        zIndex: (t) => t.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ px: { xs: 2, md: 3 }, gap: 1, height: 72, maxHeight: 72, minHeight: "72px !important", py: 0 }}>
        {/* Hamburger — sadece mobil */}
        {!isDesktop && (
          <IconButton edge="start" onClick={onMenuClick} sx={{ color: "#4f46e5", mr: 0.5 }}>
            <MenuIcon />
          </IconButton>
        )}

        {/* Logo */}
        <Box
          component="img"
          src={formneoLogo}
          alt="Formneo"
          onClick={() => navigate("/dashboards/analytics")}
          sx={{ height: 100, maxWidth: 420, objectFit: "contain", mr: { md: 4 }, cursor: "pointer", flexShrink: 0 }}
        />

        {/* Masaüstü — DB'den gelen root menüler */}
        {isDesktop && (
          <Box sx={{ display: "flex", gap: 0.5, flexGrow: 1, overflow: "hidden" }}>
            {rootMenus.map((menu) => {
              const url = getMenuUrl(menu);
              const isActive = url
                ? location.pathname === url || location.pathname.startsWith(url + "/")
                : location.pathname.startsWith("/" + (menu.menuCode || "").toLowerCase());
              const hasChildren = !url;
              return (
                <Button
                  key={menu.id}
                  onClick={(e) => handleMenuBtnClick(e, menu)}
                  endIcon={hasChildren ? <ExpandMoreIcon sx={{ fontSize: "14px !important", ml: -0.5 }} /> : undefined}
                  sx={{
                    px: 1.75,
                    py: 0.85,
                    borderRadius: 2,
                    color: isActive ? "#4f46e5" : "#475569",
                    bgcolor: isActive ? alpha("#4f46e5", 0.08) : "transparent",
                    fontWeight: isActive ? 700 : 500,
                    fontSize: "1rem",
                    letterSpacing: "0.01em",
                    whiteSpace: "nowrap",
                    minWidth: "auto",
                    gap: 0.5,
                    "&:hover": { bgcolor: alpha("#4f46e5", 0.06), color: "#4f46e5" },
                    transition: "all 0.2s",
                  }}
                >
                  <Box component="span" sx={{ display: "flex", alignItems: "center", mr: 0.5 }}>
                    {renderNavMenuIcon(menu.icon, isActive ? "#4f46e5" : "#94a3b8", 16)}
                  </Box>
                  {menu.name}
                </Button>
              );
            })}
          </Box>
        )}

        {/* Sub-menü Dropdown */}
        <Menu
          anchorEl={dropdownAnchor}
          open={dropdownOpen}
          onClose={handleDropdownClose}
          PaperProps={{
            elevation: 0,
            sx: {
              minWidth: 200,
              mt: 1,
              borderRadius: 3,
              border: "1px solid #e2e8f0",
              boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
              "& .MuiMenuItem-root": { borderRadius: 2, mx: 0.5, my: 0.25, fontSize: "0.85rem" },
            },
          }}
          transformOrigin={{ horizontal: "left", vertical: "top" }}
          anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
        >
          {dropdownLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress size={20} />
            </Box>
          ) : dropdownSubs.length === 0 ? (
            <MenuItem disabled sx={{ fontSize: "0.82rem", color: "text.secondary" }}>
              Menü yok
            </MenuItem>
          ) : (
            dropdownSubs.map((sub) => (
              <MenuItem key={sub.id} onClick={() => handleSubMenuClick(sub)}>
                <Box component="span" sx={{ display: "flex", alignItems: "center", mr: 1.25 }}>
                  {renderNavMenuIcon(sub.icon, "#64748b", 16)}
                </Box>
                {sub.name}
              </MenuItem>
            ))
          )}
        </Menu>

        <Box sx={{ flexGrow: isDesktop ? 0 : 1 }} />

        {/* Arama çubuğu */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            overflow: "hidden",
            transition: "width 0.3s ease",
            width: searchOpen ? { xs: 150, md: 220 } : 38,
            bgcolor: searchOpen ? alpha("#4f46e5", 0.06) : "transparent",
            borderRadius: 3,
            px: searchOpen ? 1.5 : 0.5,
          }}
        >
          <IconButton size="small" onClick={() => setSearchOpen(!searchOpen)} sx={{ color: "#64748b", p: 0.75, flexShrink: 0 }}>
            {searchOpen ? <CloseIcon fontSize="small" /> : <SearchIcon fontSize="small" />}
          </IconButton>
          {searchOpen && <InputBase autoFocus placeholder="Ara..." sx={{ fontSize: "0.875rem", flex: 1, color: "#0f172a" }} />}
        </Box>

        {/* Bildirim zili */}
        <Tooltip title="Bildirimler">
          <IconButton sx={{ color: "#64748b" }}>
            <Badge badgeContent={5} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* Profil */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, pl: 1.5, ml: 0.5, borderLeft: "1px solid #e2e8f0", cursor: "pointer", "&:hover": { opacity: 0.8 } }}>
          <Avatar sx={{ width: 36, height: 36, background: "linear-gradient(135deg, #4f46e5, #7c3aed)", fontSize: "0.78rem", fontWeight: 700 }}>
            {initials || "U"}
          </Avatar>
          {isDesktop && (
            <Box>
              <Typography variant="caption" component="div" sx={{ fontWeight: 700, color: "#0f172a", lineHeight: 1.4, whiteSpace: "nowrap" }}>
                {fullName}
              </Typography>
              <Typography variant="caption" component="div" sx={{ color: "#64748b", fontSize: "0.68rem", lineHeight: 1.4, whiteSpace: "nowrap" }}>
                {companyName}
              </Typography>
            </Box>
          )}
          {isDesktop && <KeyboardArrowDownIcon sx={{ fontSize: 18, color: "#64748b" }} />}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

// ─────────────────────────────────────────────
// MOBİL DRAWER
// ─────────────────────────────────────────────
function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: rootMenus = [] } = useRootMenus();

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 265, pt: 2, bgcolor: "#ffffff" } }}
    >
      {/* Logo */}
      <Box sx={{ px: 2, mb: 2, display: "flex", alignItems: "center" }}>
        <Box
          component="img"
          src={formneoLogo}
          alt="Formneo"
          sx={{ height: 72, maxWidth: 280, objectFit: "contain" }}
        />
      </Box>
      <Divider sx={{ mb: 1, borderColor: "#e2e8f0" }} />

      <List sx={{ px: 1 }}>
        {rootMenus.map((menu) => {
          const url = getMenuUrl(menu);
          const isActive = url
            ? location.pathname === url || location.pathname.startsWith(url + "/")
            : false;
          return (
            <ListItemButton
              key={menu.id}
              selected={isActive}
              onClick={() => {
                if (url) navigate(url);
                onClose();
              }}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                color: "#64748b",
                "&.Mui-selected": {
                  bgcolor: alpha("#4f46e5", 0.1),
                  color: "#4f46e5",
                  "& .MuiListItemIcon-root": { color: "#4f46e5" },
                },
                "&:hover": { bgcolor: alpha("#4f46e5", 0.06), color: "#4f46e5" },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {renderNavMenuIcon(menu.icon, isActive ? "#4f46e5" : "#94a3b8", 18)}
              </ListItemIcon>
              <ListItemText
                primary={menu.name}
                  primaryTypographyProps={{ fontSize: "0.95rem", fontWeight: isActive ? 700 : 500, color: isActive ? "#4f46e5" : "#475569", letterSpacing: "0.01em" }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Drawer>
  );
}

// ─────────────────────────────────────────────
// HERO BANNER
// ─────────────────────────────────────────────
function HeroBanner() {
  const { loginUserNameSurname } = useUser();
  const firstName = loginUserNameSurname?.split(" ")?.[0] || "Kullanıcı";

  return (
    <Card
      sx={{
        mb: 3,
        background: "linear-gradient(135deg, #4338ca 0%, #4f46e5 40%, #7c3aed 100%)",
        border: "none",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Dekoratif daireler */}
      <Box
        sx={{
          position: "absolute",
          top: -50,
          right: -50,
          width: 220,
          height: 220,
          borderRadius: "50%",
          bgcolor: "rgba(255,255,255,0.05)",
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: -70,
          right: 100,
          width: 180,
          height: 180,
          borderRadius: "50%",
          bgcolor: "rgba(255,255,255,0.05)",
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: 20,
          right: "28%",
          width: 80,
          height: 80,
          borderRadius: "50%",
          bgcolor: "rgba(255,255,255,0.04)",
          zIndex: 0,
        }}
      />

      <CardContent sx={{ p: { xs: 3, md: 4 }, position: "relative", zIndex: 1 }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs={12} md={8}>
            <Chip
              label="Hoş Geldiniz"
              size="small"
              sx={{
                mb: 1.5,
                bgcolor: "rgba(255,255,255,0.18)",
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.75rem",
              }}
            />
            <Typography variant="h4" sx={{ color: "#fff", mb: 1, lineHeight: 1.2 }}>
              Merhaba, {firstName} 👋
            </Typography>
            <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.82)", mb: 3, maxWidth: 460 }}>
              Bugün{" "}
              <Box component="strong" sx={{ color: "#fff" }}>
                24 bekleyen onayınız
              </Box>{" "}
              var. İş süreçlerinizi kolaylaştırmak için hazırız.
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                sx={{
                  bgcolor: "#fff",
                  color: "#4f46e5",
                  fontWeight: 700,
                  px: 3,
                  "&:hover": { bgcolor: "#f1f5f9", transform: "translateY(-1px)" },
                  transition: "all 0.2s",
                }}
              >
                Yeni Form Oluştur
              </Button>
              <Button
                variant="outlined"
                startIcon={<BoltIcon />}
                sx={{
                  borderColor: "rgba(255,255,255,0.5)",
                  color: "#fff",
                  fontWeight: 600,
                  px: 3,
                  "&:hover": {
                    borderColor: "#fff",
                    bgcolor: "rgba(255,255,255,0.1)",
                    transform: "translateY(-1px)",
                  },
                  transition: "all 0.2s",
                }}
              >
                Süreç Başlat
              </Button>
            </Box>
          </Grid>

          {/* Dekoratif ikon — sadece masaüstü */}
          <Grid
            item
            md={4}
            sx={{ display: { xs: "none", md: "flex" }, justifyContent: "flex-end", alignItems: "center" }}
          >
            <Box sx={{ position: "relative", width: 160, height: 160 }}>
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  sx={{
                    position: "absolute",
                    borderRadius: "50%",
                    border: "1.5px solid rgba(255,255,255,0.18)",
                    width: 90 + i * 32,
                    height: 90 + i * 32,
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                />
              ))}
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 68,
                  height: 68,
                  borderRadius: "50%",
                  bgcolor: "rgba(255,255,255,0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AutoAwesomeIcon sx={{ fontSize: 34, color: "#fff" }} />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────
// İSTATİSTİK KARTI
// ─────────────────────────────────────────────
function StatCard({ stat }: { stat: Stat }) {
  const { Icon } = stat;
  return (
    <Card
      sx={{
        height: "100%",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: "0 10px 28px rgba(0,0,0,0.10)",
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 3,
              bgcolor: stat.iconBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon sx={{ color: stat.iconColor, fontSize: 26 }} />
          </Box>
          <Chip
            label={stat.trend}
            size="small"
            icon={
              stat.trendUp ? (
                <TrendingUpIcon sx={{ fontSize: "14px !important" }} />
              ) : (
                <TrendingDownIcon sx={{ fontSize: "14px !important" }} />
              )
            }
            sx={{
              bgcolor: stat.trendUp ? "#d1fae5" : "#ffe4e6",
              color: stat.trendUp ? "#059669" : "#e11d48",
              fontWeight: 700,
              height: 24,
              fontSize: "0.72rem",
              "& .MuiChip-label": { px: 0.75 },
            }}
          />
        </Box>
        <Typography variant="h4" sx={{ mb: 0.5, color: "text.primary" }}>
          {stat.value}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
          {stat.title}
        </Typography>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────
// BEKLEYENLERDEKİ TEK SATIR (hover ile aksiyon)
// ─────────────────────────────────────────────
function PendingItemRow({ item, index }: { item: PendingApprovalSummaryDto; index: number }) {
  const [hovered, setHovered] = useState(false);
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const initials = getInitials(item.workflowName);

  return (
    <Box
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        p: 1.5,
        borderRadius: 3,
        transition: "background 0.15s",
        bgcolor: hovered ? alpha("#4f46e5", 0.04) : "transparent",
        cursor: "pointer",
      }}
    >
      <Avatar
        sx={{
          bgcolor: avatarColor,
          width: 40,
          height: 40,
          fontSize: "0.78rem",
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {initials}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" noWrap sx={{ fontWeight: 600, color: "text.primary", mb: 0.25 }}>
          {item.workflowName || "—"}
        </Typography>
        {item.stepName && (
          <Typography component="span" variant="caption" sx={{ color: "text.secondary" }}>
            {item.stepName}
          </Typography>
        )}
      </Box>

      {/* Aksiyon butonları — hover */}
      {hovered && (
        <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ViewIcon sx={{ fontSize: "13px !important" }} />}
            sx={{ fontSize: "0.72rem", py: 0.4, px: 1.25, borderRadius: 2 }}
          >
            İncele
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<ApproveIcon sx={{ fontSize: "13px !important" }} />}
            sx={{ fontSize: "0.72rem", py: 0.4, px: 1.25, borderRadius: 2 }}
          >
            Onayla
          </Button>
        </Box>
      )}
    </Box>
  );
}

// ─────────────────────────────────────────────
// BEKLEYENLERİM LİSTESİ
// ─────────────────────────────────────────────
function PendingItemsList() {
  const [items, setItems] = useState<PendingApprovalSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const api = new ProcessHubApi(getConfiguration());
    api.apiProcessHubMyPendingApprovalsGet()
      .then((res) => {
        if (!cancelled) setItems(res.data || []);
      })
      .catch(() => { if (!cancelled) setItems([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: 0 }}>
        {/* Başlık */}
        <Box
          sx={{
            p: 2.5,
            pb: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ color: "text.primary" }}>
              Bekleyen İşlemlerim
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {loading ? "Yükleniyor…" : `${items.length} onay bekleyen görev`}
            </Typography>
          </Box>
          <Button
            size="small"
            endIcon={<ArrowForwardIosIcon sx={{ fontSize: "11px !important" }} />}
            sx={{ fontSize: "0.75rem", color: "primary.main", fontWeight: 600 }}
          >
            Tümünü Gör
          </Button>
        </Box>

        {/* Liste */}
        <Box sx={{ px: 1, py: 1 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : items.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <CheckCircleIcon sx={{ fontSize: 40, color: "#10b981", mb: 1 }} />
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Bekleyen işleminiz bulunmuyor
              </Typography>
            </Box>
          ) : (
            items.map((item, index) => (
              <React.Fragment key={index}>
                <PendingItemRow item={item} index={index} />
                {index < items.length - 1 && (
                  <Divider sx={{ mx: 1.5, borderColor: "#f8fafc" }} />
                )}
              </React.Fragment>
            ))
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────
// AKTİF SÜREÇLERİM
// ─────────────────────────────────────────────
const progressColorMap: Record<ProgressColor, string> = {
  primary: "#4f46e5",
  secondary: "#10b981",
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#f43f5e",
  info: "#0ea5e9",
};

function ActiveProcesses() {
  return (
    <Card sx={{ mb: 2.5 }}>
      <CardContent sx={{ p: 0 }}>
        <Box
          sx={{
            p: 2.5,
            pb: 1.5,
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          <Typography variant="h6" sx={{ color: "text.primary" }}>
            Aktif Süreçlerim
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Devam eden iş akışları
          </Typography>
        </Box>

        <Box sx={{ p: 2.5, pt: 2 }}>
          {PROCESSES.map((proc, index) => {
            const hex = progressColorMap[proc.color];
            return (
              <Box key={proc.id} sx={{ mb: index < PROCESSES.length - 1 ? 2.5 : 0 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 0.75,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: "text.primary", fontSize: "0.82rem" }}
                  >
                    {proc.title}
                  </Typography>
                  <Typography
                    component="span"
                    variant="caption"
                    sx={{ color: "text.secondary", fontWeight: 600 }}
                  >
                    {proc.step}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={proc.progress}
                  sx={{
                    mb: 0.5,
                    bgcolor: alpha(hex, 0.12),
                    "& .MuiLinearProgress-bar": {
                      background: `linear-gradient(90deg, ${hex}, ${hex}bb)`,
                      borderRadius: 10,
                    },
                  }}
                />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography component="span" variant="caption" sx={{ color: "text.secondary", fontSize: "0.68rem" }}>
                    {proc.status}
                  </Typography>
                  <Typography component="span" variant="caption" sx={{ color: hex, fontWeight: 700, fontSize: "0.7rem" }}>
                    %{proc.progress}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────
// SON AKTİVİTELER
// ─────────────────────────────────────────────
function RecentActivities() {
  return (
    <Card>
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ p: 2.5, pb: 1.5, borderBottom: "1px solid #f1f5f9" }}>
          <Typography variant="h6" sx={{ color: "text.primary" }}>
            Son Aktiviteler
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Sistem genelinde son hareketler
          </Typography>
        </Box>

        <Box sx={{ p: 2.5, pt: 2 }}>
          {ACTIVITIES.map((activity, index) => (
            <Box
              key={activity.id}
              sx={{
                display: "flex",
                gap: 1.5,
                mb: index < ACTIVITIES.length - 1 ? 2 : 0,
                position: "relative",
              }}
            >
              {/* Timeline çizgisi */}
              {index < ACTIVITIES.length - 1 && (
                <Box
                  sx={{
                    position: "absolute",
                    left: 8,
                    top: 18,
                    bottom: -16,
                    width: 1.5,
                    bgcolor: "#e2e8f0",
                    zIndex: 0,
                  }}
                />
              )}

              {/* Nokta */}
              <Box
                sx={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  bgcolor: activity.color,
                  flexShrink: 0,
                  mt: 0.2,
                  zIndex: 1,
                  boxShadow: `0 0 0 3px ${alpha(activity.color, 0.18)}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <DotIcon sx={{ fontSize: 8, color: "#fff" }} />
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "text.primary", fontSize: "0.8rem", lineHeight: 1.4 }}
                >
                  {activity.text}
                </Typography>
                <Box component="span" sx={{ display: "flex", gap: 0.5, alignItems: "center", mt: 0.25 }}>
                  <Typography component="span" variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem" }}>
                    {activity.user}
                  </Typography>
                  <Typography component="span" variant="caption" sx={{ color: "#cbd5e1", fontSize: "0.7rem" }}>
                    ·
                  </Typography>
                  <Typography component="span" variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem" }}>
                    {activity.time}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────
// ANA DASHBOARD BİLEŞENİ
// ─────────────────────────────────────────────
function FormneoDashboard(): JSX.Element {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ThemeProvider theme={dashboardTheme}>
      <CssBaseline />
      <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
        <TopNavbar onMenuClick={() => setMobileOpen(true)} />
        <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />

        <Box component="main" sx={{ pt: "72px", pb: 5 }}>
          <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
            {/* Hero Banner */}
            <HeroBanner />

            {/* İstatistik Kartları */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
              {STATS.map((stat) => (
                <Grid item xs={12} sm={6} lg={3} key={stat.id}>
                  <StatCard stat={stat} />
                </Grid>
              ))}
            </Grid>

            {/* Ana Grid */}
            <Grid container spacing={2.5}>
              {/* Sol — Bekleyen İşlemlerim */}
              <Grid item xs={12} lg={8}>
                <PendingItemsList />
              </Grid>

              {/* Sağ — Süreçler + Aktiviteler */}
              <Grid item xs={12} lg={4}>
                <ActiveProcesses />
                <RecentActivities />
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default FormneoDashboard;
