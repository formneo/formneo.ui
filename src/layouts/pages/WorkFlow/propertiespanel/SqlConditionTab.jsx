import React from "react";
import PropTypes from "prop-types";
import { useState } from "react";
import { Box, Tab, Tabs, TextField, Typography } from "@mui/material";
import { Form, ErrorMessage, Field, Formik, FormikProvider, useFormik } from "formik";
import { Dropdown } from "primereact/dropdown";
import { Button, Input, Icon, Label, CheckBox, TextArea } from "@ui5/webcomponents-react";
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

export default function SqlConditionTab({ initialValues, node, onButtonClick }) {
  const [value, setValue] = React.useState(0);
  const [searchByName, setSearchByName] = useState([]);
  const dispatchBusy = useBusy();

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const testSqlQuery = async (query) => {
    try {
      dispatchBusy({ isBusy: true });
      // Burada gerçek API çağrısı yapılabilir
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("SQL sorgusu başarıyla test edildi!");
      dispatchBusy({ isBusy: false });
    } catch (error) {
      dispatchBusy({ isBusy: false });
      alert("SQL sorgusu test edilirken hata oluştu: " + error.message);
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
          <Tab label="Zamanlama" />
          <Tab label="SQL Sorgu" />
        </Tabs>
      </Box>

      <Formik
        initialValues={
          initialValues || {
            name: "",
            sqlQuery: "",
            isTransaction: false,
          }
        }
        onSubmit={(values, { setSubmitting }) => {
          
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
                label="Koşul Adı"
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
                  checked={values.isTransaction}
                  style={{ marginLeft: "-10px" }}
                  text="Transaction Kullan"
                  onChange={(e) => setFieldValue("isTransaction", e.target.checked)}
                />

                <div style={{ marginTop: "15px", marginBottom: "15px" }}>
                  <MDBox mb={2}>
                    <Field
                      as={TextArea}
                      name="sqlQuery"
                      style={{ width: "100%", minHeight: "200px" }}
                      placeholder="SELECT * FROM tablo WHERE koşul"
                      value={values.sqlQuery}
                      onChange={(e) => setFieldValue("sqlQuery", e.target.value)}
                    />
                    <MDTypography
                      variant="caption"
                      color="text"
                      style={{ marginTop: "5px", display: "block" }}
                    >
                      SQL sorgusu TRUE/FALSE değer döndürmelidir.
                    </MDTypography>
                  </MDBox>
                </div>

                <Button
                  onClick={() => testSqlQuery(values.sqlQuery)}
                  variant="gradient"
                  color="info"
                  size="small"
                  style={{ width: "150px", marginBottom: "15px" }}
                >
                  SQL Test Et
                </Button>

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
    </Box>
  );
}
