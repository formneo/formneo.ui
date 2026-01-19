import React, { useState, ChangeEvent, useEffect } from "react";
import { Card, Grid, Autocomplete } from "@mui/material";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";
import Footer from "examples/Footer";
import { useNavigate, useParams } from "react-router-dom";
import getConfiguration from "confiuration";
import { PositionListDto, CreatePositionDto, UpdatePositionDto } from "api/generated/api";
import { PositionsApi } from "api/generated";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { MessageBoxType } from "@ui5/webcomponents-react";

interface FormData {
  name: string;
  description: string;
  parentPositionId: string;
  id?: string;
}

function PositionDetailPage() {
  const navigate = useNavigate();
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();
  const { id } = useParams();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    parentPositionId: "",
    id: "",
  });

  const [positionOptions, setPositionOptions] = useState<PositionListDto[]>([]);
  const [isPositionDataLoaded, setIsPositionDataLoaded] = useState(false);

  useEffect(() => {
    const fetchPositionOptions = async () => {
      try {
        dispatchBusy({ isBusy: true });
        const conf = getConfiguration();
        const api = new PositionsApi(conf);
        const response = await api.apiPositionsGet();
        setPositionOptions(response.data || []);
        setIsPositionDataLoaded(true);
      } catch (error) {
        dispatchAlert({
          message: "Pozisyon listesi alınamadı",
          type: MessageBoxType.Error,
        });
      } finally {
        dispatchBusy({ isBusy: false });
      }
    };
    fetchPositionOptions();
  }, []);

  useEffect(() => {
    if (!isPositionDataLoaded || !id) return;

    const fetchData = async () => {
      try {
        dispatchBusy({ isBusy: true });
        const conf = getConfiguration();
        const api = new PositionsApi(conf);
        const response = await api.apiPositionsIdGet(id);
        setFormData({
          name: response.data.name || "",
          description: response.data.description || "",
          parentPositionId: response.data.parentPositionId || "",
          id: id,
        });
      } catch (error) {
        dispatchAlert({
          message: "Pozisyon bilgileri alınamadı",
          type: MessageBoxType.Error,
        });
      } finally {
        dispatchBusy({ isBusy: false });
      }
    };
    fetchData();
  }, [id, isPositionDataLoaded]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      dispatchBusy({ isBusy: true });
      const conf = getConfiguration();
      const api = new PositionsApi(conf);

      // validation
      if (!formData.name || formData.name.trim() === "") {
        dispatchAlert({
          message: "Pozisyon Adı Alanı Boş Bırakılamaz",
          type: MessageBoxType.Error,
        });
        dispatchBusy({ isBusy: false });
        return;
      }

      // submit
      if (formData.id) {
        const updateDto: UpdatePositionDto = {
          id: formData.id,
          name: formData.name || null,
          description: formData.description || null,
          parentPositionId: formData.parentPositionId || null,
        };
        await api.apiPositionsPut(updateDto);
        dispatchAlert({
          message: "Pozisyon bilgileri başarıyla güncellendi",
          type: MessageBoxType.Success,
        });
      } else {
        const createDto: CreatePositionDto = {
          name: formData.name || null,
          description: formData.description || null,
          parentPositionId: formData.parentPositionId || null,
        };
        await api.apiPositionsPost(createDto);
        dispatchAlert({
          message: "Pozisyon bilgileri başarıyla oluşturuldu",
          type: MessageBoxType.Success,
        });
      }

      navigate("/position", { replace: true });
    } catch (error) {
      dispatchAlert({
        message: "Pozisyon bilgileri kaydedilemedi",
        type: MessageBoxType.Error,
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <Grid
        container
        style={{
          height: "100%",
          marginTop: "-15px",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 2px 12px 0 rgba(0,0,0,0.1)",
        }}
      >
        <Grid item xs={12} lg={12}>
          <Card>
            <MDBox p={3}>
              <MDBox p={2}>
                <MDTypography variant="h4" gutterBottom>
                  {id ? "Pozisyon Güncelle" : "Pozisyon Oluştur"}
                </MDTypography>
              </MDBox>
              <MDBox mt={2} p={3}>
                <Grid container spacing={3}>
                  {/* Left Column */}
                  <Grid item xs={12} sm={6} lg={6}>
                    <MDInput
                      fullWidth
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "10px",
                          border: "1px solid #e2e8f0",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            borderColor: "#cbd5e1",
                            boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                          },
                          "&.Mui-focused": {
                            borderColor: "#3b82f6",
                            boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                          },
                        },
                      }}
                      label="Pozisyon Adı"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </Grid>
                  {/* Right Column */}
                  <Grid item xs={12} sm={6} lg={6}>
                    <Autocomplete
                      renderInput={(params) => (
                        <MDInput
                          {...params}
                          type="text"
                          label="Üst Pozisyon"
                          placeholder="Pozisyon seçiniz..."
                          fullWidth
                          inputProps={{ ...params.inputProps, sx: { height: "12px" } }}
                        />
                      )}
                      value={positionOptions.find(p => p.id === formData.parentPositionId) || null}
                      getOptionLabel={(option) => option.name || ""}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      options={positionOptions.filter(p => p.id !== formData.id)}
                      size="medium"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "10px",
                          border: "1px solid #e2e8f0",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            borderColor: "#cbd5e1",
                            boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                          },
                          "&.Mui-focused": {
                            borderColor: "#3b82f6",
                            boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                          },
                        },
                      }}
                      onChange={(event, newValue) => {
                        setFormData((prev) => ({
                          ...prev,
                          parentPositionId: newValue?.id || "",
                        }));
                      }}
                    />
                  </Grid>
                </Grid>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} lg={12}>
                    <MDBox mt={4}>
                      <MDInput
                        fullWidth
                        label="Açıklama"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        multiline
                        rows={5}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "10px",

                            border: "1px solid #e2e8f0",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              borderColor: "#cbd5e1",
                              boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                            },
                            "&.Mui-focused": {
                              borderColor: "#3b82f6",
                              boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                            },
                          },
                        }}
                      />
                    </MDBox>
                  </Grid>
                </Grid>
              </MDBox>
            </MDBox>

            <MDBox p={3} display="flex" justifyContent="flex-end" mt={36} width="100%">
              <MDButton
                sx={{ mr: 3 }}
                variant="outlined"
                color="primary"
                onClick={() => navigate("/position")}
              >
                İptal
              </MDButton>
              <MDButton variant="contained" color="info" type="submit" onClick={handleSubmit}>
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

export default PositionDetailPage;
