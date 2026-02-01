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
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";

// @mui icons
import FacebookIcon from "@mui/icons-material/Facebook";
import TwitterIcon from "@mui/icons-material/Twitter";
import InstagramIcon from "@mui/icons-material/Instagram";
import LinkedInIcon from "@mui/icons-material/LinkedIn";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// Material Dashboard 2 PRO React TS examples components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import ProfileInfoCard from "examples/Cards/InfoCards/ProfileInfoCard";
import ProfilesList from "examples/Lists/ProfilesList";
import DefaultProjectCard from "examples/Cards/ProjectCards/DefaultProjectCard";

// Overview page components
import Header from "layouts/pages/profile/components/Header";
import PlatformSettings from "layouts/pages/profile/profile-overview/components/PlatformSettings";

// Data
import profilesListData from "layouts/pages/profile/profile-overview/data/profilesListData";

// Images
import homeDecor1 from "assets/images/home-decor-1.jpg";
import homeDecor2 from "assets/images/home-decor-2.jpg";
import homeDecor3 from "assets/images/home-decor-3.jpg";
import homeDecor4 from "assets/images/home-decor-4.jpeg";
import team1 from "assets/images/team-1.jpg";
import team2 from "assets/images/team-2.jpg";
import team3 from "assets/images/team-3.jpg";
import team4 from "assets/images/team-4.jpg";
import { useEffect, useState } from "react";
import getConfiguration from "confiuration";
import { ProjectsApi, UserApi, UserAppDto } from "api/generated";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { Card, CardContent, CardHeader, Icon } from "@mui/material";
import MDAvatar from "components/MDAvatar";
import { Category } from "../all-projects";
import CardSettings from "./components/CardSettings";
import MDButton from "components/MDButton";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface CategorySelected {
  id: string;
  categoryName?: string;
  description?: string;
  name?: string;
  userId?: string;
  categoryId?: number;
}

function Overview(): JSX.Element {
  const [profileData, setProfileData] = useState<UserAppDto>({});

  const [resultData, setresultData] = useState<any>([]);
  const [selectedUser, setSelectedUser] = useState<UserAppDto>(null);
  const [data, setData] = useState<any>([]);
  const navigate = useNavigate();
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
  }, [selectedUser, resultData]);

  const handleUserSelect = (user: UserAppDto) => {
    setSelectedUser(user);
  };

  const handleLetEmptyUserSelect = () => {
    setSelectedUser(null);
  };

  const GetUserProject = async () => {
    dispatchBusy({ isBusy: true });
    const config = await getConfiguration();
    var api = new ProjectsApi(config);
    var data = await api.apiProjectsGetUserProjectGet();

    setresultData(data.data);
    
    dispatchBusy({ isBusy: false });
  };

  useEffect(() => {
    // A function that sets the orientation state of the tabs.
    GetUserProject();
    fetchDetail();
  }, []);

  const dispatchBusy = useBusy();
  const fetchDetail = async () => {
    dispatchBusy({ isBusy: true });
    var conf = getConfiguration();
    var api = new UserApi(conf);
    var data = await api.apiUserGetLoginUserDetailGet();
    
    setProfileData(data.data);
    dispatchBusy({ isBusy: false });
  };

  useEffect(() => {
    
  }, [selectedUser]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox mb={2} />
      <Header
        selectedUser={handleLetEmptyUserSelect}
        profileData={selectedUser ? selectedUser : profileData}
        booleanControl={selectedUser ? true : false}
      >
        <MDBox mt={5} mb={3}>
          <Grid container spacing={1}>
            <Grid item xs={12} md={4} xl={4}>
              <ProfileInfoCard
                title={t("ns1:ProfilePage.ProfileOverview.KullaniciBilgileri")}
                info={{
                  fullName: selectedUser
                    ? `${selectedUser.firstName} ${selectedUser.lastName}`
                    : `${profileData.firstName} ${profileData.lastName}`,
                  email: selectedUser ? selectedUser.email : profileData.email,
                }}
                social={[
                  {
                    link: selectedUser ? selectedUser.linkedinUrl : profileData.linkedinUrl,
                    icon: <LinkedInIcon />,
                    color: "instagram",
                  },
                ]}
                {...(selectedUser ? {} : {})}
                shadow={false}
              />
            </Grid>
            <Grid mt={1.8} item xs={12} md={4} lg={4}>
              <MDBox style={{ justifyContent: "center", display: "flex" }} mb={3.3}>
                <MDTypography variant="h4" fontWeight="medium">
                  {t("ns1:ProfilePage.ProfileOverview.Hakkinda")}
                </MDTypography>
              </MDBox>
              <MDBox mb={2}>
                <Divider sx={{ opacity: 1 }} />
              </MDBox>
              <MDTypography variant="button" fontWeight="regular">
                {selectedUser ? selectedUser.profileInfo : profileData.profileInfo}
              </MDTypography>
            </Grid>
            <Grid item xs={12} md={4} xl={4}>
              <ProfilesList
                onUserSelect={handleUserSelect}
                initialUserData={profileData}
                title={t("ns1:ProfilePage.ProfileOverview.TumProfiller")}
                shadow={false}
              />
            </Grid>
          </Grid>
        </MDBox>
        <MDBox pt={2} px={2} lineHeight={1.25}>
          <Divider sx={{ opacity: 10 }} textAlign="center"></Divider>
          <MDTypography variant="h6" fontWeight="medium">
            {t("ns1:ProfilePage.ProfileOverview.Projelerim")}
          </MDTypography>
          <MDBox mb={2} mt={2} style={{ maxWidth: "1000px" }}>
            {selectedUser ? (
              <MDTypography variant="body2" color="text">
                {t("ns1:ProfilePage.ProfileOverview.KullaniciProjeler")}
                {selectedUser.firstName}
                {" "}
                {selectedUser.lastName}
                {t("ns1:ProfilePage.ProfileOverview.KullaniciProjeler2")}
              </MDTypography>
            ) : (
              <MDTypography variant="body2" color="text">
                {t("ns1:ProfilePage.ProfileOverview.ProjeGoruntuleme")}
              </MDTypography>
            )}
          </MDBox>
          {selectedUser ? (
            <MDBox mt={-8} mb={5}>
              <Grid container justifyContent="flex-end" mt={-3}>
                <Grid item>
                  <MDButton
                    onClick={() =>
                      navigate(`/profile/all-projects/${selectedUser.id}`, {
                        state: { user: selectedUser },
                      })
                    }
                    variant="gradient"
                    color="info"
                    size="small"
                  >
                    {t("ns1:ProfilePage.ProfileOverview.TumProjeleriGoruntule")}
                  </MDButton>
                </Grid>
              </Grid>
            </MDBox>
          ) : null}
        </MDBox>

        <MDBox mt={5}>
          <Grid container spacing={3}>
            {data.slice(0, 3).map((item: Category) => (
              <Grid item xs={12} md={6} lg={4} key={item.id}>
                <MDBox mb={1.5} mt={1.5}>
                  <CardSettings
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
      </Header>
      <Footer />
    </DashboardLayout>
  );
}

export default Overview;
