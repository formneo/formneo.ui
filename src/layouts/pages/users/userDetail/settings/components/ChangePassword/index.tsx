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
import Grid from "@mui/material/Grid";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";
import { useFormikContext } from "formik";
import { useEffect, useState } from "react";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { MessageBoxType } from "@ui5/webcomponents-react";
import getConfiguration from "confiuration";
import { UserApi } from "api/generated";
import MessageBox from "layouts/pages/Components/MessageBox";

function ChangePassword({ formData, readOnlyUserName }: any): JSX.Element {
  const { setFieldValue } = useFormikContext();
  const { values, formField } = formData;
  const { email, password } = values;

  const [passwordError, setPasswordError] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [isMailSender, setIsMailSender] = useState(values.isMailSender);
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();

  const validatePassword = (password: string): string => {
    if (password.length < 6) {
      return "Password must be at least 6 characters long";
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return "Password must contain at least one special character";
    }
    if (!/\d/.test(password)) {
      return "Password must contain at least one number";
    }
    return "";
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newPass = event.target.value;
    setNewPassword(newPass);

    const validationError = validatePassword(newPass);
    if (validationError) {
      setPasswordError(validationError);
    } else if (confirmPassword && newPass !== confirmPassword) {
      setPasswordError("Passwords do not match");
    } else {
      setPasswordError("");
    }
  };

  const handleConfirmPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const confirmPass = event.target.value;
    setConfirmPassword(confirmPass);

    const validationError = validatePassword(newPassword);
    if (validationError) {
      setPasswordError(validationError);
    } else if (newPassword && confirmPass !== newPassword) {
      setPasswordError("Passwords do not match");
    } else {
      setPasswordError("");
    }
  };

  const passwordRequirements = [
    "One special characters",
    "Min 6 characters",
    "One number (2 are recommended)",
  ];

  const renderPasswordRequirements = passwordRequirements.map((item, key) => {
    const itemKey = `element-${key}`;

    return (
      <MDBox key={itemKey} component="li" color="text" fontSize="1.25rem" lineHeight={1}>
        <MDTypography variant="button" color="text" fontWeight="regular" verticalAlign="middle">
          {item}
        </MDTypography>
      </MDBox>
    );
  });
  useEffect(() => {
    
    setIsMailSender(values.isMailSender);
  }, [values.isMailSender])
  const handleUpdatePassword = async () => {
    try {
      dispatchBusy({ isBusy: true });
      if (
        validatePassword(newPassword) ||
        validatePassword(confirmPassword) ||
        newPassword !== confirmPassword
      ) {
        dispatchAlert({ message: "Password is not valid : ", type: MessageBoxType.Error });
        return;
      }
      
      var conf = getConfiguration();
      var api = new UserApi(conf);
      var result = await api.apiUserResetPassWordGet(email, newPassword, isMailSender);

      dispatchAlert({ message: "Password updated successfully", type: MessageBoxType.Success });
      dispatchBusy({ isBusy: false });


    } catch (error) {
      dispatchAlert({ message: `Error: ${error}`, type: MessageBoxType.Error });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  return (
    <Card id="change-password">
      <MDBox p={3}>
        <MDTypography variant="h5">Change Password</MDTypography>
      </MDBox>
      <MDBox component="form" pb={3} px={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <MDInput
              fullWidth
              label="New Password"
              inputProps={{ type: "password", autoComplete: "" }}
              onChange={handlePasswordChange}
              error={!!passwordError}
            />
          </Grid>
          <Grid item xs={12}>
            <MDInput
              fullWidth
              label="Confirm New Password"
              inputProps={{ type: "password", autoComplete: "" }}
              onChange={handleConfirmPasswordChange}
              error={!!passwordError}
              helperText={passwordError}
            />
          </Grid>
        </Grid>
        <MDBox mt={6} mb={1}>
          <MDTypography variant="h5">Password requirements</MDTypography>
        </MDBox>
        <MDBox mb={1}>
          <MDTypography variant="body2" color="text">
            Please follow this guide for a strong password
          </MDTypography>
        </MDBox>
        <MDBox display="flex" justifyContent="space-between" alignItems="flex-end" flexWrap="wrap">
          <MDBox component="ul" m={0} pl={3.25} mb={{ xs: 8, sm: 0 }}>
            {renderPasswordRequirements}
          </MDBox>
          <MDBox ml="auto">
            <MDButton variant="gradient" color="dark" size="small" onClick={handleUpdatePassword}>
              update password
            </MDButton>
          </MDBox>
        </MDBox>
      </MDBox>
    </Card>
  );
}

export default ChangePassword;
