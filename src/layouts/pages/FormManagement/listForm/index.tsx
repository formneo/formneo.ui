import { Card, Grid, Icon, Typography } from "@mui/material";
import {
  Toolbar,
  ObjectPageTitle,
  ToolbarButton,
  ObjectPageHeader,
  MessageBoxType,
} from "@ui5/webcomponents-react";
import MessageBox from "layouts/pages/Components/MessageBox";
import { ObjectPage } from "@ui5/webcomponents-react";
import { FormDataApi } from "api/generated";
import { listForms } from "api/formDataService";
import MDBox from "components/MDBox";
import getConfiguration from "confiuration";
import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";
import GlobalCell from "components/GlobalCell";

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert } from "layouts/pages/hooks/useAlert";
import MDButton from "components/MDButton";

function ListForm() {
  const navigate = useNavigate();
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();
  const [dataTableData, setDataTableData] = useState<any[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selectedId, setSelectedId] = useState("");
  const [isQuestionMessageBoxOpen, setIsQuestionMessageBoxOpen] = useState(false);

  const fetchData = async () => {
    try {
      dispatchBusy({ isBusy: true });
      const rows = await listForms();
      setRawRows(rows);
      setDataTableData(buildTreeRows(rows, expanded));
    } catch (error) {
      dispatchAlert({
        message: "Bir hata oluştu",
        type: MessageBoxType.Error,
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const handleDelete = async (id: string) => {
    try {
      dispatchBusy({ isBusy: true });
      var conf = getConfiguration();
      var api = new FormDataApi(conf);
      await api.apiFormDataIdDelete(id);
      fetchData();
      dispatchAlert({
        message: "Form başarıyla silindi",
        type: MessageBoxType.Success,
      });
    } catch (error) {
      dispatchAlert({
        message: "Bir hata oluştu",
        type: MessageBoxType.Error,
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const handlePreview = (id: string) => {
    navigate("/forms/preview/" + id);

  };
  const handleData = (id: string) => {
    navigate("/formList/" + id);

  };

  const groupByParent = (rows: any[]) => {
    const map: Record<string, any[]> = {};
    rows.forEach((r) => {
      const key = r.parentFormId || r.id;
      map[key] = map[key] || [];
      map[key].push(r);
    });
    return map;
  };

  const pickParent = (arr: any[]) => {
    // Öncelik: publicationStatus=2 (Yayın) olan en güncel, yoksa en büyük revision
    const published = arr.filter((x) => x.publicationStatus === 2);
    if (published.length > 0) {
      return published.sort((a, b) => (b.revision || 0) - (a.revision || 0))[0];
    }
    return [...arr].sort((a, b) => (b.revision || 0) - (a.revision || 0))[0];
  };

  const buildTreeRows = (rows: any[], expandedMap: Record<string, boolean>) => {
    const groups = groupByParent(rows);
    const result: any[] = [];
    Object.keys(groups).forEach((gKey) => {
      const items = groups[gKey].sort((a, b) => (b.revision || 0) - (a.revision || 0));
      const parent = pickParent(items);
      const children = items.filter((x) => x.id !== parent.id);
      result.push({ ...parent, _treeKey: gKey, _level: 0, _hasChildren: children.length > 0, _childrenCount: children.length });
      if (expandedMap[gKey]) {
        children.forEach((c) => {
          result.push({ ...c, _treeKey: gKey, _level: 1, _isChild: true });
        });
      }
    });
    return result;
  };

  // expanded değiştiğinde listeyi yeniden üret
  useEffect(() => {
    if (rawRows.length > 0) {
      setDataTableData(buildTreeRows(rawRows, expanded));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  const toggleExpand = (row: any) => {
    const key = row.original?._treeKey || row._treeKey || row.id;
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const columns = [
    {
      id: "revTree",
      name: "Rev.",
      Header: <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>Rev.</div>,
      accessor: "_treeKey",
      Cell: ({ row }: any) => {
        const hasChildren = row.original?._hasChildren;
        const level = row.original?._level || 0;
        const gKey = row.original?._treeKey;
        const isExpanded = !!expanded[gKey];
        const pad = level * 16;
        if (!hasChildren && level === 0) return <div style={{ paddingLeft: pad }} />;
        if (level === 1) return <div style={{ paddingLeft: pad }}>↳</div>;
        return (
          <div style={{ paddingLeft: pad, cursor: "pointer" }} onClick={() => toggleExpand(row)}>
            <Icon fontSize="small">{isExpanded ? "expand_less" : "expand_more"}</Icon>
          </div>
        );
      },
      width: 60,
    },
    {
      id: "formName",
      name: "Form Adı",
      Header: <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>Form Adı</div>,
      accessor: "formName",


      Cell: ({ row, value, column }: any) => {
        const level = row.original?._level || 0;
        const pad = level * 16;
        const rev = row.original?.revision;
        const label = level === 1 ? `${value} (rev #${rev ?? "-"})` : value;
        return (
          <div style={{ paddingLeft: pad }}>
            <GlobalCell value={label} columnName={column.id} testRow={row.original} />
          </div>
        );
      },
      sortable: true,
    },
    {
      id: "revision",
      name: "Revizyon",
      Header: <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>Revizyon</div>,
      accessor: "revision",
      Cell: ({ row, value, column }: any) => (
        <GlobalCell value={value} columnName={column.id} testRow={row.original} />
      ),
    },
    {
      id: "publicationStatusText",
      name: "Yayın Durumu",
      Header: <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>Yayın Durumu</div>,
      accessor: "publicationStatusText",
      Cell: ({ row, value, column }: any) => {
        const status = row?.original?.publicationStatus;
        const text = value || (status === 1 ? "Taslak" : status === 2 ? "Yayınlandı" : status === 3 ? "Arşiv" : "-");
        return (
          <GlobalCell value={text} columnName={column.id} testRow={row.original} />
        );
      },
      sortable: true,
    },
    {
      id: "createdAt",
      name: "Oluşturulma Tarihi",
      Header: <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>Oluşturulma Tarihi</div>,
      accessor: "createdDate",


      Cell: ({ row, value, column }: any) => <GlobalCell value={value} columnName={column.id} />,
      sortable: true,
    },
    {
      id: "formCategoryText",
      name: "Kategori",
      Header: <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>Kategori</div>,
      accessor: "formCategoryText",
      Cell: ({ row, value, column }: any) => (
        <GlobalCell value={value} columnName={column.id} testRow={row.original} />
      ),
      sortable: true,
    },
    {
      id: "formPriorityText",
      name: "Öncelik",
      Header: <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>Öncelik</div>,
      accessor: "formPriorityText",
      Cell: ({ row, value, column }: any) => (
        <GlobalCell value={value} columnName={column.id} testRow={row.original} />
      ),
      sortable: true,
    },
    {
      accessor: "actions",
      Header: <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>İşlemler</div>,
      Cell: ({ row }: any) => (
        <MDBox mx={2}>
          <Icon sx={{ cursor: "pointer", marginRight:'2px'}} onClick={() => handleOpenQuestionBox(row.original.id)}>
            delete
          </Icon>
          <Icon
            sx={{ cursor: "pointer" }}
            onClick={() => handleData(row.original.id)}
            style={{ marginRight: "8px", color: "#28a745" }}
          >
            storage
          </Icon>
          <Icon
            sx={{ cursor: "pointer" }}
            onClick={() => handlePreview(row.original.id)}
            style={{ marginRight: "8px", color: "#28a745" }}
          >
            visibility
          </Icon>
          <Icon
            sx={{ cursor: "pointer" }}
            onClick={() => navigate(`/forms/designer/${row.original.id}`)}
            style={{ marginRight: "8px" }}
            hidden={!row.original.canEdit}
          >
            edit
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
                  variant="gradient"
                  color="info"
                  onClick={() => navigate(`/forms/designer`)}
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
                  Yeni Form
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
                Form Tasarımı
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#7b809a",
                }}
              >
                Formları görüntüleyin, oluşturun ve dahası
              </Typography>
            </MDBox>
          </ObjectPageTitle>
        }
      >
        <Grid xs={12} lg={6} sx={{ paddingLeft: "3px" }}>
          <Card>
            <MDBox>
              <MDBox height="655px">
                <DataTable
                  canSearch={true}
                  table={{
                    columns: columns,
                    rows: dataTableData,
                  }}

                />
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

export default ListForm;
