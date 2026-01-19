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
import Card from "@mui/material/Card";
import { Box, Button, Grid, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { Link } from "react-router-dom";
// Material Dashboard 2 PRO React TS examples components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import { useLocation, useNavigate } from "react-router-dom";
// Data
import dataTableData from "layouts/applications/data-tables/data/dataTableData";
import { MenuApi, MenuListDto, UserApi, UserAppDto } from "api/generated";
import { useEffect, useState } from "react";
import getConfiguration from "confiuration";
import MDButton from "components/MDButton";
import { Icon } from "@mui/material";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useUser } from "layouts/pages/hooks/userName";
import {
  Bar,
  Breadcrumbs,
  BreadcrumbsItem,
  MessageBoxType,
  MessageStrip,
  ObjectPage,
  ObjectPageHeader,
  ObjectPageTitle,
  ObjectStatus,
  Toolbar,
  ToolbarButton,
} from "@ui5/webcomponents-react";

import DataTable from "examples/Tables/DataTable";
import { id } from "date-fns/locale";
import GlobalCell from "components/GlobalCell";
import { useAlert } from "../hooks/useAlert";
import MessageBox from "../Components/MessageBox";
import "@ui5/webcomponents-icons/dist/add.js";
import { useTranslation } from "react-i18next";
import { Tree } from "primereact/tree";

function MenuList(): JSX.Element {
  const navigate = useNavigate(); // Navig
  const dispatchAlert = useAlert();
  const { userAppDto } = useUser(); // Context'ten veriyi alıyoruz
  const { t } = useTranslation();
  const dispatchBusy = useBusy();
  const [dataTableData, setDataTableData] = useState<any[]>([]);
  const [isQuestionMessageBoxOpen, setIsQuestionMessageBoxOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [treeNodes, setTreeNodes] = useState<any[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<any>({});
  const [showTree, setShowTree] = useState(false);

  const buildMenuTree = (menus: any[]) => {
    const menuMap = new Map();
    const rootMenus: any[] = [];
    
    // Tüm menüleri map'e ekle
    menus.forEach(menu => {
      menuMap.set(menu.id, { 
        ...menu, 
        children: [],
        key: menu.id,
        label: menu.name,
        data: menu
      });
    });
    
    // Parent-child ilişkisini kur
    menus.forEach(menu => {
      if (menu.parentMenuId) {
        const parent = menuMap.get(menu.parentMenuId);
        if (parent) {
          parent.children.push(menuMap.get(menu.id));
        }
      } else {
        rootMenus.push(menuMap.get(menu.id));
      }
    });
    
    // Sıralama fonksiyonu
    const sortByOrder = (nodes: any[]) => {
      return nodes.sort((a, b) => (a.order || 0) - (b.order || 0));
    };
    
    // Root menüleri sırala
    const sortedRootMenus = sortByOrder(rootMenus);
    
    // Her düğümün alt menülerini de sırala
    const sortChildren = (nodes: any[]) => {
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          node.children = sortByOrder(node.children);
          sortChildren(node.children);
        }
      });
    };
    
    sortChildren(sortedRootMenus);
    
    return sortedRootMenus;
  };

  const fetchMenus = async () => {
    try {
      dispatchBusy({ isBusy: true });
      var conf = getConfiguration();
      var api = new MenuApi(conf);
      var data = await api.apiMenuAllPlainGet();
      console.log(data.data);
      setDataTableData(data.data as any);
      
      // Tree yapısını oluştur
      const treeData = buildMenuTree(data.data as any);
      setTreeNodes(treeData);
      
      // Tüm düğümleri genişlet
      const allKeys: any = {};
      const expandAll = (nodes: any[]) => {
        nodes.forEach(node => {
          allKeys[node.key] = true;
          if (node.children && node.children.length > 0) {
            expandAll(node.children);
          }
        });
      };
      expandAll(treeData);
      setExpandedKeys(allKeys);
      
    } catch (error) {
      dispatchAlert({
        message: t("ns1:MenuPage.MenuList.MenuleriAlirkenHata"),
        type: MessageBoxType.Error,
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      dispatchBusy({ isBusy: true });
      var conf = getConfiguration();
      var api = new MenuApi(conf);
      await api.apiMenuIdDelete(id);
      dispatchAlert({
        message: t("ns1:MenuPage.MenuList.MenuSilindi"),
        type: MessageBoxType.Success,
      });
      dispatchBusy({ isBusy: false });
      fetchMenus();
    } catch (error) {
      dispatchAlert({
        message: t("ns1:MenuPage.MenuList.MenuSilmeHata"),
        type: MessageBoxType.Error,
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const handleAdd = () => {
    navigate("/Menudetail");
  };

  const handleOpenQuestionBox = (id: string) => {
    setSelectedId(id);
    setIsQuestionMessageBoxOpen(true);
  };

  const handleCloseQuestionBox = (action: string) => {
    setIsQuestionMessageBoxOpen(false);
    if (action === "Yes") {
      handleDelete(selectedId);
    }
    if (action === "No") {
      alert("silinme işlemi iptal edildi");
    }
  };

  const renderNode = (node: any) => {
    const menu = node.data;
    const parentMenu = dataTableData.find((item: any) => item.id === menu.parentMenuId);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px", lineHeight: "22px" }}>
        <i className={`pi ${menu.icon ? `pi-${menu.icon}` : "pi-box"}`} style={{ fontSize: 16, opacity: 0.85 }} />
        <span style={{ fontWeight: 600 }}>{node.label}</span>
        {menu.route && (
          <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 8 }}>
            ({menu.route})
          </span>
        )}
        {parentMenu && (
          <span style={{ 
            fontSize: 10, 
            color: "#374151", 
            backgroundColor: "#f3f4f6", 
            padding: "2px 6px", 
            borderRadius: "4px",
            marginLeft: 8,
            fontWeight: 500,
            border: "1px solid #d1d5db"
          }}>
            ↑ {parentMenu.name}
          </span>
        )}
        {menu.isTenantOnly ? (
          <span style={{ 
            fontSize: 10, 
            color: "#ffffff", 
            backgroundColor: "#3b82f6", 
            padding: "2px 6px", 
            borderRadius: "4px",
            marginLeft: 8,
            fontWeight: 500
          }}>
            TENANT
          </span>
        ) : (
          <span style={{ 
            fontSize: 10, 
            color: "#ffffff", 
            backgroundColor: "#10b981", 
            padding: "2px 6px", 
            borderRadius: "4px",
            marginLeft: 8,
            fontWeight: 500
          }}>
            GLOBAL
          </span>
        )}
        <span style={{ fontSize: 10, color: menu.isActive ? "#16a34a" : "#9ca3af", marginLeft: 4 }}>
          {menu.isActive ? "Aktif" : "Pasif"}
        </span>
      </div>
    );
  };

  const columns = [
    {
      id: "order",
      name: "Sıra No",
      Header: (
        <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>
          {t("ns1:MenuPage.MenuList.SiraNo")}
        </div>
      ),
      accessor: "order",

      Cell: ({ row, value, column }: any) => (
        <GlobalCell value={value} columnName={column.id} testRow={row.original} />
      ),
      sortable: true,
    },
    {
      id: "name",
      name: "Menü Adı",
      Header: (
        <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>
          {t("ns1:MenuPage.MenuList.EkranAdi")}
        </div>
      ),
      accessor: "name",
      selector: (row: MenuListDto) => row.name,
      Cell: ({ row, value, column }: any) => <GlobalCell value={value} columnName={column.id} />,
      sortable: true,
    },
    {
      id: "route",
      name: "Rota",
      Header: (
        <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>
          {t("ns1:MenuPage.MenuList.HedefAdres")}
        </div>
      ),
      accessor: "href",
      selector: (row: MenuListDto) => row.route || row.href || "",

      Cell: ({ row, value, column }: any) => (
        <GlobalCell value={value} columnName={column.id} testRow={row.original} />
      ),
    },
    {
      id: "parentMenu",
      name: "Üst Menü",
      Header: (
        <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>
          Üst Menü
        </div>
      ),
      accessor: "parentMenuId",
      Cell: ({ row, value, column }: any) => {
        const parentMenu = dataTableData.find((item: any) => item.id === value);
        return parentMenu ? (
          <span style={{ 
            fontSize: 12, 
            color: "#374151", 
            backgroundColor: "#f3f4f6", 
            padding: "4px 8px", 
            borderRadius: "4px",
            fontWeight: 500,
            border: "1px solid #d1d5db"
          }}>
            ↑ {parentMenu.name}
          </span>
        ) : (
          <span style={{ color: "#9ca3af", fontSize: 12 }}>Root</span>
        );
      },
    },
    {
      id: "type",
      name: "Tip",
      Header: (
        <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>
          Tip
        </div>
      ),
      accessor: "isTenantOnly",
      Cell: ({ row, value, column }: any) => {
        return value ? (
          <span style={{ 
            fontSize: 10, 
            color: "#ffffff", 
            backgroundColor: "#3b82f6", 
            padding: "4px 8px", 
            borderRadius: "4px",
            fontWeight: 500
          }}>
            TENANT
          </span>
        ) : (
          <span style={{ 
            fontSize: 10, 
            color: "#ffffff", 
            backgroundColor: "#10b981", 
            padding: "4px 8px", 
            borderRadius: "4px",
            fontWeight: 500
          }}>
            GLOBAL
          </span>
        );
      },
    },
    {
      id: "showMenu",
      name: "Görünüm",
      Header: (
        <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>
          {t("ns1:MenuPage.MenuList.Gorunum")}
        </div>
      ),
      accessor: "showMenu",
      Cell: ({ row, value, column }: any) => (
        <GlobalCell value={value} columnName={column.id} testRow={row.original} />
      ),
    },
    {
      id: "menuCode",
      name: "menuCode",
      Header: (
        <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>
          {t("ns1:MenuPage.MenuList.Kod")}
        </div>
      ),
      accessor: "menuCode",
      selector: (row: MenuListDto) => row.menuCode || "",

      Cell: ({ row, value, column }: any) => (
        <GlobalCell value={value} columnName={column.id} testRow={row.original} />
      ),
    },
    {
      id: "isActive",
      name: "Durum",
      Header: (
        <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>
          {t("ns1:MenuPage.MenuList.Durum")}
        </div>
      ),
      accessor: "isActive",
      Cell: ({ row, value, column }: any) => (
        <GlobalCell value={value} columnName={column.id} testRow={row.original} />
      ),
    },
    {
      id: "createdAt",
      name: "Olusturma Tarihi",
      Header: (
        <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>
          {t("ns1:MenuPage.MenuList.OlusturmaTarihi")}
        </div>
      ),
      accessor: "createdAt",
      selector: (row: MenuListDto) => row.createdAt || "",
      width: "15%",

      Cell: ({ row, value, column }: any) => (
        <GlobalCell value={value} columnName={column.id} testRow={row.original} />
      ),
    },
    {
      accessor: "actions",
      Header: (
        <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>
          {t("ns1:MenuPage.MenuList.Islemler")}
        </div>
      ),
      Cell: ({ row }: any) => (
        <MDBox mx={2}>
          <Icon
            sx={{ cursor: "pointer" }}
            onClick={() => navigate(`/menus/detail/${row.original.id}`)}
            style={{ marginRight: "8px" }}
          >
            edit
          </Icon>

          <Icon sx={{ cursor: "pointer" }} onClick={() => handleOpenQuestionBox(row.original.id)}>
            delete
          </Icon>
        </MDBox>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ObjectPage
        mode="Default"
        hidePinButton
        style={{
          height: "100%",
          marginTop: "-15px",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 2px 12px 0 rgba(0,0,0,0.1)",
          width: "100%",
          overflow: "hidden"
        }}
        titleArea={
          <ObjectPageTitle
            style={{
              paddingTop: "24px",
              paddingLeft: "24px",
              paddingRight: "24px",
              backgroundColor: "#ffffff",
              cursor: "default",
            }}
            actionsBar={
              <MDBox style={{ marginTop: "15px", marginRight: "15px" }}>
                <MDButton
                  variant={showTree ? "outlined" : "gradient"}
                  color="info"
                  onClick={() => setShowTree(!showTree)}
                  size="small"
                  startIcon={<Icon>{showTree ? "table_view" : "account_tree"}</Icon>}
                  sx={{
                    marginRight: "0.5rem",
                    bottom: "11px",
                    height: "2.25rem",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  {showTree ? "Grid Görünümü" : "Tree Görünümü"}
                </MDButton>
                <MDButton
                  variant="gradient"
                  color="info"
                  onClick={() => navigate(`/menus/detail`)}
                  size="small"
                  startIcon={<Icon>add</Icon>}
                  sx={{
                    marginRight: "0.5rem",
                    bottom: "11px",
                    height: "2.25rem",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  {t("ns1:MenuPage.MenuList.YeniMenu")}
                </MDButton>
              </MDBox>
            }
          >
            <MDBox>
              <Typography
                variant="h5"
                component="h1"
                sx={{
                  fontWeight: 600,
                  color: "#344767",
                  marginBottom: "4px",
                }}
              >
                {t("ns1:MenuPage.MenuList.MenuTitle")}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#7b809a",
                }}
              >
                {t("ns1:MenuPage.MenuList.MenuSubTitle")}
              </Typography>
            </MDBox>
          </ObjectPageTitle>
        }
      >
        <Grid xs={12} lg={showTree ? 12 : 12} sx={{ paddingLeft: "3px", paddingRight: "3px" }}>
          <Card style={{ height: "660px", width: "100%" }}>
            <MDBox>
              <MDBox height="565px">
                {showTree ? (
                  <div style={{ padding: "16px" }}>
                    <MDBox display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                      <MDTypography variant="h6">Menü Ağacı</MDTypography>
                      <MDBox display="flex" gap={1}>
                        <MDButton
                          variant="outlined"
                          color="secondary"
                          size="small"
                          onClick={() => {
                            const allKeys: any = {};
                            const expandAll = (nodes: any[]) => {
                              nodes.forEach(node => {
                                allKeys[node.key] = true;
                                if (node.children && node.children.length > 0) {
                                  expandAll(node.children);
                                }
                              });
                            };
                            expandAll(treeNodes);
                            setExpandedKeys(allKeys);
                          }}
                        >
                          Hepsini Aç
                        </MDButton>
                        <MDButton
                          variant="outlined"
                          color="secondary"
                          size="small"
                          onClick={() => setExpandedKeys({})}
                        >
                          Hepsini Kapat
                        </MDButton>
                      </MDBox>
                    </MDBox>
                    <div style={{ background: "#f9fafb", borderRadius: 12, border: "1px solid #e8e8e8", padding: 16 }}>
                      <Tree
                        value={treeNodes}
                        expandedKeys={expandedKeys}
                        onToggle={(e) => setExpandedKeys(e.value)}
                        nodeTemplate={renderNode}
                        className="w-full"
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto", width: "100%", maxWidth: "100%" }}>
                    <DataTable
                      canSearch={true}
                      table={{
                        columns: columns,
                        rows: dataTableData,
                      }}
                    />
                  </div>
                )}
              </MDBox>
            </MDBox>
          </Card>
        </Grid>
      </ObjectPage>
      <MessageBox
        isQuestionmessageBoxOpen={isQuestionMessageBoxOpen}
        handleCloseQuestionBox={handleCloseQuestionBox}
      />
      <Footer />
    </DashboardLayout>
  );
}

export default MenuList;
