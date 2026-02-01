// @mui material components
import Grid from "@mui/material/Grid";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";

// NewUser page components
import FormField from "layouts/pages/users/new-user/components/FormField";
import GenericSelectDialogWithInputEnum from "layouts/UserComponents/GenericSelectDialogWithInputEnum";
import FormTextArea from "../FormTextArea";

function Socials({ formData }: any): JSX.Element {
  const { formField, values, errors, touched } = formData;
  const { linkedinUrl, cv, skills, token, profileInfo } = formField;
  const { linkedinUrl: linkedinUrlV, skills: skillsV, token: tokenV, profileInfo: profileInfoV } = values;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const uploadedFile = event.target.files[0];
       // Dosya bilgilerini kontrol edebilirsiniz.
      formData.setFieldValue("cv", uploadedFile); // Form verisini güncelle
    }
  };

  return (
    <MDBox>
      <MDTypography variant="h5" fontWeight="bold">
        Socials & Skills
      </MDTypography>
      <MDBox mt={1.625}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormField
              type={linkedinUrl.type}
              label={linkedinUrl.label}
              name={linkedinUrl.name}
              value={linkedinUrlV}
              placeholder={linkedinUrl.placeholder}
              error={errors.LinkedinUrl && touched.LinkedinUrl}
              success={linkedinUrlV.length > 0 && !errors.linkedin}
            />
          </Grid>

          <Grid item xs={12}>
            <MDBox>
              <label htmlFor="skills">
                <MDTypography variant="caption" fontWeight="bold">
                  Ön Yazı
                </MDTypography>
              </label>
              <FormTextArea
                type={profileInfo.type}
                label={profileInfo.label}
                name={profileInfo.name}
                value={profileInfoV}
                placeholder={profileInfo.placeholder}
              />
            </MDBox>
          </Grid>

        </Grid>
      </MDBox>
    </MDBox >
  );
}

export default Socials;
