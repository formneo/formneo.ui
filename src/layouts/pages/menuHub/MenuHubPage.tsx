import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { useNavigate, useParams } from "react-router-dom";
import { MenuApi, MenuListDto } from "api/generated/api";
import getConfiguration from "confiuration";
import { useMenuAuth } from "hooks/useMenuAuth";
import { useRootMenus } from "hooks/useRootMenus";
import { useMaterialUIController } from "context";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import Icon from "@mui/material/Icon";
import { Box, InputAdornment, TextField } from "@mui/material";
import "primeicons/primeicons.css";

// Menü ikonu (Material / PrimeIcons) – Sidenav ile uyumlu
function renderMenuIcon(rawIcon: string | null | undefined, color: string, fontSize = 28): React.ReactNode {
  const iconName = String(rawIcon || "").trim();
  if (!iconName) return <Icon sx={{ color, fontSize }}>apps</Icon>;
  const lower = iconName.toLowerCase();
  if (lower.startsWith("mi:") || lower.startsWith("material:")) {
    const name = iconName.split(":")[1] || "";
    return <Icon sx={{ color, fontSize }}>{name}</Icon>;
  }
  if (lower.startsWith("pi:") || lower.startsWith("prime:")) {
    const name = iconName.split(":")[1] || "";
    return <i className={`pi pi-${name}`} style={{ color, fontSize }} />;
  }
  const materialLikely = iconName.includes("_") || ["home", "dashboard", "menu", "business", "group", "apps", "settings", "edit", "qr_code"].includes(lower);
  if (materialLikely) return <Icon sx={{ color, fontSize }}>{iconName}</Icon>;
  return <i className={`pi pi-${iconName}`} style={{ color, fontSize }} />;
}

export default function MenuHubPage(): JSX.Element {
  const { id } = useParams();
  const navigate = useNavigate();
  const [controller] = useMaterialUIController();
  const darkMode = !!controller.darkMode;
  const [parent, setParent] = useState<any | null>(null);
  const [subMenus, setSubMenus] = useState<MenuListDto[]>([]);
  const [loadingSubMenus, setLoadingSubMenus] = useState(false);
  const [q, setQ] = useState("");
  const [pinned, setPinned] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("menuHub:pinned") || "[]");
    } catch {
      return [];
    }
  });

  const { data: auth = [] } = useMenuAuth();
  const { data: rootMenus = [] } = useRootMenus();

  useEffect(() => {
    if (rootMenus.length > 0) {
      const p = rootMenus.find((m) => String(m.id) === String(id) || String(m.menuCode) === String(id)) || null;
      setParent(p);
    }
  }, [id, rootMenus]);

  useEffect(() => {
    const fetchSubMenus = async () => {
      if (!parent?.id) {
        setSubMenus([]);
        return;
      }
      try {
        setLoadingSubMenus(true);
        const api = new MenuApi(getConfiguration());
        const response = await api.apiMenuSubMenusMenuIdGet(parent.id);
        setSubMenus(response.data || []);
      } catch (error) {
        console.error("Alt menüler çekilirken hata:", error);
        setSubMenus([]);
      } finally {
        setLoadingSubMenus(false);
      }
    };
    fetchSubMenus();
  }, [parent?.id]);

  const subs = useMemo(() => {
    if (!parent || subMenus.length === 0) return [] as any[];
    const hasAuth = (m: any) => {
      const href = (m.href && String(m.href).trim()) || (m.route && String(m.route).trim()) || "";
      const norm = "/" + href.split("/").slice(1, 2).join("/");
      return auth.some((a) => ("/" + String(a.href || "").split("/").slice(1, 2).join("/")) === norm);
    };
    const filtered = subMenus.filter((m) => hasAuth(m));
    const search = q.trim().toLowerCase();
    const searched = search ? filtered.filter((m) => String(m.name || "").toLowerCase().includes(search)) : filtered;
    return searched.sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [subMenus, parent, auth, q]);

  const togglePin = (key: string) => {
    setPinned((prev) => {
      const next = prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key];
      try {
        localStorage.setItem("menuHub:pinned", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const cardBg = darkMode ? "rgba(255,255,255,0.04)" : "#ffffff";
  const cardBorder = darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0";
  const iconColor = darkMode ? "#38bdf8" : "#0284c7";
  const textPrimary = darkMode ? "#f1f5f9" : "#0f172a";
  const textSecondary = darkMode ? "#94a3b8" : "#64748b";

  const SubMenuCard = ({
    m,
    isPinned,
    onPin,
    showPin = true,
  }: {
    m: any;
    isPinned?: boolean;
    onPin?: () => void;
    showPin?: boolean;
  }) => {
    const href = (m.href && String(m.href).trim()) || (m.route && String(m.route).trim()) || "#";
    const canOpen = href !== "#";
    return (
      <MDBox
        onClick={() => canOpen && navigate(href)}
        sx={{
          background: cardBg,
          border: cardBorder,
          borderRadius: 3,
          p: 2.5,
          minHeight: 160,
          display: "flex",
          flexDirection: "column",
          cursor: canOpen ? "pointer" : "default",
          transition: "box-shadow 0.2s, transform 0.2s, border-color 0.2s",
          "&:hover": canOpen
            ? {
                boxShadow: darkMode ? "0 8px 24px rgba(0,0,0,0.25)" : "0 8px 24px rgba(0,0,0,0.08)",
                borderColor: darkMode ? "rgba(56,189,248,0.3)" : "#0284c7",
                transform: "translateY(-2px)",
              }
            : {},
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
          <MDBox
            sx={{
              width: 52,
              height: 52,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: darkMode ? "rgba(56,189,248,0.12)" : "rgba(2,132,199,0.08)",
            }}
          >
            {renderMenuIcon(m.icon, iconColor, 28)}
          </MDBox>
          {showPin && (
            <MDTypography
              component="button"
              variant="caption"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onPin?.();
              }}
              sx={{
                color: textSecondary,
                cursor: "pointer",
                border: "none",
                background: "none",
                "&:hover": { color: iconColor },
              }}
            >
              {isPinned ? "Sabiti kaldır" : "Sabitle"}
            </MDTypography>
          )}
        </Box>
        <MDTypography variant="h6" fontWeight="600" sx={{ color: textPrimary, fontSize: "1.05rem", mb: 0.5 }}>
          {m.name}
        </MDTypography>
        {m.description && (
          <MDTypography variant="caption" sx={{ color: textSecondary, lineHeight: 1.4, flex: 1 }}>
            {m.description}
          </MDTypography>
        )}
        <MDBox sx={{ mt: "auto", pt: 1.5 }}>
          <MDButton
            variant="gradient"
            color="info"
            size="small"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              if (canOpen) navigate(href);
            }}
            disabled={!canOpen}
            sx={{ textTransform: "none", fontWeight: 600, boxShadow: 1 }}
          >
            Aç
          </MDButton>
        </MDBox>
      </MDBox>
    );
  };

  const pinnedItems = subs.filter((m) => pinned.includes(String(m.id || m.menuCode)));

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox
        sx={{
          px: { xs: 2, sm: 3, lg: 4 },
          py: 4,
          maxWidth: 1200,
          mx: "auto",
        }}
      >
        <MDBox sx={{ mb: 4 }}>
          <MDTypography variant="h4" fontWeight="700" sx={{ color: textPrimary, mb: 0.5 }}>
            {parent?.name || "Menü"}
          </MDTypography>
          <MDTypography variant="body2" sx={{ color: textSecondary }}>
            Alt menülere tıklayarak ilgili sayfaya gidebilirsiniz. Sık kullandıklarınızı sabitleyebilirsiniz.
          </MDTypography>
        </MDBox>

        <MDBox sx={{ mb: 3 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Menü ara…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Icon sx={{ color: textSecondary, fontSize: 22 }}>search</Icon>
                </InputAdornment>
              ),
            }}
            sx={{
              maxWidth: 400,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: darkMode ? "rgba(255,255,255,0.06)" : "#f8fafc",
                "& fieldset": { borderColor: darkMode ? "rgba(255,255,255,0.12)" : "#e2e8f0" },
              },
            }}
          />
        </MDBox>

        {loadingSubMenus && (
          <MDTypography variant="body2" sx={{ color: textSecondary }}>
            Yükleniyor…
          </MDTypography>
        )}

        {!loadingSubMenus && subs.length === 0 && (
          <MDBox
            sx={{
              py: 8,
              textAlign: "center",
              color: textSecondary,
            }}
          >
            <Icon sx={{ fontSize: 48, opacity: 0.5, mb: 1 }}>folder_off</Icon>
            <MDTypography variant="body1">Bu menüye bağlı alt menü bulunamadı.</MDTypography>
          </MDBox>
        )}

        {!loadingSubMenus && subs.length > 0 && (
          <>
            {pinnedItems.length > 0 && (
              <MDBox sx={{ mb: 4 }}>
                <MDTypography variant="overline" fontWeight="600" sx={{ color: textSecondary, mb: 2, display: "block" }}>
                  Sabitlenenler
                </MDTypography>
                <MDBox
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: 2,
                  }}
                >
                  {pinnedItems.map((m) => (
                    <SubMenuCard
                      key={String(m.id || m.menuCode)}
                      m={m}
                      isPinned
                      onPin={() => togglePin(String(m.id || m.menuCode))}
                      showPin
                    />
                  ))}
                </MDBox>
              </MDBox>
            )}

            <MDTypography variant="overline" fontWeight="600" sx={{ color: textSecondary, mb: 2, display: "block" }}>
              Tümü
            </MDTypography>
            <MDBox
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 2,
              }}
            >
              {subs.map((m) => (
                <SubMenuCard
                  key={String(m.id || m.menuCode)}
                  m={m}
                  isPinned={pinned.includes(String(m.id || m.menuCode))}
                  onPin={() => togglePin(String(m.id || m.menuCode))}
                  showPin
                />
              ))}
              <SubMenuCard
                key="department-management"
                m={{
                  name: "Departman Tanımlama",
                  description: "Departman ekle ve düzenle",
                  icon: "business",
                  href: "/tenant/department-management",
                }}
                showPin={false}
              />
              <SubMenuCard
                key="position-management"
                m={{
                  name: "Pozisyon Tanımlama",
                  description: "Pozisyon ekle ve düzenle",
                  icon: "work",
                  href: "/tenant/position-management",
                }}
                showPin={false}
              />
            </MDBox>
          </>
        )}
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}
