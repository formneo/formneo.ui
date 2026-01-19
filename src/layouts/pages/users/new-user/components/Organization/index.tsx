import React from "react";
import Grid from "@mui/material/Grid";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// NewUser page components
import FormGenericSelect from "../FormField/FormGenericSelect";
import { GenericList } from "api/generated";

function Organization({ formData }: any): JSX.Element {
  const { formField, values } = formData;
  const { department, title } = formField;
  const { department: departmentV, title: titleV } = values;
  return (
    <MDBox>
      <MDTypography variant="h5" fontWeight="bold">
        Organization
      </MDTypography>
      <MDBox mt={1.625}>
        <Grid container spacing={3}>
          {/* Sol Sütun */}
          <Grid item xs={12} md={6}>
            {/* Departman Alanı */}
            <FormGenericSelect
              displayValue={departmentV}
              value={department}
              label={department.label}
              name={department.name}
              dataId={GenericList.NUMBER_17}
              headerText="Select Department"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            {/* Başlık Alanı */}
            <FormGenericSelect
              displayValue={titleV}
              value={title}
              label={title.label}
              name={title.name}
              dataId={GenericList.NUMBER_10} // Başlık için dataId
              headerText="Select Title"
            />
          </Grid>
        </Grid>
      </MDBox>
    </MDBox>
  );
}

export default React.memo(Organization);
