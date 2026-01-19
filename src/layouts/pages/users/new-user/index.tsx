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

// formik components
import { Formik, Form } from "formik";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

// Material Dashboard 2 PRO React TS examples components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// NewUser page components
import UserInfo from "layouts/pages/users/new-user/components/UserInfo";
import Address from "layouts/pages/users/new-user/components/Address";
import Socials from "layouts/pages/users/new-user/components/Socials";
import Profile from "layouts/pages/users/new-user/components/Profile";

// NewUser layout schemas for form and form feilds
import validations from "layouts/pages/users/new-user/schemas/validations";
import form from "layouts/pages/users/new-user/schemas/form";
import initialValues from "layouts/pages/users/new-user/schemas/initialValues";
import getConfiguration from "confiuration";
import { CreateUserDto, UpdateUserDto, UserApi } from "api/generated";
import { dA } from "@fullcalendar/core/internal-common";
import { useNavigate, useOutlet, useLocation } from "react-router-dom";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { AxiosError } from "axios";
import { useAlert } from "layouts/pages/hooks/useAlert";

import { MessageBox, MessageBoxPropTypes, MessageBoxType } from '@ui5/webcomponents-react';
import Organization from "./components/Organization";

function getSteps(): string[] {
  return ["User Info", "Organizasyon", "Teknik CV"];
}
function getStepContent(stepIndex: number, formData: any, id: any): JSX.Element {
  switch (stepIndex) {
    case 0:

      return <UserInfo readOnlyUserName={id!!} showPassword={true} formData={formData} />;
    case 1:
      return <Organization formData={formData} />;

    case 2:
      return <Socials formData={formData} />;
    default:
      return null;
  }
}

function NewUser(): JSX.Element {
  const dispatchBusy = useBusy()
  const [activeStep, setActiveStep] = useState(0);
  const steps = getSteps();
  const { formId, formField } = form;
  const currentValidation = validations[activeStep];
  const isLastStep = activeStep === steps.length - 1;
  const [formValues, setFormValues] = useState(initialValues);
  const [formGudid, setFormId] = useState("");
  const [isValidUser, setIsValidUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate(); // Navig
  const location = useLocation();
  const dispatchAlert = useAlert()


  // Setting the dir attribute for the body element
  useEffect(() => {
    // State'den userId al
    const id = location.state?.userId;
    
    if (id) {
      // XSS koruması için basit sanitizasyon
      const sanitizedId = id.replace(/[<>\"'&]/g, '');
      
      // Boş string kontrolü
      if (sanitizedId.trim() === '') {
        // Yeni kullanıcı oluşturma modu
        setIsValidUser(true);
        setIsLoading(false);
        return;
      }
      
      // ID'yi state'e kaydet
      setUserId(sanitizedId);
      fetchDetail(sanitizedId);
    } else {
      // Yeni kullanıcı oluşturma modu
      setIsValidUser(true);
      setIsLoading(false);
    }
  }, []);


  const fetchDetail = async (id: string) => {
    try {
      dispatchBusy({ isBusy: true });
      setIsLoading(true);
      
      var conf = getConfiguration();
      var api = new UserApi(conf);
      
      // API çağrısı yap
      var data = await api.apiUserGet(id);
      
      // API yanıtını kontrol et
      if (!data || !data.data) {
        throw new Error("Kullanıcı verisi bulunamadı");
      }
      
      var resultData = data.data;
      
      // Kullanıcı verilerini güvenli şekilde işle
      setFormId(resultData.id);
      setIsValidUser(true);
      
      setFormValues((prevValues) => ({
        ...prevValues,
        userName: data.data.userName || "",
        firstName: data.data.firstName || "",
        lastName: data.data.lastName || "",
        department: data.data.orgUnitId || "",
        title: data.data.title || "",
        email: data.data.email || "",
        linkedinUrl: data.data.linkedinUrl || "",
        isBlocked: data.data.isBlocked || false,
        isSystemAdmin: data.data.isSystemAdmin || false,
        vacationMode: data.data.vacationMode || false,
        profileInfo: data.data.profileInfo || "",
      }));

    } catch (error: any) {
      console.error("Kullanıcı verisi yüklenirken hata:", error);
      
      // Güvenli hata mesajı göster
      dispatchAlert({
        message: "Kullanıcı verisi yüklenirken hata oluştu. Bu kullanıcıya erişim yetkiniz olmayabilir.",
        type: MessageBoxType.Error,
      });
      
      // Kullanıcı listesine yönlendir
      navigate("/users");
      
    } finally {
      dispatchBusy({ isBusy: false });
      setIsLoading(false);
    }
  };

  const sleep = (ms: any) =>
    new Promise((resolve) => {

      setTimeout(resolve, ms);
    });
  const handleBack = () => setActiveStep(activeStep - 1);

  const submitForm = async (values: any, actions: any) => {
    await sleep(1000);

    // State'den ID kontrolü
    if (userId && !formGudid) {
      dispatchAlert({
        message: "Geçersiz kullanıcı ID'si. İşlem iptal edildi.",
        type: MessageBoxType.Error,
      });
      return;
    }
    
    if (formGudid) {
      var update = values as UpdateUserDto;

      var conf = getConfiguration();
      var api = new UserApi(conf);
      update.id = formGudid;
      update.canSsoLogin = false;



      if (update.isBlocked == null) {


        update.isBlocked = false;
      }
      if (update.isSystemAdmin == null) {
        update.isSystemAdmin = false;
      }
      if (update.vacationMode == null) {
        update.vacationMode = false;
      }

      try {
        var data = await api.apiUserPut(update);
        console.log("Başarılı:", data);
      } catch (error: any) {
        dispatchAlert({ message: error.response.data.errors[0], type: MessageBoxType.Error })
        actions.setSubmitting(false);
        return;

      }
      navigate("/users");
    }
    else {
      var create = values as CreateUserDto;
      var conf = getConfiguration();
      var api = new UserApi(conf);

      create.canSsoLogin = false;


      create.lastLoginIp = "";


      try {
        var data = await api.apiUserPost(false, create);
        console.log("Başarılı:", data);
      } catch (error: any) {
        dispatchAlert({ message: error.response.data.errors[0], type: MessageBoxType.Error })
        actions.setSubmitting(false);
        return;

      }
      navigate("/users");

    }
    // eslint-disable-next-line no-alert
    actions.setSubmitting(false);
    actions.resetForm();
    setActiveStep(0);
  };

  const handleSubmit = (values: any, actions: any) => {
    if (isLastStep) {
      submitForm(values, actions);
    } else {
      setActiveStep(activeStep + 1);
      actions.setTouched({});
      actions.setSubmitting(false);
    }
  };

  // Loading durumunda göster
  if (isLoading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox mt={4} display="flex" justifyContent="center" alignItems="center">
          <MDTypography variant="h6" color="text">
            Kullanıcı verisi yükleniyor...
          </MDTypography>
        </MDBox>
      </DashboardLayout>
    );
  }

  // Geçersiz kullanıcı durumunda göster (sadece edit modunda)
  if (!isValidUser && formGudid) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox mt={4} display="flex" justifyContent="center" alignItems="center">
          <MDTypography variant="h6" color="error">
            Geçersiz kullanıcı. Yönlendiriliyorsunuz...
          </MDTypography>
        </MDBox>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3} mb={20}>

        <Grid item style={{ marginTop: "10px" }} xs={12} lg={8}>
          <Formik
            initialValues={formValues}
            enableReinitialize
            validationSchema={currentValidation}
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, isSubmitting }) => (
              <Form id={formId} autoComplete="off">
                <Card sx={{ height: "100%" }}>
                  <MDBox mx={2} mt={-3}>
                    <Stepper activeStep={activeStep} alternativeLabel>
                      {steps.map((label) => (
                        <Step key={label}>
                          <StepLabel>{label}</StepLabel>
                        </Step>
                      ))}
                    </Stepper>
                  </MDBox>
                  <MDBox p={3}>
                    <MDBox>
                      {getStepContent(activeStep, {
                        values,
                        touched,
                        formField,
                        errors,
                      }, formGudid)}
                      <MDBox mt={2} width="100%" display="flex" justifyContent="space-between">
                        {activeStep === 0 ? (
                          <MDBox />
                        ) : (
                          <MDButton variant="gradient" color="light" onClick={handleBack}>
                            back
                          </MDButton>
                        )}
                        <MDButton
                          disabled={isSubmitting}
                          type="submit"
                          variant="gradient"
                          color="dark"
                        >
                          {isLastStep ? "send" : "next"}
                        </MDButton>
                      </MDBox>
                    </MDBox>
                  </MDBox>
                </Card>
              </Form>
            )}
          </Formik>

        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default NewUser;
