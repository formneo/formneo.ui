import React, { useState, useEffect } from "react";
import { IconButton, Tooltip } from "@mui/material";
import { CheckCircle, Cancel } from "@mui/icons-material";
import { Icon } from "@mui/material";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import DataTable from "examples/Tables/DataTable";
import ReactPaginate from "react-paginate";
import { useAlert } from "../hooks/useAlert";
import { useBusy } from "../hooks/useBusy";
import { useUser } from "../hooks/userName";
import { useNavigate } from "react-router-dom";
import getConfiguration from "confiuration";

// API imports
import {
  ApproveItemsApi,
  ApproverStatus,
  WorkFlowApi,
  WorkFlowContiuneApiDto,
} from "api/generated";
import GlobalCell from "../../../components/GlobalCell";

function WorkflowApprovalList() {
  const navigate = useNavigate();
  const [gridData, setGridData] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [itemOffset, setItemOffset] = useState(0);
  const [approveDataCount, setApproveDataCount] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState(ApproverStatus.NUMBER_0);
  const [statusText, setStatusText] = useState("Bekleyenler");

  // Hooks
  const { username } = useUser();
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();
  const configuration = getConfiguration();

  // Dialog states
  const [isQuestionMessageBoxOpen, setIsQuestionMessageBoxOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [objectType, setObjectType] = useState(null);
  const [description, setDescription] = useState("");
  const [numberManDay, setNumberManDay] = useState(0);
  const [aprHistoryOpen, setAprHistoryOpen] = useState(false);
  const [selectedAprHis, setSelectedAprHis] = useState(null);

  const tableData = {
    columns: [
      {
        Header: (
          <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>İşlemler</div>
        ),
        accessor: "actions",
        Cell: ({ row }) => (
          <MDBox mx={1} display="flex" alignItems="center">
            {statusText === "Bekleyenler" && (
              <>
                <Tooltip title="Onayla">
                  <IconButton
                    size="small"
                    style={{ marginRight: "8px" }}
                    onClick={() => handleOpenQuestionBox(row, "approve")}
                    color="success"
                  >
                    <CheckCircle />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Reddet">
                  <IconButton
                    size="small"
                    style={{ marginRight: "8px" }}
                    onClick={() => handleOpenQuestionBox(row, "reject")}
                    color="error"
                  >
                    <Cancel />
                  </IconButton>
                </Tooltip>
              </>
            )}

            <Tooltip title="Onay Geçmişi">
              <IconButton
                size="small"
                style={{ marginRight: "8px" }}
                onClick={() => {
                  setSelectedAprHis(row.original.workFlowItem.workflowHead.id);
                  setAprHistoryOpen(true);
                }}
              >
                <Icon>history</Icon>
              </IconButton>
            </Tooltip>

            <Tooltip title="Form Detayına Git">
              <IconButton
                size="small"
                style={{ marginRight: "8px" }}
                onClick={() => goToFormDetail(row.original.workFlowItem.workflowHead.id)}
                color="info"
              >
                <Icon>launch</Icon>
              </IconButton>
            </Tooltip>
          </MDBox>
        ),
      },
      {
        Header: <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>Onay No</div>,
        accessor: "workFlowItem.workflowHead.uniqNumber",
        Cell: ({ value }) => <GlobalCell value={value} />,
      },
      {
        Header: <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>Detay</div>,
        accessor: "workFlowItem.workflowHead.workFlowInfo",
        Cell: ({ value }) => <GlobalCell value={value} />,
      },
      {
        Header: (
          <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>Talep Eden</div>
        ),
        accessor: "workFlowItem.workflowHead.createUser",
        Cell: ({ value }) => <GlobalCell value={value} />,
      },
      {
        Header: (
          <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>Beklenen</div>
        ),
        accessor: "approveUserNameSurname",
        Cell: ({ value }) => <GlobalCell value={value} />,
      },
      {
        Header: (
          <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>
            İşlem Yapan Kullanıcı
          </div>
        ),
        accessor: "approvedUser_RuntimeNameSurname",
        Cell: ({ value }) => <GlobalCell value={value} />,
      },
      {
        Header: (
          <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>
            Onaya Gönderilen Tarih
          </div>
        ),
        accessor: "workFlowItem.workflowHead.createdDate",
        Cell: ({ value }) => <GlobalCell value={value} />,
      },
      {
        Header: (
          <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>İşlem Tarihi</div>
        ),
        accessor: "updatedDate",
        Cell: ({ value }) => <GlobalCell value={value} />,
      },
      ...(selectedStatus === ApproverStatus.NUMBER_1 || selectedStatus === ApproverStatus.NUMBER_2
        ? [
            {
              Header: (
                <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>
                  {selectedStatus === ApproverStatus.NUMBER_1
                    ? "Onay Açıklaması"
                    : "Red Açıklaması"}
                </div>
              ),
              accessor: "approvedUser_RuntimeNote",
              Cell: ({ value }) => <GlobalCell value={value} />,
            },
          ]
        : []),
    ],
    rows: gridData,
  };

  // Form Bazlı Onayları Getir
  // Form Bazlı Onayları Getir
  async function getFormBasedApproves(
    status,
    skip = 0,
    top = itemsPerPage,
    workFlowDefinationId = "",
    createUser = ""
  ) {
    if (status === ApproverStatus.NUMBER_0) {
      setStatusText("Bekleyenler");
    } else if (status === ApproverStatus.NUMBER_1) {
      setStatusText("Onaylananlar");
    } else if (status === ApproverStatus.NUMBER_2) {
      setStatusText("Reddedilenler");
    } else if (status === ApproverStatus.NUMBER_3) {
      setStatusText("Gönderdiklerim");
    }

    setSelectedStatus(status);
    dispatchBusy({ isBusy: true });

    try {
      let api = new ApproveItemsApi(configuration);

      // ✅ DOĞRU API ÇAĞRISI - Generate edilmiş method
      const result = await api.apiApproveItemsGetFormBasedApprovesGet(
        status,
        skip,
        top,
        workFlowDefinationId,
        createUser
      );

      if (result.data && result.data.approveItemsDtoList) {
        result.data.approveItemsDtoList.sort((a, b) => {
          let dateA = a.workFlowItem?.workflowHead?.createdDate
            ? new Date(a.workFlowItem.workflowHead.createdDate).getTime()
            : 0;
          let dateB = b.workFlowItem?.workflowHead?.createdDate
            ? new Date(b.workFlowItem.workflowHead.createdDate).getTime()
            : 0;
          return dateB - dateA;
        });

        setGridData(result.data.approveItemsDtoList);
      }

      setApproveDataCount(result.data?.count || 0);
      setPageCount(Math.ceil((result.data?.count || 0) / itemsPerPage));

      
      console.log(
        "✅ FormId kontrol:",
        result.data.approveItemsDtoList?.map((item) => ({
          id: item.id,
          formId: item.formId, // ← Bu alan gelecek!
        }))
      );
    } catch (error) {
      dispatchAlert({
        message: "Form bazlı onaylar yüklenirken hata oluştu",
        type: "error",
      });
      console.error("❌ Hata:", error);
    } finally {
      dispatchBusy({ isBusy: false });
    }
  }

  // Form detayına git
  async function goToFormDetail(workflowHeadId) {
    
    
    
    try {
      navigate(`/form-approval-detail/${workflowHeadId}`);
    } catch (error) {
      console.error("Form detayına gidilirken hata:", error);
      dispatchAlert({ message: "Detay sayfasına gidilemedi", type: "warning" });
    }
  }

  // Onay işlemi
  function onApprove(obj) {
    dispatchBusy({ isBusy: true });
    var workFlowApi = new WorkFlowApi(configuration);
    let contiuneDto = {};
    contiuneDto.workFlowItemId = obj.original.workflowItemId;
    contiuneDto.userName = username;
    contiuneDto.note = description;

    workFlowApi
      .apiWorkFlowContiunePost(contiuneDto)
      .then(async (response) => {
        await getFormBasedApproves(selectedStatus);
        dispatchAlert({ message: "Onay Başarılı", type: "success" });
      })
      .catch((error) => {
        dispatchAlert({ message: "Bir hata oluştu", type: "warning" });
      })
      .finally(() => {
        dispatchBusy({ isBusy: false });
      });
  }

  // Red işlemi
  function onReject(obj) {
    dispatchBusy({ isBusy: true });
    var workFlowApi = new WorkFlowApi(configuration);
    let contiuneDto = {};
    contiuneDto.workFlowItemId = obj.original.workflowItemId;
    contiuneDto.userName = username;
    contiuneDto.note = description;

    workFlowApi
      .apiWorkFlowContiunePost(contiuneDto)
      .then(async (response) => {
        await getFormBasedApproves(selectedStatus);
        dispatchAlert({ message: "Red Başarılı", type: "success" });
      })
      .catch((error) => {
        dispatchAlert({ message: "Bir hata oluştu", type: "warning" });
      })
      .finally(() => {
        dispatchBusy({ isBusy: false });
      });
  }

  const handleOpenQuestionBox = (obj, type) => {
    setSelectedRow(obj);
    setObjectType(type);
    setIsQuestionMessageBoxOpen(true);
    setDescription("");
  };

  const handleCloseQuestionBox = (action) => {
    setIsQuestionMessageBoxOpen(false);
    if (action === "Yes" && objectType === "approve") {
      try {
        onApprove(selectedRow);
      } catch (error) {
        dispatchAlert({ message: "Bir hata oluştu", type: "warning" });
      }
    }
    if (action === "Yes" && objectType === "reject") {
      try {
        onReject(selectedRow);
      } catch (error) {
        dispatchAlert({ message: "Bir hata oluştu", type: "warning" });
      }
    }
  };

  const handlePageClick = (event) => {
    const newOffset = (event.selected * itemsPerPage) % approveDataCount;
    getFormBasedApproves(selectedStatus, newOffset, itemsPerPage, "", "");
    
    setItemOffset(newOffset);
  };

  useEffect(() => {
    getFormBasedApproves(ApproverStatus.NUMBER_0);
    setSelectedStatus(ApproverStatus.NUMBER_0);
  }, []);

  useEffect(() => {
    setPageCount(Math.ceil(tableData.rows.length / itemsPerPage));
    if (selectedStatus !== undefined) {
      getFormBasedApproves(selectedStatus);
    }
  }, [itemsPerPage]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div style={{ display: "flex", height: "900px" }}>
        {/* Sol Menü */}
        <div style={{ width: "15%", borderRight: "1px solid #ddd", padding: "10px" }}>
          <h4 style={{ marginBottom: "20px", color: "#333" }}>İş Akışı Onay Kutusu</h4>
          <ul style={{ listStyle: "none", padding: 0 }}>
            <li
              style={{
                padding: "10px",
                cursor: "pointer",
                backgroundColor:
                  selectedStatus === ApproverStatus.NUMBER_3 ? "#e3f2fd" : "transparent",
                borderRadius: "4px",
                marginBottom: "5px",
              }}
              onClick={() => getFormBasedApproves(ApproverStatus.NUMBER_3, 0, itemsPerPage)}
            >
              📤 Gönderdiklerim
            </li>
            <li
              style={{
                padding: "10px",
                cursor: "pointer",
                backgroundColor:
                  selectedStatus === ApproverStatus.NUMBER_0 ? "#e3f2fd" : "transparent",
                borderRadius: "4px",
                marginBottom: "5px",
              }}
              onClick={() => getFormBasedApproves(ApproverStatus.NUMBER_0, 0, itemsPerPage)}
            >
              ⏳ Bekleyenler
            </li>
            <li
              style={{
                padding: "10px",
                cursor: "pointer",
                backgroundColor:
                  selectedStatus === ApproverStatus.NUMBER_1 ? "#e3f2fd" : "transparent",
                borderRadius: "4px",
                marginBottom: "5px",
              }}
              onClick={() => getFormBasedApproves(ApproverStatus.NUMBER_1, 0, itemsPerPage)}
            >
              ✅ Onaylananlar
            </li>
            <li
              style={{
                padding: "10px",
                cursor: "pointer",
                backgroundColor:
                  selectedStatus === ApproverStatus.NUMBER_2 ? "#e3f2fd" : "transparent",
                borderRadius: "4px",
                marginBottom: "5px",
              }}
              onClick={() => getFormBasedApproves(ApproverStatus.NUMBER_2, 0, itemsPerPage)}
            >
              ❌ Red
            </li>
          </ul>
        </div>

        {/* Sağ Tablo */}
        <div style={{ width: "85%", padding: "20px" }}>
          <h3 style={{ marginBottom: "20px", color: "#333" }}>İş akışı Onayları - {statusText}</h3>

          <DataTable
            table={tableData}
            setItemsPerPage={setItemsPerPage}
            totalRowCount={approveDataCount}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              position: "sticky",
              bottom: 0,
              backgroundColor: "white",
              zIndex: 10,
              padding: "10px 0",
            }}
          >
            <ReactPaginate
              previousLabel="Geri"
              nextLabel="İleri"
              pageClassName="page-item"
              pageLinkClassName="page-link"
              previousClassName="page-item"
              previousLinkClassName="page-link"
              nextClassName="page-item"
              nextLinkClassName="page-link"
              breakLabel="..."
              breakClassName="page-item"
              breakLinkClassName="page-link"
              pageCount={pageCount}
              marginPagesDisplayed={2}
              pageRangeDisplayed={5}
              onPageChange={handlePageClick}
              containerClassName="pagination"
              activeClassName="active"
            />
          </div>
        </div>
      </div>

      {/* Mock Message Box */}
      {isQuestionMessageBoxOpen && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "white",
            padding: "20px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            zIndex: 1000,
          }}
        >
          <h3>
            {objectType === "approve"
              ? "Onaylamak istediğinizden emin misiniz?"
              : "Reddetmek istediğinizden emin misiniz?"}
          </h3>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Açıklama (opsiyonel)"
            style={{ width: "100%", height: "60px", margin: "10px 0" }}
          />
          <div>
            <button onClick={() => handleCloseQuestionBox("Yes")} style={{ marginRight: "10px" }}>
              Evet
            </button>
            <button onClick={() => handleCloseQuestionBox("No")}>Hayır</button>
          </div>
        </div>
      )}

      {/* Mock History Dialog */}
      {aprHistoryOpen && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "white",
            padding: "20px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            zIndex: 1000,
          }}
        >
          <h3>Onay Geçmişi</h3>
          <p>Workflow ID: {selectedAprHis}</p>
          <button onClick={() => setAprHistoryOpen(false)}>Kapat</button>
        </div>
      )}
    </DashboardLayout>
  );
}

export default WorkflowApprovalList;
