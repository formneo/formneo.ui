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

// react-routers components
import { Link } from "react-router-dom";
import testPhoto from "assets/images/profile-circle-icon-512x512-zxne30hp.png";

// @mui material components
import Card from "@mui/material/Card";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDAvatar from "components/MDAvatar";
import MDButton from "components/MDButton";
import { ProjectsApi, UserApi, UserAppDto } from "api/generated";
import { get } from "https";
import UserViewModal from "layouts/pages/profile/profile-overview/components/UserViewModal";
import { useEffect, useState } from "react";
import MDInput from "components/MDInput";
import { Autocomplete, Divider } from "@mui/material";
import MDSnackbar from "components/MDSnackbar";
import getConfiguration from "confiuration";
import { useBusy } from "layouts/pages/hooks/useBusy";

// Declaring props types for ProfilesList
interface Props {
  title: string;
  shadow?: boolean;
  allprofiles?: UserAppDto[];
  onUserSelect?: (user: UserAppDto) => void;
  initialUserData?: UserAppDto;
}

interface ModalProps {
  id: string;
  firstName: string;
}

function ProfilesList({
  title,
  shadow,

  onUserSelect,
  initialUserData,
}: Props): JSX.Element {
  const [show, setShow] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAppDto>({} as UserAppDto);
  const toggleSnackBar = () => setShow(!show);
  const [isMySelf, setIsMySelf] = useState(false);
  const [searchByName, setSearchByName] = useState<UserAppDto[]>([]);
  const dispatchBusy = useBusy();
  const [test, settest] = useState(false);

  const handleSearchByName = async (value: string) => {
    if (value === "") {
      setSearchByName([]);
    } else {
      dispatchBusy({ isBusy: true });
      settest(true);
      var conf = getConfiguration();
      var api = new UserApi(conf);
      var data = await api.apiUserGetAllUsersWithNameNameGet(value);
      var pureData = data.data;
      setSearchByName(pureData);
      settest(false);
      dispatchBusy({ isBusy: false });
    }
  };

  const handleUserSelect = (user: UserAppDto) => {
    if (onUserSelect) {
      onUserSelect(user);
      setCurrentUser(user);
    }
    toggleSnackBar();
  };

  // 5 saniye sonra snackbar'ı kapat
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        setShow(false);
      }, 3000); // 3 saniye

      return () => clearTimeout(timer); // Temizleme işlemi
    }
  }, [show]);

  return (
    <Card sx={{ height: "100%", boxShadow: !shadow && "none" }}>
      <MDBox>
        <MDBox style={{ justifyContent: "center", display: "flex" }} pt={1.8} pb={1.3}>
          <MDTypography variant="h4" fontWeight="medium" textTransform="capitalize">
            {title}
          </MDTypography>
        </MDBox>
        <MDBox>
          <Divider sx={{ opacity: 1 }} />
        </MDBox>
        <MDBox mt={1.5}>
          <MDBox style={{ justifyContent: "center", display: "flex" }}>
            <Autocomplete
              sx={{ width: "400px" }}
              options={searchByName}
              getOptionLabel={(option: any) => option.firstName}
              onChange={(event: any, newValue: any) => {}}
              onInputChange={(event, newInputValue) => {
                handleSearchByName(newInputValue); // Kullanıcı her harf girdiğinde arama yap
              }}
              renderInput={(params) => (
                <MDInput
                  {...params}
                  size="Large"
                  InputLabelProps={{ shrink: true }}
                  placeholder="İsim giriniz..."
                />
              )}
              renderOption={(props, option: UserAppDto) => {
                const isMySelf = option.id === initialUserData?.id;
                if (isMySelf) {
                  return null;
                }

                return (
                  <MDBox
                    onClick={() => handleUserSelect(option)}
                    sx={{
                      display: "flex",

                      alignItems: "center",
                      py: 1,
                      mb: 1,
                      mx: 1,
                      cursor: "pointer",
                    }}
                    style={{ alignItems: "center" }} // Add the missing align property
                  >
                    <MDBox mr={2}>
                      <MDAvatar
                        src={`data:image/png;base64,${option.photo}`}
                        alt={option.firstName}
                        shadow="md"
                      />
                    </MDBox>
                    <MDBox
                      display="flex"
                      flexDirection="column"
                      alignItems="flex-start"
                      justifyContent="center"
                    >
                      <MDTypography variant="button" fontWeight="medium">
                        {option.firstName} {option.lastName}
                      </MDTypography>
                      <MDTypography variant="caption" color="text">
                        {option.email} {/* Kullanıcı e-posta adresini de gösterebilirsiniz */}
                      </MDTypography>
                    </MDBox>
                  </MDBox>
                );
              }}
            />
          </MDBox>
        </MDBox>
      </MDBox>
      <MDSnackbar
        color="info"
        icon="notifications"
        title="Bildirim"
        content={`${currentUser.firstName} ${currentUser.lastName} isimli kullanıcının profilini görüntülüyorsunuz.`}
        dateTime="Şimdi"
        open={show}
        close={toggleSnackBar}
      />
    </Card>
  );
}

// Declaring default props for ProfilesList
ProfilesList.defaultProps = {
  shadow: true,
};

export default ProfilesList;
