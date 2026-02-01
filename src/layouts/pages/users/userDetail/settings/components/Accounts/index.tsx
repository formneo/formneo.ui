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

import { useEffect, useState } from "react";

// @mui material components
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Switch from "@mui/material/Switch";
import Tooltip from "@mui/material/Tooltip";
import Divider from "@mui/material/Divider";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDAvatar from "components/MDAvatar";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";

// Images
import logoSlack from "assets/images/small-logos/logo-slack.svg";
import logoSpotify from "assets/images/small-logos/logo-spotify.svg";
import logoAtlassian from "assets/images/small-logos/logo-atlassian.svg";
import logoAsana from "assets/images/small-logos/logo-asana.svg";

// Material Dashboard 2 PRO React TS components
import { useMaterialUIController } from "context";
import { useFormikContext } from "formik";

function Accounts({ formData }: any): JSX.Element {
  const [controller] = useMaterialUIController();
  const { darkMode } = controller;

  const [visible, setVisible] = useState<boolean>(true);
  const { formField, values, errors, touched, vacationMode, isBlocked } = formData;
  const { canSsoLogin, isSystemAdmin, isMailSender } = formField;
  const { canSsoLogin: canSsoLoginV, isSystemAdmin: isSystemAdminV, isMailSender: isMailSenderV } = values;
  const { setFieldValue } = useFormikContext();

  const [isSSO, setSSO] = useState<boolean>(true);


  function handleSSOLogin() {
    setFieldValue('canSsoLogin', !values.canSsoLogin);
  }
  function handleSystemAdmin() {
    setFieldValue('isSystemAdmin', !values.isSystemAdmin);
  }
  function handleMailSender() {
    setFieldValue('isMailSender', !values.isMailSender);
  }
  useEffect(() => {
    
  }, [values.isMailSender]);

  return (
    <Card id="accounts">
      <MDBox p={3} lineHeight={1}>
        <MDBox mb={1}>
          <MDTypography variant="h5">Erişim</MDTypography>
        </MDBox>
        <MDTypography variant="button" color="text">
          Here you can setup and manage your integration settings.
        </MDTypography>
      </MDBox>
      <MDBox pt={2} pb={3} px={3}>
        <MDBox
          display="flex"
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          flexDirection={{ xs: "column", sm: "row" }}
        >


        </MDBox>


        <MDBox
          display="flex"
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          flexDirection={{ xs: "column", sm: "row" }}
        >


        </MDBox>

        <MDBox
          display="flex"
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          flexDirection={{ xs: "column", sm: "row" }}
        >
          <MDBox display="flex" alignItems="center">
            {/* <MDAvatar src={logoSpotify} alt="Slack logo" variant="rounded" /> */}
            <MDBox ml={2} lineHeight={0}>
              <MDTypography variant="h5" fontWeight="medium">
                Yeni Kullanıcı Maili Gönderilsin Mi
              </MDTypography>
              <MDTypography variant="button" color="text">
                Kullanıcı Giriş Bilgileri Mail Atılır
              </MDTypography>
            </MDBox>
          </MDBox>
          <MDBox
            display="flex"
            justifyContent="flex-end"
            alignItems="center"
            width={{ xs: "100%", sm: "auto" }}
            mt={{ xs: 1, sm: 0 }}
          >
            <MDBox lineHeight={0} mx={2}>
              <MDTypography variant="button" color="text">
                {values.isMailSender ? "Mail Gönderilsin" : "Mail Gönderilmesin"}
              </MDTypography>
            </MDBox>
            <MDBox mr={1}>
              <Switch checked={values.isMailSender} onChange={handleMailSender} />
            </MDBox>
          </MDBox>
        </MDBox>
      </MDBox>
    </Card>
  );
}

export default Accounts;
