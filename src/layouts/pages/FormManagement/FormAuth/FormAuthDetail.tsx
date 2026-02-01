import { Autocomplete, Card, Grid, Icon } from "@mui/material";
import { MessageBoxType } from "@ui5/webcomponents-react";
import {
    FormAuthApi,
    FormAuthDto,
    FormAuthInsertDto,
    FormAuthUpdateDto,
    FormDataApi,
    UserApi
} from "api/generated/api";
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";
import MDTypography from "components/MDTypography";
import getConfiguration from "confiuration";
import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { PickList } from "primereact/picklist";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function FormAuthDetail() {
    const [source, setSource] = useState([]);
    const [target, setTarget] = useState([]);
    const [formName, setFormName] = useState<any | null>(null);
    const [formNameOptions, setFormNameOptions] = useState<any[]>([]);
    const [formNameError, setFormNameError] = useState(false);
    const [targetError, setTargetError] = useState(false);
    const dispatchAlert = useAlert();
    const dispatchBusy = useBusy();
    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        if (id) {
            fetchRelationData();
        }
    }, [id]);

    const fetchRelationData = async () => {
        try {
            dispatchBusy({ isBusy: true });
            var conf = getConfiguration();
            var api = new FormAuthApi(conf);
            var response = await api.apiFormAuthIdGet(id);
            setFormName(response.data.form);
            setTarget(response.data.users);
        } catch (error) {
            dispatchAlert({
                message: "Hata Oluştu",
                type: MessageBoxType.Error,
            });
        } finally {
            dispatchBusy({ isBusy: false });
        }
    };

    const fetchData = async () => {
        try {
            dispatchBusy({ isBusy: true });
            var conf = getConfiguration();
            var api = new UserApi(conf);
            var data = await api.apiUserGetAllWithOuthPhotoGet();
            
            setSource(data.data);

            var formApi = new FormDataApi(conf);
            var formsData = await formApi.apiFormDataGet();
            console.log("formsData",formsData.data)
            setFormNameOptions(formsData.data);

        } catch (error) {
            dispatchAlert({
                message: "Hata Oluştu",
                type: MessageBoxType.Error,
            });
        } finally {
            dispatchBusy({ isBusy: false });
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onChange = (event: any) => {
        setSource(event.source);
        setTarget(event.target);
    };

    const itemTemplate = (item: any) => {
        return (
            <div className="flex align-items-center p-3 w-full">
                <div className="flex flex-column">
                    <Grid container>
                        <Grid container lg={11.3}>
                            <Grid item xs={12}>
                                <span className="font-bold text-lg">{item.firstName} {item.lastName}</span>
                            </Grid>
                        </Grid>
                    </Grid>
                </div>
            </div>
        );
    };

    const handleSave = async () => {
        let hasError = false;
        if (!formName) {
            setFormNameError(true);
            hasError = true;
        }
        if (hasError) return;

        try {
            dispatchBusy({ isBusy: true });
            var conf = getConfiguration();
            var api = new FormAuthApi(conf);

            const dto: FormAuthInsertDto = {
                formId: formName.id,
                userIds: target.map((item: any) => item.id),
            };

            await api.apiFormAuthPost(dto);
            
            navigate("/formAuth");
            dispatchAlert({
                message: "Form yetkisi tanımlandı.",
                type: MessageBoxType.Success,
            });
        } catch (error) {
            dispatchAlert({
                message: "Hata Oluştu",
                type: MessageBoxType.Error,
            });
        } finally {
            dispatchBusy({ isBusy: false });
        }
    };

    const handleUpdate = async () => {
        let hasError = false;
        if (!formName) {
            setFormNameError(true);
            hasError = true;
        }
        if (hasError) return;

        try {
            dispatchBusy({ isBusy: true });
            var conf = getConfiguration();
            var api = new FormAuthApi(conf);

            const dto: FormAuthUpdateDto = {
                formId: formName.id,
                userIds: target.map((item: any) => item.id),
            };

            await api.apiFormAuthPut(dto);
            
            navigate("/formAuth");

            dispatchAlert({
                message: "Form yetkisi düzenlendi.",
                type: MessageBoxType.Success,
            });
        } catch (error) {
            
            dispatchAlert({
                message: "Hata Oluştu",
                type: MessageBoxType.Error,
            });
        } finally {
            dispatchBusy({ isBusy: false });
        }
    };

    return (
        <DashboardLayout>
            <DashboardNavbar />
            <Card>
                <MDBox p={3}>
                    <MDBox p={3}>
                        <MDTypography variant="h4" gutterBottom>
                            Form Yetkisi Tanımlama
                        </MDTypography>
                    </MDBox>
                    <Grid container>
                        <Grid item xs={12} lg={6}>
                            <MDBox mt={3} p={3} mb={-3}>
                                <Autocomplete
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
                                    options={formNameOptions}
                                    getOptionLabel={(option) => `${option?.formName} - Rev:${option?.revision}` || ""}
                                    isOptionEqualToValue={(option, value) => option?.id === value?.id}
                                    value={formName || null}
                                    onChange={(event, value) => {
                                        setFormName(value);
                                        setFormNameError(false);
                                    }}
                                    disabled={!!id}
                                    renderInput={(params) => (
                                        <MDInput
                                            {...params}
                                            placeholder="Form Seçiniz"
                                            fullWidth
                                            error={formNameError}
                                            inputProps={{
                                                ...params.inputProps,
                                                sx: { height: "12px" },
                                                startAdornment: <Icon sx={{ mr: 1 }}>file</Icon>,
                                            }}
                                        />
                                    )}
                                />
                                {formNameError && (
                                    <MDTypography variant="caption" color="error" style={{ marginLeft: "8px" }}>
                                        {"Form Seçiniz"}
                                    </MDTypography>
                                )}
                            </MDBox>
                        </Grid>
                    </Grid>
                </MDBox>

                <div className="surface-card shadow-2 border-round p-4 m-4">
                    <PickList
                        dataKey=""
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
                        filterBy="firstName,lastName,email,userName"
                        breakpoint="1280px"
                        sourceHeader={
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <MDTypography style={{ color: "#757ce8" }}>{"Tüm Kullanıcılar"}</MDTypography>
                            </div>
                        }
                        targetHeader={
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <MDTypography style={{ color: "#757ce8" }}>{"Yetki Verilen Kullanıcılar"}</MDTypography>
                                {targetError && (
                                    <MDTypography variant="subtitle2" color="error" style={{ marginLeft: "8px" }}>
                                        {"Form Yetkisi Error"}
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
                        sourceFilterPlaceholder={"Kullanıcı Ara"}
                        targetFilterPlaceholder={"Kullanıcı Ara"}
                        showSourceControls={false}
                        showTargetControls={false}
                        className="picklist-custom"
                    />
                </div>
                <MDBox p={3}>
                    <MDBox p={2}>
                        <MDBox display="flex" justifyContent="flex-end">
                            <MDBox mr={2}>
                                <MDButton
                                    onClick={() => navigate("/formAuth")}
                                    variant="outlined"
                                    color="error"
                                >
                                    İptal
                                </MDButton>
                            </MDBox>
                            <MDButton onClick={id ? handleUpdate : handleSave} variant="gradient" color="info">
                                Kaydet
                            </MDButton>
                        </MDBox>
                    </MDBox>
                </MDBox>
            </Card>
            <Footer />
        </DashboardLayout>
    );
}

export default FormAuthDetail;
