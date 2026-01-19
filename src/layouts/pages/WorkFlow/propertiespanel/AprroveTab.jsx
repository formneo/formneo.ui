import React from "react";
import PropTypes from "prop-types";
import { useState } from "react";
import { Box, Tab, Tabs, TextField, Typography } from "@mui/material";
import { Form, ErrorMessage, Field, Formik, FormikProvider, useFormik } from "formik";
import { Dropdown } from "primereact/dropdown";
import { Button, Input, Icon, Label, CheckBox } from "@ui5/webcomponents-react";
import { UserApi } from "api/generated";
import MDBox from "components/MDBox";
import MDEditor from "components/MDEditor";
import MDEditorRoot from "components/MDEditor/MDEditorRoot";
import MDInput from "components/MDInput";
import MDAvatar from "components/MDAvatar";
import { useBusy } from "layouts/pages/hooks/useBusy";
import MDTypography from "components/MDTypography";
import getConfiguration from "confiuration";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
// import UserSelectDialog from "../../Components/UserSelectDialog.";
import {
  Autocomplete,
  Card,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
  Divider,
  FormControl,
} from "@mui/material";
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired,
};

export default function AprroveTab({ initialValues, node, onButtonClick }) {
  const [value, setValue] = React.useState(0);
  const [searchByName, setSearchByName] = useState([]);
  const [selectionKullanici, setSelectionKullanici] = useState(null);
  const [UserDialogVisible, setUserDialogVisible] = useState(false);
  const dispatchBusy = useBusy();
  const [selectedKullanici, setSelectedKullanici] = useState(null);
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const [inputDisabled, setInputDisabled] = useState(false);
  const handleCheckBox = (event) => {
    alert(event.target.checked);
    setInputDisabled(event.target.checked);
  };

  const handleSearchByName = async (value) => {
    if (value === "") {
      setSearchByName([]);
    } else {
      dispatchBusy({ isBusy: true });

      var conf = getConfiguration();
      var api = new UserApi(conf);
      var data = await api.apiUserGetAllUsersWithNameGet(value);
      var pureData = data.data;
      setSearchByName(pureData);

      dispatchBusy({ isBusy: false });
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
          {/* <Tab  icon ={<InfoIcon/>}label="Onaycı Bilgileri" /> */}
          <Tab label="Zamanlama" />
          <Tab label="Action" />
          {/* <Tab label="Item Three" {...a11yProps(2)} /> */}
        </Tabs>
      </Box>

      <Formik
        initialValues={initialValues}
        onSubmit={(values, { setSubmitting }) => {
          console.log(JSON.stringify(node));
          node.data = values;
          setSubmitting(false);
          onButtonClick(node);
        }}
      >
        {({ submitForm, isSubmitting, handleChange, values, setFieldValue }) => (
          <Form>
            <TabPanel value={value} index={0}>
              <Field
                as={Input}
                name="name"
                label="AkışAdı"
                fullWidth
                onChange={handleChange}
                value={values.name}
              />

              <Button
                style={{ marginLeft: "10px", marginTop: "20px", marginBottom: "10px" }}
                type="Submit"
                variant="gradient"
                color="success"
                size="small"
              >
                Kaydet
              </Button>
            </TabPanel>
            <TabPanel value={value} index={1}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <CheckBox
                  checked={values.isManager}
                  style={{ marginLeft: "-10px" }}
                  text="Üst Yönetici"
                  onChange={(e) => setFieldValue("isManager", e.target.checked)}
                />
                <div style={{ alignItems: "center" }}>
                  <Autocomplete
                    sx={{ mb: 3.2 }}
                    options={searchByName}
                    getOptionLabel={(option) => {
                      if (option.firstName && option.lastName) {
                        return `${option.firstName} ${option.lastName}`;
                      }
                      return option.userAppName || "";
                    }}
                    value={selectedKullanici}
                    isOptionEqualToValue={(option, value) => {
                      if (!option || !value) return false;
                      return option.id === value.id || option.id === value.userAppId;
                    }}
                    onChange={(event, newValue) => {
                      setFieldValue("code", newValue.userName);
                      setFieldValue("approvername", newValue.firstName + " " + newValue.lastName);
                    }}
                    onInputChange={(event, newInputValue) => {
                      handleSearchByName(newInputValue);
                    }}
                    renderInput={(params) => (
                      <MDInput
                        {...params}
                        size="large"
                        placeholder="Kullanıcı"
                        label="Kullanıcı"
                        inputProps={{ ...params.inputProps, sx: { height: "12px" } }}
                      />
                    )}
                    renderOption={(props, option) => {
                      return (
                        <li {...props} key={option.id} style={{ listStyle: "none" }}>
                          {" "}
                          <MDBox
                            onClick={() => {}}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              py: 1,
                              mb: 1,
                              mx: 1,
                              cursor: "pointer",
                            }}
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
                                {option.email}
                              </MDTypography>
                            </MDBox>
                          </MDBox>
                        </li>
                      );
                    }}
                  />

                  {values.approvername && (
                    <Label style={{ marginRight: "10px", marginLeft: "10px" }}>
                      {values.approvername}
                    </Label>
                  )}
                </div>
                <Button
                  type="Submit"
                  variant="gradient"
                  color="success"
                  size="small"
                  style={{ width: "100px" }}
                >
                  Kaydet
                </Button>
              </div>
            </TabPanel>
          </Form>
        )}
      </Formik>
      {/* <TabPanel value={value} index={2}>
        Item Three
      </TabPanel> */}
    </Box>
  );
}
