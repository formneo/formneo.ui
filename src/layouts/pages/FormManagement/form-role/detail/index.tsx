import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Grid, Card, Divider } from "@mui/material";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import Footer from "examples/Footer";
import { useNavigate } from "react-router-dom";
import { PickList } from "primereact/picklist";
import { MessageBoxType } from "@ui5/webcomponents-react";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { FormDataApi } from "api/generated";
import getConfiguration from "confiuration";
import "./index.css";

function FormRoleDetail() {
  const { id } = useParams();
  const [formRoleName, setFormRoleName] = useState("");
  const [formRoleNameError, setFormRoleNameError] = useState(false);
  const [formRoleDescription, setFormRoleDescription] = useState("");
  const [formRoleDescriptionError, setFormRoleDescriptionError] = useState(false);
  const [source, setSource] = useState([]);
  const [target, setTarget] = useState([]);
  const [targetError, setTargetError] = useState(false);
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();

  const navigate = useNavigate();

  const handleSubmit = () => {
    let hasError = false;

    if (!formRoleName.trim()) {
      setFormRoleNameError(true);
      hasError = true;
    } else {
      setFormRoleNameError(false);
    }

    if (!formRoleDescription.trim()) {
      setFormRoleDescriptionError(true);
      hasError = true;
    } else {
      setFormRoleDescriptionError(false);
    }

    if (target.length === 0) {
      setTargetError(true);
      hasError = true;
    } else {
      setTargetError(false);
    }

    if (hasError) {
      return;
    }
    
  };

  const onChange = (event: any) => {
    setSource(event.source);
    setTarget(event.target);
  };

  const fetchData = async () => {
    try {
      dispatchBusy({ isBusy: true });
      var conf = getConfiguration();
      var api = new FormDataApi(conf);
      var data = await api.apiFormDataGet();
      setSource(data.data);
    } catch (error) {
      dispatchAlert({ message: "Hata oluştu", type: MessageBoxType.Error });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Common input styles to avoid repetition
  const inputStyles = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "0.75rem",
      border: "1px solid #e2e8f0",
      transition: "all 0.2s ease",
      "&:hover": {
        borderColor: "#cbd5e1",
        boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
      },
      "&.Mui-focused": {
        borderColor: "#4f46e5",
        boxShadow: "0 0 0 3px rgba(79, 70, 229, 0.1)",
      },
    },
  };

  const formHelperTextStyles = (isError: boolean) => ({
    style: { color: isError ? "#f44335" : "inherit" },
  });

  const itemTemplate = (item: any) => {
    return (
      <div className="flex align-items-center p-3 w-full">
        <div className="flex flex-column w-full">
          <Grid container alignItems="center" spacing={1}>
            <Grid item xs={12} lg={0.7}>
              <i
                className="pi pi-folder text-primary"
                style={{
                  marginTop: "0.7rem",
                  marginRight: "0.5rem",
                  fontSize: "1.5rem",
                  color: "#4f46e5",
                }}
              ></i>
            </Grid>

            <Grid item xs={12} lg={11.3}>
              <span className="font-bold text-lg mb-2">{item.formName}</span>

              <div className="flex align-items-center gap-2 mt-1">
                <MDTypography variant="subtitle2" color="text" className="text-sm text-gray-600">
                  {item.formDescription}
                </MDTypography>
              </div>
            </Grid>
          </Grid>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <Grid
        container
        style={{
          marginTop: "-15px",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        }}
      >
        <Grid item xs={12} lg={12}>
          <Card
            sx={{
              borderRadius: "1rem",
              overflow: "hidden",
              boxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                boxShadow:
                  "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.01)",
              },
            }}
          >
            <MDBox p={3}>
              <MDBox p={2} mb={2} borderRadius="lg" bgcolor="#f8fafc">
                <MDTypography variant="h4" fontWeight="medium">
                  {id ? "Form Rolü Güncelle" : "Form Rolü Oluştur"}
                </MDTypography>
              </MDBox>

              <MDBox p={3}>
                <Grid container spacing={4}>
                  {/* Form Inputs */}
                  <Grid item xs={12}>
                    <MDBox mb={4}>
                      <MDTypography variant="h6" fontWeight="medium" color="text" mb={2}>
                        Form Rolü Bilgileri
                      </MDTypography>
                      <Divider sx={{ mb: 3 }} />

                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <MDInput
                            fullWidth
                            type="text"
                            value={formRoleName}
                            label="Form Rolü Adı"
                            onChange={(e: any) => {
                              setFormRoleName(e.target.value);
                              setFormRoleNameError(false);
                            }}
                            error={formRoleNameError}
                            helperText={formRoleNameError ? "*Form Rolü Adı boş olamaz" : ""}
                            FormHelperTextProps={formHelperTextStyles(formRoleNameError)}
                            sx={inputStyles}
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <MDInput
                            multiline
                            rows={4}
                            fullWidth
                            type="text"
                            label="Form Rolü Açıklaması"
                            value={formRoleDescription}
                            onChange={(e: any) => {
                              setFormRoleDescription(e.target.value);
                              setFormRoleDescriptionError(false);
                            }}
                            error={formRoleDescriptionError}
                            helperText={
                              formRoleDescriptionError ? "*Form Rolü Açıklaması boş olamaz" : ""
                            }
                            FormHelperTextProps={formHelperTextStyles(formRoleDescriptionError)}
                            sx={inputStyles}
                          />
                        </Grid>
                      </Grid>
                    </MDBox>
                  </Grid>
                </Grid>
              </MDBox>
            </MDBox>

            <MDBox mx={4} mb={4}>
              <MDTypography variant="h6" fontWeight="medium" color="text" mb={2}>
                Form Atama
              </MDTypography>
              <Divider sx={{ mb: 3 }} />

              <div className="surface-card shadow-2 border-round">
                <PickList
                  dataKey="id"
                  source={source}
                  target={target}
                  onChange={(event) => {
                    onChange(event);
                    setTargetError(false);
                  }}
                  itemTemplate={itemTemplate}
                  sourceItemTemplate={itemTemplate}
                  targetItemTemplate={itemTemplate}
                  filter
                  filterBy="formName,formDescription"
                  breakpoint="1280px"
                  sourceHeader={
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <MDTypography style={{ color: "#4f46e5", fontWeight: 600 }}>
                        Tüm Formlar
                      </MDTypography>
                    </div>
                  }
                  targetHeader={
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <MDTypography style={{ color: "#4f46e5", fontWeight: 600 }}>
                        Atanan Formlar
                      </MDTypography>
                      {targetError && (
                        <MDTypography
                          variant="subtitle2"
                          color="error"
                          style={{ marginLeft: "8px" }}
                        >
                          *En az bir form atanmalıdır
                        </MDTypography>
                      )}
                    </div>
                  }
                  sourceStyle={{
                    height: "24rem",
                    width: "100%",
                  }}
                  targetStyle={{
                    height: "24rem",
                    width: "100%",
                  }}
                  sourceFilterPlaceholder="İsim veya Açıklama Ara"
                  targetFilterPlaceholder="İsim veya Açıklama Ara"
                  showSourceControls={false}
                  showTargetControls={false}
                  className="picklist-custom"
                />
              </div>
            </MDBox>

            <MDBox p={3} display="flex" justifyContent="flex-end" width="100%" bgcolor="#f8fafc">
              <MDButton
                sx={{
                  mr: 3,
                  borderRadius: "0.5rem",
                  px: 4,
                  py: 1.5,
                  boxShadow: "none",
                  "&:hover": {
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  },
                }}
                variant="outlined"
                color="primary"
                onClick={() => navigate("/form-role")}
              >
                İptal
              </MDButton>
              <MDButton
                variant="contained"
                color="info"
                type="submit"
                onClick={handleSubmit}
                sx={{
                  borderRadius: "0.5rem",
                  px: 4,
                  py: 1.5,
                  boxShadow:
                    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  backgroundColor: "#4f46e5",
                  "&:hover": {
                    backgroundColor: "#4338ca",
                    boxShadow:
                      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                  },
                }}
              >
                Kaydet
              </MDButton>
            </MDBox>
          </Card>
        </Grid>
      </Grid>
      <MDBox mt={1} />
      <Footer />
    </DashboardLayout>
  );
}

export default FormRoleDetail;
