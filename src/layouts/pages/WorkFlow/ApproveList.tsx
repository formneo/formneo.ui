//https://sdk.openui5.org/test-resources/sap/m/demokit/iconExplorer/webapp/index.html#/overview/SAP-icons/?tab=grid&icon=add&search=Add
import React, { useEffect, useRef, useState } from "react";
import logo from "./logo.svg";
import "@ui5/webcomponents-icons-tnt/dist/antenna.js";
import "@ui5/webcomponents-icons/dist/accept";
import "@ui5/webcomponents-icons/dist/pending";
import "@ui5/webcomponents-icons/dist/paper-plane";
import "@ui5/webcomponents-icons/dist/sys-cancel";
import "@ui5/webcomponents-icons/dist/save";
import "@ui5/webcomponents-icons/dist/delete";
import { IconButton, Tooltip } from "@mui/material";
import { CheckCircle, Cancel, History } from "@mui/icons-material"; // Onay ve reddetme ikonları
import "@ui5/webcomponents-icons/dist/detail-view";
import { useForm, Controller } from "react-hook-form";
import {
  AnalyticalTable,
  ListItemStandard,
  Avatar,
  Bar,
  Breadcrumbs,
  BreadcrumbsItem,
  Button,
  CheckBox,
  ComboBox,
  ComboBoxItem,
  DatePicker,
  Dialog,
  DynamicPage,
  DynamicPageHeader,
  DynamicPageTitle,
  FilterBar,
  FilterGroupItem,
  FlexBox,
  Form,
  FormGroup,
  FormItem,
  Input,
  Label,
  Link,
  List,
  MessageBoxAction,
  MessageBoxType,
  MessageStrip,
  ObjectPage,
  ObjectPageSection,
  ObjectPageSubSection,
  ObjectStatus,
  Select,
  ShellBar,
  ShellBarItem,
  SideNavigation,
  SideNavigationItem,
  SideNavigationSubItem,
  SplitterElement,
  SplitterLayout,
  Table,
  TableCell,
  TableRow,
  TextAlign,
  TextArea,
  ThemeProvider,
  Title,
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  VerticalAlign,
} from "@ui5/webcomponents-react";
import ApprovalIcon from "@mui/icons-material/Approval";
import {
  ApproveHeadInfo,
  ApproveItems,
  ApproveItemsApi,
  ApproveItemsDto,
  ApproverStatus,
  BudgetJobCodeRequestListDto,
  BudgetPeriodApi,
  BudgetPeriodInsertDto,
  BudgetPeriodListDto,
  BudgetPeriodUpdateDto,
  Configuration,
  UserApi,
  WorkFlowApi,
  WorkFlowContiuneApiDto,
  WorkFlowDefinationApi,
  WorkFlowDefinationListDto,
  WorkFlowItemApi,
} from "api/generated";
import { AxiosResponse } from "axios";
import { format, parse, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { useAlert } from "../hooks/useAlert";
import { useBusy } from "../hooks/useBusy";
import { FaLaughSquint } from "react-icons/fa";
import { useUser } from "../hooks/userName";
import { useNavigate } from "react-router-dom";
import ShowHistory from "./ShowHistory";

import { Icon } from "@mui/material";
import ReactPaginate from "react-paginate";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import getConfiguration from "confiuration";
import DataTable from "examples/Tables/DataTable";
import GlobalCell from "components/GlobalCell";
import MDBox from "components/MDBox";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MessageBox from "../Components/MessageBox";


import emails from "../../../approvers.json";
// setTheme("sap_horizon");
// setTheme("sap_belize");
function ApproveList() {
  const [historyOpen, sethistoryOpen] = useState(false);
  const navigate = useNavigate();
  const [listData, setListDto] = useState<ApproveHeadInfo>();
  const [gridData, setGridData] = useState<ApproveItemsDto[]>([]);
  const { username, setUsername } = useUser();
  const [rejectdialogOpen, setrejectdialogOpen] = useState(false);
  var [rejectText, setrejectText] = useState("");
  const [selectedInstance, setselectedInstance] = useState(null);
  const [selectedWorkFlowId, setselectedWorkFlowId] = useState("");
  const [pendingCount, setpendingCount] = useState(0);
  const [rejectCount, setrejectCount] = useState(0);
  const [approveCount, setapproveCount] = useState(0);

  const [selectedStatus, setselectedStatus] = useState<ApproverStatus>();

  const [UserDialogVisible, setUserDialogVisible] = useState(false);
  const [selectedRequestUser, setselectedRequestUser] = useState("");
  const [selectedRequestUserId, setselectedRequestUserId] = useState("");
  const [activeInput, setActiveInput] = useState<"request" | "waiting">("request");
  const [isQuestionMessageBoxOpen, setIsQuestionMessageBoxOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [aprHistoryOpen, setaprHistoryOpen] = useState(false);
  const [selectedTicket, setselectedTicket] = useState<string | null>(null);
  const [selectedAprHis, setselectedAprHis] = useState<string | null>(null);
  const [numberManDay, setNumberManDay] = useState<number>(0);

  var [canEditManDay, setCanEditManDay] = useState(false);
  const [lastnumberManDay, lastsetNumberManDay] = useState<number>(null);

  const [loginUserName, setLoginusername] = useState("");


  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  // const itemsPerPage = 7;
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [approveDataCount, setapproveDataCount] = useState(0);
  const [itemOffset, setItemOffset] = useState(0);
  const [pageCount, setpageCount] = useState(0);
  const [statusText, setstatusText] = useState("");
  const [processTypes, setProcessTypes] = useState<WorkFlowDefinationListDto[]>([]);
  const [selectedProcessType, setselectedProcessType] = useState("");
  const [selectedProcessTypeId, setselectedProcessTypeId] = useState("");
  const configuration = getConfiguration();
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [objectType, setObjectType] = useState<any>(null);
  const [description, setDescription] = useState("");
  const tableData = {
    columns: [
      {
        Header: (
          <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>İşlemler</div>
        ),
        accessor: "actions",
        Cell: ({ row }: any) => (
          <MDBox mx={1} display="flex" alignItems="center">
            <Tooltip title="Onayla" hidden={statusText !== "Bekleyenler"}>
              <IconButton
                size="small"
                style={{ marginRight: "8px" }}
                onClick={() => handleOpenQuestionBox(row, "approve")}
                color="success"
              >
                <CheckCircle />
              </IconButton>
            </Tooltip>

            <Tooltip title="Reddet" hidden={statusText !== "Bekleyenler"}>
              <IconButton
                size="small"
                style={{ marginRight: "8px" }}
                onClick={() => handleOpenQuestionBox(row, "reject")}
                color="error"
              >
                <Cancel />
              </IconButton>
            </Tooltip>
            <Tooltip title="Onay Geçmişi">
              <IconButton
                size="small"
                style={{ marginRight: "8px" }}
                onClick={() => {
                  setselectedAprHis(row.original.workFlowItem.workflowHead.id);
                  setaprHistoryOpen(true);
                }}
              >
                <Icon>history</Icon>
              </IconButton>
            </Tooltip>

            <Tooltip title="Talep Detayına Git">
              <IconButton
                size="small"
                style={{ marginRight: "8px" }}
                onClick={() => {
                  goTicketDetail(row.original.workFlowItem.workflowHead.id);
                }}
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

        Cell: ({ row, value, column }: any) => (
          <GlobalCell value={value} columnName={column.id} testRow={row.original} />
        ),
      },
      // {
      //     Header: (
      //         <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>Apr No</div>
      //     ),
      //     accessor: "shortWorkflowItemId",

      //     Cell: ({ row, value, column }: any) => (
      //         <GlobalCell value={value} columnName={column.id} testRow={row.original} />
      //     ),
      // },

      // {
      //     Header: (
      //         <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>Onay Numarası</div>
      //     ),
      //     accessor: "shortId",

      //     Cell: ({ row, value, column }: any) => (
      //         <GlobalCell value={value} columnName={column.id} testRow={row.original} />
      //     ),
      // },

      {
        Header: <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>Detay</div>,
        accessor: "workFlowItem.workflowHead.workFlowInfo",

        Cell: ({ row, value, column }: any) => (
          <GlobalCell value={value} columnName={column.id} testRow={row.original} />
        ),
      },

      {
        Header: (
          <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>Talep Eden</div>
        ),
        accessor: "workFlowItem.workflowHead.createUser",

        Cell: ({ row, value, column }: any) => (
          <GlobalCell value={value} columnName={column.id} testRow={row.original} />
        ),
      },

      {
        Header: (
          <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>Beklenen</div>
        ),
        accessor: "approveUserNameSurname",

        Cell: ({ row, value, column }: any) => (
          <GlobalCell value={value} columnName={column.id} testRow={row.original} />
        ),
      },

      {
        Header: (
          <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>
            İşlem Yapan Kullanıcı
          </div>
        ),
        accessor: "approvedUser_RuntimeNameSurname",

        Cell: ({ row, value, column }: any) => (
          <GlobalCell value={value} columnName={column.id} testRow={row.original} />
        ),
      },

      {
        Header: (
          <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>
            Onaya Gönderilen Tarih
          </div>
        ),
        accessor: "workFlowItem.workflowHead.createdDate",
        hAlign: "center",
        Cell: ({ row, value, column }: any) => (
          <GlobalCell value={value} columnName={column.id} testRow={row.original} />
        ),
      },

      {
        Header: (
          <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>İşlem Tarihi</div>
        ),
        accessor: "updatedDate",
        hAlign: "center",
        Cell: ({ row, value, column }: any) => (
          <GlobalCell value={value} columnName={column.id} testRow={row.original} />
        ),
      },

      ...(selectedStatus === 1 || selectedStatus === 2
        ? [
          {
            Header: (
              <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>
                {selectedStatus === 1 ? "Onay Açıklaması" : "Red Açıklaması"}
              </div>
            ),
            accessor: "approvedUser_RuntimeNote",
            hAlign: "center",
            Cell: ({ row, value, column }: any) => (
              <GlobalCell value={value} columnName={column.id} testRow={row.original} />
            ),
          },
        ]
        : []),

      // {
      //     Header: (
      //         <div style={{ fontSize: "16px", fontWeight: "bold", color: "black" }}>İşlemler</div>
      //     ),
      //     accessor: "actions",
      //     Cell: ({ row }: any) => (
      //         <MDBox mx={2}>
      //             <Icon
      //                 sx={{ cursor: "pointer" }}
      //                 onClick={() => navigate(`/workflowdetail/${row.original.id}`)}
      //                 style={{ marginRight: "8px" }}
      //             >
      //                 edit
      //             </Icon>

      //             <Icon sx={{ cursor: "pointer" }} onClick={() => onEdit(row.original.id)}>
      //                 delete
      //             </Icon>
      //         </MDBox>
      //     ),
      // },
    ],
    rows: gridData,
  };

  const handlePageClick = (event: any) => {
    const newOffset = (event.selected * itemsPerPage) % approveDataCount;
    getApproveDetail(
      selectedStatus!,
      newOffset,
      itemsPerPage,
      selectedProcessTypeId,
      selectedRequestUserId
    );
    console.log(`User requested page number ${event.selected}, which is offset ${newOffset}`);
    setItemOffset(newOffset);
  };

  useEffect(() => {
    setpageCount(Math.ceil(tableData.rows.length / itemsPerPage));
    getApproveDetail(selectedStatus!);
  }, [itemsPerPage]);

  async function getApproveList() {
    var api = new ApproveItemsApi(configuration);
    var data = await (await api.apiApproveItemsAllGet()).data;

    setListDto(data);
    setpendingCount(data.pendingCount!);
    setapproveCount(data.approveCount!);
    setrejectCount(data.rejectCount!);
    return data;
  }

  async function goTicketDetail(headId: any) {
    let api = new ApproveItemsApi(configuration);
    var res = await api.apiApproveItemsGetTicketIdGetTicketIdGet(headId);
     sessionStorage.setItem("ticketId", res.data);
    navigate("/tickets/detail/", {
      state: { ticketId: res.data, fromApr: true },
    });  
  }

  async function getApproveDetail(
    status: ApproverStatus,
    skip: number = 0,
    top: number = itemsPerPage,
    processType: string = "",
    reqUserId: string = ""
  ) {
    if (status == 0) {
      setstatusText("Bekleyenler");
    } else if (status == 1) {
      setstatusText("Onaylananlar");
    } else if (status == 2) {
      setstatusText("Reddedilenler");
    } else if (status == 3) {
      setstatusText("Gönderdiklerim");
    }

    setselectedStatus(status);
    dispatchBusy({ isBusy: true });

    let api = new ApproveItemsApi(configuration);

    console.log("status", status);
    console.log("offset:", skip, top);
    console.log("processtype:", processType);
    var result = await api.apiApproveItemsGetApprovesGet(status, skip, top, processType, reqUserId);

    // var result = listData!.items?.filter(e => e.approverStatus == type);
    result.data.approveItemsDtoList!.sort((a, b) => {
      let dateA = a.workFlowItem?.workflowHead?.createdDate
        ? new Date(a.workFlowItem?.workflowHead?.createdDate).getTime()
        : 0;
      let dateB = b.workFlowItem?.workflowHead?.createdDate
        ? new Date(b.workFlowItem?.workflowHead?.createdDate).getTime()
        : 0;
      return dateB - dateA;
    });
    setGridData(result.data.approveItemsDtoList!);
    console.log(">>>>", result.data);
    dispatchBusy({ isBusy: false });

    const endOffset = itemOffset + itemsPerPage;
    console.log(`Loading items from ${itemOffset} to ${endOffset}`);
    const currentItems = result.data.approveItemsDtoList!.slice(itemOffset, endOffset);
    setapproveDataCount(result.data.count!);
    setpageCount(Math.ceil(result.data.count! / itemsPerPage));
  }

  const handleSelection = (event: any) => {
    const selectedIndices = Object.keys(event.detail.selectedRowIds).filter(
      (index) => event.detail.selectedRowIds[index]
    );
    const selectedRowsData = selectedIndices.map((index) => gridData[parseInt(index)]);

    setSelectedRows(selectedRowsData);
  };

  function multipleApprove() {
    console.log("Selected Rows:", selectedRows);
    selectedRows.forEach((row) => {
      if (row) {
        dispatchBusy({ isBusy: true });
        var workFlowApi = new WorkFlowApi(configuration);
        let contiuneDto: WorkFlowContiuneApiDto = {};
        contiuneDto.workFlowItemId = row.workflowItemId;
        contiuneDto.userName = username;
        contiuneDto.note = "";

        workFlowApi
          .apiWorkFlowContiunePost(contiuneDto)
          .then(async (response) => {
            // await getApproveList().then(async response => {
            //     var result = response!.items?.filter(e => e.approverStatus == 0);
            //     setGridData(result!);
            // })
            await getApproveDetail(selectedStatus!);

            dispatchAlert({ message: "Onay Başarılı", type: MessageBoxType.Success });
          })
          .catch((error) => {
            dispatchAlert({ message: "Bir hata oluştu", type: MessageBoxType.Warning });
          })
          .finally(() => {
            dispatchBusy({ isBusy: false });
          });

        setSelectedRows([]);
      } else {
        console.error("hata", row);
      }
    });
  }

  function multipleReject() {
    console.log("Selected Rows:", selectedRows);
    selectedRows.forEach((row) => {
      if (row) {
        dispatchBusy({ isBusy: true });
        var workFlowApi = new WorkFlowApi(configuration);
        let contiuneDto: WorkFlowContiuneApiDto = {};
        contiuneDto.workFlowItemId = row.workflowItemId;
        contiuneDto.userName = username;
        contiuneDto.note = rejectText;

        workFlowApi
          .apiWorkFlowContiunePost(contiuneDto)
          .then(async (response) => {
            // await getApproveList().then(async response => {
            //     var result = response!.items?.filter(e => e.approverStatus == 0);
            //     setGridData(result!);
            // })
            await getApproveDetail(selectedStatus!);

            dispatchAlert({ message: "Red Başarılı", type: MessageBoxType.Success });
          })
          .catch((error) => {
            dispatchAlert({ message: "Bir hata oluştu", type: MessageBoxType.Warning });
          })
          .finally(() => {
            dispatchBusy({ isBusy: false });
          });

        getApproveList();

        setrejectdialogOpen(false);
        setrejectText("");
        setSelectedRows([]);
      } else {
        console.error("hata", row);
      }
    });
  }

  function onApprove(obj: any): void {
    dispatchBusy({ isBusy: true });
    var workFlowApi = new WorkFlowApi(configuration);
    let contiuneDto: WorkFlowContiuneApiDto = {};
    contiuneDto.workFlowItemId = obj.original.workflowItemId;

    contiuneDto.userName = username;
    contiuneDto.note = description;
    //contiuneDto.manDay = manDay;

    workFlowApi
      .apiWorkFlowContiunePost(contiuneDto)
      .then(async (response) => {
        // await getApproveList().then(async response => {
        //     var result = response!.items?.filter(e => e.approverStatus == 0);
        //     setGridData(result!);
        // })
        await getApproveDetail(selectedStatus!);

        dispatchAlert({ message: "Onay Başarılı", type: MessageBoxType.Success });
      })
      .catch((error) => {
        dispatchAlert({ message: "Bir hata oluştu", type: MessageBoxType.Warning });
      })
      .finally(() => {
        dispatchBusy({ isBusy: false });
      });
  }

  async function openDetail(obj: any) {
    let api = new ApproveItemsApi(configuration);
    let result = await api.apiApproveItemsGetOpenDetailGetOpenDetailGet(
      obj.cell.row.original.workFlowItem.workflowHead.id
    );

    window.open(result.data);
    // navigate(result.data.toString());
  }
  function openRejectDialog(obj: any) {
    setrejectdialogOpen(true);
    setselectedInstance(obj);
  }
  function handleTextChange(event: any) {
    const newText = event.target.value;
    setrejectText(newText);
  }
  function onReject(obj: any): void {
    dispatchBusy({ isBusy: true });
    var workFlowApi = new WorkFlowApi(configuration);
    let contiuneDto: WorkFlowContiuneApiDto = {};
    contiuneDto.workFlowItemId = obj.original.workflowItemId;
    contiuneDto.userName = username;
    contiuneDto.note = description;
    // contiuneDto.numberManDay = numberManDay.toString();

    workFlowApi
      .apiWorkFlowContiunePost(contiuneDto)
      .then(async (response) => {
        // await getApproveList().then(async response => {
        //     var result = response!.items?.filter(e => e.approverStatus == 0);
        //     setGridData(result!);
        // })
        await getApproveDetail(selectedStatus!);

        dispatchAlert({ message: "Red Başarılı", type: MessageBoxType.Success });
      })
      .catch((error) => {
        dispatchAlert({ message: "Bir hata oluştu", type: MessageBoxType.Warning });
      })
      .finally(() => {
        dispatchBusy({ isBusy: false });
      });

    getApproveList();

    setrejectdialogOpen(false);
    setrejectText("");
  }
  useEffect(() => {
    getProcessTypes();
    getApproveList();

    const defaultDate = formatDate(new Date());
    setSelectedDate(defaultDate);

    getApproveDetail(ApproverStatus.NUMBER_0);
    setselectedStatus(ApproverStatus.NUMBER_0);

    getLoginUser();
  }, []); //

  async function getLoginUser() {
    var conf = getConfiguration();
    var api = new UserApi(conf);
    var data = await api.apiUserGetLoginUserDetailGet();
    setLoginusername(data.data.email);
  }

  async function onProcessComboChange(event: any) {
    console.log(event);
    const selectedItem = event.detail.item;
    var selectedItemId = selectedItem.getAttribute("data-id");
    setselectedProcessType(selectedItem.text);
    setselectedProcessTypeId(selectedItemId);
    dispatchBusy({ isBusy: true });

    await getApproveDetail(selectedStatus!, 0, itemsPerPage, selectedItemId, selectedRequestUserId);

    dispatchBusy({ isBusy: false });
  }

  async function onApproveDatePickerChange(event: any) {
    dispatchBusy({ isBusy: true });
    console.log(event);
    const selectedDate = event.detail.value;
    const selectedDateObj = parse(selectedDate, "d MMM yyyy", new Date(), { locale: tr });

    var toShowData: ApproveItemsDto[] = [];
    await getApproveList().then(async (response) => {
      var result = response!.items;
      if (result) {
        result.forEach((item) => {
          const testDateObj = new Date(item.workFlowItem?.workflowHead?.createdDate!);
          if (
            selectedDateObj.getFullYear() === testDateObj.getFullYear() &&
            selectedDateObj.getMonth() === testDateObj.getMonth() &&
            selectedDateObj.getDate() === testDateObj.getDate()
          ) {
            toShowData.push(item);
          }
        });
      }
    });
    setGridData(toShowData);
    dispatchBusy({ isBusy: false });
  }
  async function onProcessDatePickerChange(event: any) {
    dispatchBusy({ isBusy: true });
    console.log(event);
    const selectedDate = event.detail.value;
    const selectedDateObj = parse(selectedDate, "d MMM yyyy", new Date(), { locale: tr });

    var toShowData: ApproveItemsDto[] = [];
    await getApproveList().then(async (response) => {
      var result = response!.items;
      if (result) {
        result.forEach((item) => {
          const testDateObj = new Date(item.updatedDate!);
          if (
            selectedDateObj.getFullYear() === testDateObj.getFullYear() &&
            selectedDateObj.getMonth() === testDateObj.getMonth() &&
            selectedDateObj.getDate() === testDateObj.getDate()
          ) {
            toShowData.push(item);
          }
        });
      }
    });
    setGridData(toShowData);
    dispatchBusy({ isBusy: false });
  }
  // async function onRequestingUserChange(event: any) {

  // }

  async function getProcessTypes() {
    var api = new WorkFlowDefinationApi(configuration);
    var result = api
      .apiWorkFlowDefinationGet()
      .then((response: AxiosResponse<WorkFlowDefinationListDto[]>) => {
        console.log("WorkFlowDefinationApi", response.data);
        setProcessTypes(response.data);
      })
      .catch((error) => { })
      .finally(() => { });
  }

  const onRequestingUserChange = async (e: any) => {
    console.log("onRequestingUserChange", e);
    setselectedRequestUser(e.defaultFullName);
    setselectedRequestUserId(e.userId);
    setUserDialogVisible(false);

    await getApproveDetail(selectedStatus!, 0, itemsPerPage, selectedProcessTypeId, e.userId);
  };

  const handleOpenQuestionBox = (obj: any, type: string) => {
    setSelectedRow(obj);
    console.log("satır>>", obj);
    setObjectType(type);
    setIsQuestionMessageBoxOpen(true);
    setDescription("");

    getLastManDay(obj.original.workFlowItem.workflowHead.id);
    var isExist = emails.emails.find(e => e == loginUserName);
    if (isExist != null) {
      setCanEditManDay(false);
    }
    else {
      setCanEditManDay(true);
    }

  };

  async function getLastManDay(workflowid: string) {
    var api = new WorkFlowItemApi(configuration);
    console.log("workflowid", workflowid)
    var data = await api.apiWorkFlowItemGetApproveItemsWorkFlowHeadIdGet(workflowid);
    console.log("getLastManDay", data.data);
    var haveManDay: any[] = [];

    data.data.forEach(item => {
      var temp = item.approveItems[0];
      if (temp.approvedUser_RuntimeNumberManDay != null) {
        haveManDay.push(temp);
      }
    });

    if (haveManDay.length > 0) {
      haveManDay.sort((a: any, b: any) => b.createdDate - a.createdDate);
      console.log("haveManDay", haveManDay);
      lastsetNumberManDay(haveManDay[0].approvedUser_RuntimeNumberManDay);
      setNumberManDay(haveManDay[0].approvedUser_RuntimeNumberManDay)
    }


  }

  useEffect(() => {
    console.log("description", description);
  }, [description]);

  const handleCloseQuestionBox = (action: string) => {
    setIsQuestionMessageBoxOpen(false);
    if (action === "Yes" && objectType === "approve") {
      try {
        onApprove(selectedRow);
      } catch (error) {
        dispatchAlert({ message: "Bir hata oluştu", type: MessageBoxType.Warning });
      }
    }
    if (action === "Yes" && objectType === "reject") {
      try {
        onReject(selectedRow);
      } catch (error) {
        dispatchAlert({ message: "Bir hata oluştu", type: MessageBoxType.Warning });
      }
    }
  };

  return (
    <>
      <DashboardLayout>
        <DashboardNavbar />
        <SplitterLayout
          style={{
            height: "900px",
            width: "100%",
          }}
        >
          <SplitterElement style={{ flex: "0 0 13%" }}>
            <FlexBox
              alignItems="Center"
              justifyContent="Center"
              style={{
                height: "100%",
                width: "100%",
              }}
            >
              <List
                style={{ width: "100%", height: "100%" }}
                growing="None"
                headerText="Onay Kutusu"
                onItemClick={() => { }}
                onItemClose={() => { }}
                onItemDelete={() => { }}
                onItemToggle={() => { }}
                onLoadMore={() => { }}
                onSelectionChange={() => { }}
                separators="All"
              >
                <ListItemStandard
                  icon="paper-plane"
                  onClick={() =>
                    getApproveDetail(
                      ApproverStatus.NUMBER_3,
                      0,
                      itemsPerPage,
                      selectedProcessTypeId!,
                      selectedRequestUserId!
                    )
                  }
                >
                  Gönderdiklerim
                </ListItemStandard>
                <ListItemStandard
                  icon="pending"
                  onClick={() =>
                    getApproveDetail(
                      ApproverStatus.NUMBER_0,
                      0,
                      itemsPerPage,
                      selectedProcessTypeId!,
                      selectedRequestUserId!
                    )
                  }
                >
                  Bekleyenler
                </ListItemStandard>
                <ListItemStandard
                  icon="accept"
                  onClick={() =>
                    getApproveDetail(
                      ApproverStatus.NUMBER_1,
                      0,
                      itemsPerPage,
                      selectedProcessTypeId!,
                      selectedRequestUserId!
                    )
                  }
                >
                  Onaylananlar
                </ListItemStandard>
                <ListItemStandard
                  icon="decline"
                  onClick={() =>
                    getApproveDetail(
                      ApproverStatus.NUMBER_2,
                      0,
                      itemsPerPage,
                      selectedProcessTypeId!,
                      selectedRequestUserId!
                    )
                  }
                >
                  Red
                </ListItemStandard>
              </List>
            </FlexBox>
          </SplitterElement>

          <SplitterElement style={{ flex: "0 0 87%" }}>
            <FlexBox
              alignItems="Stretch"
              justifyContent="Start"
              direction="Column"
              style={{
                height: "100%",
                width: "100%",
              }}
            >
              {/* FilterBar burada üstte yer alacak */}

              {/* DataTable ikinci alanı kaplayacak şekilde */}
              <DataTable table={tableData} setItemsPerPage={setItemsPerPage} totalRowCount={approveDataCount} />

              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'sticky',
                bottom: 0,
                backgroundColor: 'white',
                zIndex: 10,
                padding: '10px 0'
              }}>
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

            </FlexBox>
          </SplitterElement>
        </SplitterLayout>

        {Object.keys(selectedRows).length > 0 && (
          <footer>
            <Toolbar>
              <ToolbarSpacer />
              <Button tooltip="Onayla" icon="accept" design="Positive" onClick={multipleApprove}>
                Onayla
              </Button>
              <Button
                tooltip="Reddet"
                color="red"
                design="Negative"
                icon="sys-cancel"
                onClick={multipleReject}
              >
                Reddet
              </Button>
            </Toolbar>
          </footer>
        )}
      </DashboardLayout>
      <Dialog
        open={rejectdialogOpen}
        style={{ width: "40%", height: "40%" }}
        footer={
          <Bar
            endContent={[
              <Button key="1" onClick={() => onReject(selectedInstance)}>
                Gönder
              </Button>,
              <Button key="2" onClick={() => setrejectdialogOpen(false)}>
                İptal
              </Button>,
            ]}
          />
        }
      >
        {/* <Label key="1" children='Red sebebi giriniz' /> */}
        {/* <TextArea key="reason" onChange={handleTextChange} value={rejectText} /> */}
      </Dialog>

      {/* <UserSelectDialog
                open={UserDialogVisible}
                onClose={() => setUserDialogVisible(false)}
                onConfirm={onRequestingUserChange}
            /> */}

      {aprHistoryOpen && (
        <ShowHistory
          approveId={selectedAprHis}
          open={aprHistoryOpen}
          onClose={() => setaprHistoryOpen(false)}
        />
      )}


      <MessageBox
        isQuestionmessageBoxOpen={isQuestionMessageBoxOpen}
        handleCloseQuestionBox={handleCloseQuestionBox}
        type={objectType}
        description={description}
        setDescription={setDescription}
        numberManDay={numberManDay}
        setNumberManDay={setNumberManDay}
        canEditManDay={canEditManDay}
        lastnumberManDay={lastnumberManDay}
      />
    </>
  );
}
export default ApproveList;
