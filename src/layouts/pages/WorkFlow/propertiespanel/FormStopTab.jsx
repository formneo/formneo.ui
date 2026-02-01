import React from "react";
import PropTypes from "prop-types";
import { Box, Tab, Tabs, TextField, Typography } from "@mui/material";
import { Form } from "formik";
import { ErrorMessage, Field, Formik, FormikProvider, useFormik } from "formik";
import { Button, Input } from "@ui5/webcomponents-react";
import { Dropdown } from "primereact/dropdown";

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

// ✅ Form için özel types
const formTypes = [
  { name: "Form Workflow Tamamla", code: "FINISH" },
  { name: "Forma Geri Gönder", code: "SENDBACK" },
];

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

export default function FormStopTab({ initialValues, node, onButtonClick, selectedForm }) {
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={value} onChange={handleChange} aria-label="form stop tabs">
          <Tab label="Genel" {...a11yProps(0)} />
          <Tab label="Form Aksiyon" {...a11yProps(1)} />
        </Tabs>
      </Box>

      <TabPanel value={value} index={0}>
        <Formik
          initialValues={initialValues}
          onSubmit={(values, { setSubmitting }) => {
            
            node.data = values;
            setSubmitting(false);
            onButtonClick(node);
          }}
        >
          {({ submitForm, isSubmitting, handleChange, values }) => (
            <Form>
              <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                <Dropdown
                  value={values.stoptype ? values.stoptype : undefined}
                  onChange={(e) => {
                    handleChange({
                      target: {
                        name: "stoptype",
                        value: e.value,
                      },
                    });
                  }}
                  options={formTypes} // ✅ Form için özel types
                  name="stoptype"
                  optionLabel="name"
                  placeholder="Form Durma Tipi Seçiniz"
                />

                <Field
                  as={TextField}
                  name="name"
                  label="Node Adı"
                  fullWidth
                  onChange={handleChange}
                  value={values.name}
                />
              </div>

              <Field
                as={TextField}
                name="methodname"
                label="Method Adı"
                fullWidth
                onChange={handleChange}
                value={values.methodname}
                style={{ marginBottom: "1rem" }}
              />

              {/* ✅ Form bilgisi göster */}
              {selectedForm && (
                <Box
                  sx={{
                    backgroundColor: "#f0f7ff",
                    padding: "12px",
                    borderRadius: "8px",
                    marginBottom: "1rem",
                  }}
                >
                  <Typography variant="body2" sx={{ color: "#0070f3", fontWeight: "600" }}>
                    📝 Bağlı Form: {selectedForm.formName}
                  </Typography>
                </Box>
              )}

              <Button
                style={{
                  marginLeft: "10px",
                  marginTop: "20px",
                  marginBottom: "10px",
                }}
                type="Submit"
                variant="gradient"
                color="success"
                size="small"
              >
                Kaydet
              </Button>
            </Form>
          )}
        </Formik>
      </TabPanel>

      <TabPanel value={value} index={1}>
        <Typography variant="h6" gutterBottom>
          Form Workflow Aksiyonları
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • <strong>Form Workflow Tamamla:</strong> Form işlemi başarıyla tamamlanır
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • <strong>Forma Geri Gönder:</strong> Form düzenlenmek üzere geri gönderilir
        </Typography>
      </TabPanel>
    </Box>
  );
}
