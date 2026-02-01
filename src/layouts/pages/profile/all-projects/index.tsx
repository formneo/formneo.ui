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

import React, { useEffect, useState } from "react";

import VisibilityIcon from "@mui/icons-material/Visibility";
import index0png from "assets/images/sapfiori.jpg";

import index2png from "assets/images/btplogo.jpg";

// @mui material components
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

// Material Dashboard 2 PRO React TS examples components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// Project page components
import Header from "layouts/pages/profile/components/Header";

import {
  Modal,
  Box,
  Typography,
  Select,
  InputLabel,
  FormControl,
  SelectChangeEvent,
  Autocomplete,
  CardContent,
  Card,
  CardHeader,
  IconButton,
  Divider,
} from "@mui/material";
import MDInput from "components/MDInput";
import getConfiguration from "confiuration";
import { ProjectsApi, UserApi, UserAppDto } from "api/generated";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useMaterialUIController } from "context";
import MDAvatar from "components/MDAvatar";
import { Delete, Edit } from "@mui/icons-material";
import { name } from "@azure/msal-browser/dist/packageMetadata";
import { number } from "yup";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { MessageBoxType } from "@ui5/webcomponents-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export interface Category {
  id: string;
  categoryName?: string;
  description?: string;
  name?: string;
  userId?: string;
  categoryId?: number;
}

interface typeOfCategory {
  description: string;
  name: string;
}

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 440,

  p: 4,
};

function AllProjects(): JSX.Element {
  // ComplexProjectCard dropdown menu state
  const [controller, dispatch] = useMaterialUIController();
  const {
    miniSidenav,
    direction,
    layout,
    openConfigurator,
    sidenavColor,
    transparentSidenav,
    whiteSidenav,
    darkMode,
  } = controller;
  const [slackBotMenu, setSlackBotMenu] = useState(null);
  const [isEditModalOpen, setisEditModalOpen] = useState(false); // edit modal
  const [isModalOpen, setIsModalOpen] = useState(false); // modali kontrol için State
  const [isDeleteModalOpen, setisDeleteModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState("");
  const [resultData, setResultData] = useState<any>([]);
  const dispatchBusy = useBusy();
  const [inputName, setInputName] = useState("");
  const [inputDescription, setInputDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<typeOfCategory>();
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState("");
  const [currentName, setCurrentName] = useState("");
  const [currentDescription, setCurrentDescription] = useState("");
  const [currentCategory, setCurrentCategory] = useState("");
  const [currentId, setCurrentId] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [nameofCategories, setNameofCategories] = useState([]);
  const [ProfileData, setProfileData] = useState<UserAppDto>({});

  const [data, setData] = useState<any>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const selectedUser = location.state?.user;
  const dispatchAlert = useAlert(); // Alert hooks
  const idNav = useParams();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      if (selectedUser) {
        const conf = getConfiguration();
        const api = new ProjectsApi(conf);
        try {
          const response = await api.apiProjectsGetByUserIdProjectListGet(selectedUser.id);
          const dataAPI = response.data;
          
          setData(dataAPI as any);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      } else {
        setData(resultData.slice(0, 3));
      }
    };

    fetchData();
  }, [selectedUser]);

  const CardTemplate: React.FC<Category> = ({ name, description, id, userId, categoryName }) => {
    let indexOfCategory = nameofCategories.findIndex(
      (category) => category.description === categoryName
    );
    let image: string;
    if (indexOfCategory === 0) image = index0png;
    else if (indexOfCategory === 1) image = index2png;

    const imageWidth = () => {
      switch (image) {
        case index0png:
          return "150px";

        case index2png:
          return "80px";
        default:
          return "60px"; // Varsayılan değer
      }
    };

    const imageHeight = () => {
      switch (image) {
        case index0png:
          return "82px";        case index2png:
          return "80px";

        default:
          return "60px"; // Varsayılan değer
      }
    };

    return (
      <Card
        style={{ boxShadow: "-2px -2px 2px rgba(0, 0, 0, 0.1), 2px 2px 2px rgba(0, 0, 0, 0.1)" }}
      >
        <CardHeader
          avatar={
            <MDAvatar
              style={{ borderRadius: "20px", width: "80px", height: "80px" }}
              size="xl"
              bgColor="transparent"
            >
              <img
                src={image}
                alt="categoryIcons"
                style={{ width: imageWidth(), height: imageHeight() }}
              />
            </MDAvatar>
          }
          title={<MDTypography variant="h5">{name}</MDTypography>}
          subheader={
            <MDTypography
              style={{ fontSize: "14px" }}
              variant="button"
              fontWeight="regular"
              color="text"
            >
              {categoryName}
            </MDTypography>
          }
          action={
            <MDBox>
              <VisibilityIcon
                style={{ color: "#757575", height: "30px", width: "30px", marginRight: "10px" }}
                sx={{ cursor: "pointer" }}
                onClick={() => navigate(`/profile/all-projects/edit-project/${id}?isOnlyRead=true`)}
              ></VisibilityIcon>
              {selectedUser ? null : (
                <>
                  <IconButton onClick={() => navigate(`/profile/all-projects/edit-project/${id}`)}>
                    <Edit />
                  </IconButton>
                  <IconButton
                    onClick={() =>
                      handleDelete(name, description, categoryName, id, userId, indexOfCategory)
                    }
                  >
                    <Delete />
                  </IconButton>
                </>
              )}
            </MDBox>
          }
        ></CardHeader>
        <CardContent>
          <Divider
            sx={{ opacity: 10 }}
            textAlign="center"
            style={{
              color: "black",
              fontSize: "20px",
              width: "115%",
              marginLeft: "-30px",
              marginTop: "-20px",
            }}
          ></Divider>
          <MDBox
            mt={3}
            style={{
              marginBottom: "5px",
              paddingLeft: "5px",
              minHeight: "100px",
              maxHeight: "100px",
              overflowY: "auto",
            }}
          >
            <MDTypography fontSize="md" variant="body2" fontWeight="regular" color="text">
              {description}
            </MDTypography>
          </MDBox>
        </CardContent>
      </Card>
    );
  };

  const fetchDetail = async () => {
    dispatchBusy({ isBusy: true });
    var conf = getConfiguration();
    var api = new UserApi(conf);
    var data = await api.apiUserGetLoginUserDetailGet();
    setProfileData(data.data);
    dispatchBusy({ isBusy: false });
  };

  useEffect(() => {
    fetchDetail();
  }, []);

  const handleDeleteCloseModal = () => {
    setisDeleteModalOpen(false);
  };

  const handleDelete = async (
    name: string,
    description: string,
    categoryName: string,
    id: string,
    userId: string,
    categoryId: number
  ) => {
    
    setCurrentId(id);

    setisDeleteModalOpen(true);
  };

  const getCategoryList = async () => {
    dispatchBusy({ isBusy: true });
    var conf = getConfiguration(); // conf bağla
    var api = new ProjectsApi(conf); // apiye conf ayarını bağla
    try {
      const dataOfCategories = await api.apiProjectsGetCategoryGet(); // Verileri al
      setNameofCategories(dataOfCategories.data as any);

      const data = await api.apiProjectsGetUserProjectGet(); // Verileri al
      setResultData(data.data); // Durum değişkenini güncelle

      
    } catch (error) {
      console.error("Hata :", error);
    }

    dispatchBusy({ isBusy: false });
  };

  const deleteProjectById = async (Id: string) => {
    var conf = getConfiguration();
    var api = new ProjectsApi(conf);

    try {
      await api.apiProjectsDelete(Id);
      dispatchAlert({
        message: t("ns1:ProfilePage.AllProjects.ProjeSilindi"),
        type: MessageBoxType.Success,
      });
      await getCategoryList();
      setisDeleteModalOpen(false);
    } catch (error) {
      console.error("Hata :", error);
    }
  };

  useEffect(() => {
    getCategoryList();
  }, []);

  const deleteModal = () => {
    return (
      <DashboardLayout>
        <Modal open={isDeleteModalOpen} onClose={handleDeleteCloseModal}>
          <MDBox>
            <MDBox
              variant="gradient"
              style={{
                backgroundColor: "#1383ce",
                position: "absolute",
                top: "40%",
                left: "49.2%",
                transform: "translate(-50%, -50%)",
                width: 400,
                borderRadius: "20px",
              }}
              sx={style}
              borderRadius="lg"
              zIndex={2}
              coloredShadow="dark"
              mx={2}
              mt={-3}
              p={3}
              mb={1}
              textAlign="center"
            >
              <MDBox mt={2} />
              <MDTypography variant="h4" fontWeight="medium" color="white">
                {t("ns1:ProfilePage.AllProjects.SilmeOnay")}
              </MDTypography>
              <MDBox mt={2} />
            </MDBox>
            <MDBox
              sx={style}
              style={{ backgroundColor: darkMode ? "#1a2035" : "white" }}
              textAlign="center"
              borderRadius="16px"
            >
              <MDBox mt={12}>
                <MDBox mx={6} mb={6} lineHeight={0} display="flex" alignItems="baseline">
                  <MDTypography component="span" variant="h4" fontWeight="regular" color="text">
                    {t("ns1:ProfilePage.AllProjects.Uyari")}:&nbsp;&nbsp;
                    <MDTypography component="span" variant="h5" fontWeight="regular" color="text">
                      {t("ns1:ProfilePage.AllProjects.GeriAlinamaz")}
                    </MDTypography>
                  </MDTypography>
                </MDBox>
                <MDBox display="flex" alignItems="end" marginLeft={30} marginRight={24}>
                  <MDButton onClick={handleDeleteCloseModal} variant="contained" color="error">
                    {t("ns1:ProfilePage.AllProjects.Iptal")}
                  </MDButton>

                  <MDButton
                    onClick={() => deleteProjectById(currentId)}
                    variant="contained"
                    color="success"
                    style={{ marginLeft: "10px" }}
                  >
                    {t("ns1:ProfilePage.AllProjects.Evet")}
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
    <DashboardLayout>
      {deleteModal()}

      <MDBox width="calc(100% - 48px)" position="absolute" top="1.75rem">
        <DashboardNavbar light absolute />
      </MDBox>

      <Header headerControl={true} profileData={selectedUser ? selectedUser : ProfileData} />

      <MDBox mt={5} mb={3} mx={0.5}>
        <MDBox p={3}>
          <MDBox>
            <Grid container alignItems="center">
              <Grid item xs={12} md={7}>
                <MDBox mt={3}>
                  <MDTypography variant="h5">
                    {t("ns1:ProfilePage.AllProjects.Projelerim")}
                  </MDTypography>
                </MDBox>
                <MDBox mb={2} mt={2}>
                  {selectedUser ? (
                    <MDTypography variant="body2" color="text">
                      {t("ns1:ProfilePage.AllProjects.KullaniciProjeler")}
                      {selectedUser?.firstName}
                      {" "}
                      {selectedUser?.lastName}
                      {t("ns1:ProfilePage.AllProjects.KullaniciProjeler2")}
                    </MDTypography>
                  ) : (
                    <MDTypography variant="body2" color="text">
                      {t("ns1:ProfilePage.AllProjects.ProjeYonetimi")}
                    </MDTypography>
                  )}
                </MDBox>
              </Grid>
              {!selectedUser ? (
                <Grid item xs={12} md={5} sx={{ textAlign: "right" }}>
                  <MDButton
                    onClick={() => navigate(`/profile/all-projects/edit-project/`)}
                    variant="gradient"
                    color="info"
                  >
                    <Icon>add</Icon>&nbsp; {t("ns1:ProfilePage.AllProjects.ProjeOlustur")}
                  </MDButton>
                </Grid>
              ) : null}
            </Grid>
          </MDBox>
          <MDBox mt={5}>
            <Grid container spacing={3}>
              {selectedUser
                ? data.map((item: Category) => (
                    <Grid item xs={12} md={6} lg={4} key={item.id}>
                      <MDBox mb={1.5} mt={1.5}>
                        <CardTemplate
                          key={item.id}
                          name={item.name}
                          description={item.description}
                          id={item.id}
                          categoryName={item.categoryName}
                          userId={item.userId}
                        />
                      </MDBox>
                    </Grid>
                  ))
                : resultData.map((item: Category) => (
                    <Grid item xs={12} md={6} lg={4} key={item.id}>
                      <MDBox mb={1.5} mt={1.5}>
                        <CardTemplate
                          key={item.id}
                          name={item.name}
                          description={item.description}
                          id={item.id}
                          categoryName={item.categoryName}
                          userId={item.userId}
                        />
                      </MDBox>
                    </Grid>
                  ))}
            </Grid>
          </MDBox>
        </MDBox>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default AllProjects;
