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
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Container from "@mui/material/Container";
import { styled } from "@mui/material/styles";
import { Typography } from "@mui/material";

// Material Dashboard 2 PRO React TS components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";

// Layout components
import PageLayout from "examples/LayoutContainers/PageLayout";

// Styled components for Metronic-style layout
const ResetContainer = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
}));

const ResetCard = styled(Card)(({ theme }) => ({
  borderRadius: "20px",
  boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
  overflow: "hidden",
  maxWidth: "1000px",
  width: "100%",
  margin: "0 auto",
}));

const LeftSection = styled(Box)(({ theme }) => ({
  background: "linear-gradient(135deg, #3e5d8f 0%, #2c4a7a 100%)",
  color: "white",
  padding: theme.spacing(6),
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  textAlign: "center",
  minHeight: "600px",
}));

const RightSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(6),
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  backgroundColor: "#ffffff",
  minHeight: "600px",
}));

const BrandLogo = styled(Box)(({ theme }) => ({
  width: "80px",
  height: "80px",
  borderRadius: "50%",
  background: "rgba(255, 255, 255, 0.1)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: theme.spacing(3),
  fontSize: "32px",
  fontWeight: "bold",
}));
import { useEffect, useState } from "react";
import { getAccessToken } from "confiuration";
import { Configuration, ForgotPasswordApi, UserApi } from "api/generated";
import { MessageBox, MessageBoxAction, MessageBoxType } from "@ui5/webcomponents-react";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useBusy } from "layouts/pages/hooks/useBusy";

function Cover(): JSX.Element {
  const [email, setEmail] = useState<string>("");
  const [resetCode, setresetCode] = useState<string>("");
  const [showPsw, setShowPsw] = useState(true);
  const [pswTrue, setPswTrue] = useState(true);
  const [showNewPswVisible, setshowNewPswVisible] = useState(false);

  const [newPw, setnewPw] = useState<string>("");
  const [newPwConfirm, setnewPwConfirm] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [infoMsg, setinfoMsg] = useState<string>("Şifrenizi sıfırlamak için mail adresinizi giriniz.");
  const [msgOpen, setmsgOpen] = useState(false);


  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();



  const getConfiguration = () => {

    const accessToken = getAccessToken();
    return new Configuration({
      basePath: process.env.REACT_APP_BASE_PATH || '',
      accessToken: accessToken || "",
    });
  };

  useEffect(() => {
  }, []);

  const handleResetPassword = async () => {
    try {
      dispatchBusy({ isBusy: true });
      
      var conf = getConfiguration();
      var api = new ForgotPasswordApi(conf);
      var res = await api.apiForgotPasswordForgotPasswordPost(email);
      
      setShowPsw(false);
      setinfoMsg("Mail adresinize gelen kodu giriniz.")

    } catch (error: any) {
      console.error("Hata:", error);
      setShowPsw(true);
      dispatchAlert({ message: "Hata : " + error.response.data.errors, type: MessageBoxType.Error });
      dispatchBusy({ isBusy: false });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const verifyResetCode = async () => {
    try {
      dispatchBusy({ isBusy: true });
      
      
      var conf = getConfiguration();
      var api = new ForgotPasswordApi(conf);
      var res = await api.apiForgotPasswordVerifyResetCodePost(email, resetCode);
      
      setshowNewPswVisible(true);

      setinfoMsg("Yeni şifrenizi tanımlayınız.")

    } catch (error: any) {
      console.error("Hata:", error);
      dispatchAlert({ message: "Hata : " + error.response.data.errors, type: MessageBoxType.Error });
      dispatchBusy({ isBusy: false });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };
  const changePassword = async () => {
    try {
      var validateRes = validatePassword(newPw)
      if (validateRes != "") {
        dispatchAlert({ message: "Password is not valid : " + validateRes, type: MessageBoxType.Error });
        return;
      }

      dispatchBusy({ isBusy: true });
      var conf = getConfiguration();
      var api = new ForgotPasswordApi(conf);
      var res = await api.apiForgotPasswordChangePwPost(email, resetCode, newPw);
      setmsgOpen(true);

    } catch (error) {
      console.error("Hata:", error);
      dispatchAlert({ message: "Bir hata oluştu.", type: MessageBoxType.Error });
      dispatchBusy({ isBusy: false });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };
  const checkValidateEmail = () => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // validate email
    return !emailRegex.test(email.trim());
  };

  async function handleMsgDialog(event: any) {
    setmsgOpen(false);
    if (event === MessageBoxAction.OK) {
      window.location.href = "/authentication/sign-in/cover";
    } else {
      return;
    }
  }

  const validatePassword = (password: string): string => {
    if (password.length < 6) {
      return "Parola en az 6 karakter uzunluğunda olmalıdır";
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return "Parola en az bir özel karakter içermelidir";
    }
    if (!/\d/.test(password)) {
      return "Parola en az bir rakam içermelidir";
    }
    if (!/[A-Z]/.test(password)) {
      return "Parola en az bir büyük harf (A-Z) içermelidir";
    }
    return "";
  };

  const handlePasswordChange = (pw: string) => {
    const newPass = pw;
    setnewPw(newPass);

    const validationError = validatePassword(newPass);
    if (validationError) {
      setPasswordError(validationError);
    }
    else {
      setPasswordError("");
    }
  };

  const handleConfirmPasswordChange = (pw: string) => {
    const confirmPass = pw;
    setnewPwConfirm(confirmPass);

    const validationError = validatePassword(confirmPass);
    if (validationError) {
      setPasswordError(validationError);
      setPswTrue(true);
    }
    else if (newPw && confirmPass !== newPw) {
      setPasswordError("Şifreler eşleşmiyor..!");
      setPswTrue(true);
    }
    else {
      setPasswordError("");
      setPswTrue(false);
    }
  };

  // TODO: Backend ile bağlantı kurulacak
  const passwordRequirements = [
    "Parola en az 6 karakter uzunluğunda olmalıdır",
    "Parola en az bir özel karakter içermelidir",
    "Parola en az bir rakam içermelidir",
    "Parola en az bir büyük harf (A-Z) içermelidir"
  ];
  const renderPasswordRequirements = passwordRequirements.map((item, key) => {
    const itemKey = `element-${key}`;

    return (
      <MDBox key={itemKey} component="li" color="text" fontSize="8px" lineHeight={1}>
        <MDTypography variant="button" color="text" fontWeight="regular" verticalAlign="middle">
          {item}
        </MDTypography>
      </MDBox>
    );
  });


  return (
    <PageLayout>
      <ResetContainer>
        <Container maxWidth="lg">
          <ResetCard>
            <Grid container>
              {/* Sol Bölüm - Marka ve Açıklama */}
              <Grid item xs={12} md={6}>
                <LeftSection>
                  <BrandLogo>
                    <Typography variant="h4" fontWeight="bold" color="inherit">
                      F
                    </Typography>
                  </BrandLogo>

                  <MDTypography variant="h3" fontWeight="bold" color="white" mb={2}>
                    FormNeo
                  </MDTypography>

                  <MDTypography variant="h6" color="white" mb={4} textAlign="center" sx={{ opacity: 0.8 }}>
                    Şifre Sıfırlama
                  </MDTypography>

                  <MDTypography variant="body1" color="white" textAlign="center" lineHeight={1.6} sx={{ opacity: 0.7 }}>
                    {infoMsg}
                  </MDTypography>

                  <Box mt={4}>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Box
                        width="8px"
                        height="8px"
                        borderRadius="50%"
                        bgcolor="rgba(255,255,255,0.8)"
                        mr={2}
                      />
                      <Typography variant="body2" color="white" sx={{ opacity: 0.8 }}>
                        Güvenli şifre sıfırlama
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Box
                        width="8px"
                        height="8px"
                        borderRadius="50%"
                        bgcolor="rgba(255,255,255,0.8)"
                        mr={2}
                      />
                      <Typography variant="body2" color="white" sx={{ opacity: 0.8 }}>
                        E-posta doğrulama
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center">
                      <Box
                        width="8px"
                        height="8px"
                        borderRadius="50%"
                        bgcolor="rgba(255,255,255,0.8)"
                        mr={2}
                      />
                      <Typography variant="body2" color="white" sx={{ opacity: 0.8 }}>
                        Hızlı ve kolay süreç
                      </Typography>
                    </Box>
                  </Box>
                </LeftSection>
              </Grid>

              {/* Sağ Bölüm - Reset Formu */}
              <Grid item xs={12} md={6}>
                <RightSection>
                  <MDBox mb={4}>
                    <MDTypography variant="h4" fontWeight="bold" color="dark" mb={1}>
                      Şifre Sıfırlama
                    </MDTypography>
                    <MDTypography variant="body1" color="text" sx={{ opacity: 0.7 }}>
                      {showNewPswVisible ? "Yeni şifrenizi belirleyin" : "E-posta adresinizi girin"}
                    </MDTypography>
                  </MDBox>

                  {!showNewPswVisible ? (
                    <MDBox component="form" role="form">
                      <MDBox mb={3}>
                        <MDTypography variant="body2" fontWeight="medium" color="dark" mb={1}>
                          E-posta Adresi
                        </MDTypography>
                        <MDInput
                          type="email"
                          value={email}
                          onChange={(e: any) => setEmail(e.target.value)}
                          variant="outlined"
                          fullWidth
                          placeholder="ornek@sirket.com"
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "12px",
                              backgroundColor: "#f8f9fa",
                              border: "1px solid #e9ecef",
                              "&:hover": {
                                borderColor: "#3e5d8f",
                              },
                              "&.Mui-focused": {
                                borderColor: "#3e5d8f",
                                boxShadow: "0 0 0 3px rgba(62, 93, 143, 0.1)",
                              }
                            }
                          }}
                        />
                      </MDBox>

                      {!showPsw && (
                        <MDBox mb={3}>
                          <MDTypography variant="body2" fontWeight="medium" color="dark" mb={1}>
                            Doğrulama Kodu
                          </MDTypography>
                          <MDInput
                            value={resetCode}
                            onChange={(e: any) => setresetCode(e.target.value)}
                            variant="outlined"
                            fullWidth
                            placeholder="E-postanıza gelen kodu girin"
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                borderRadius: "12px",
                                backgroundColor: "#f8f9fa",
                                border: "1px solid #e9ecef",
                                "&:hover": {
                                  borderColor: "#3e5d8f",
                                },
                                "&.Mui-focused": {
                                  borderColor: "#3e5d8f",
                                  boxShadow: "0 0 0 3px rgba(62, 93, 143, 0.1)",
                                }
                              }
                            }}
                          />
                        </MDBox>
                      )}

                      <MDBox mb={3}>
                        {showPsw ? (
                          <MDButton
                            onClick={handleResetPassword}
                            disabled={checkValidateEmail()}
                            variant="gradient"
                            color="info"
                            fullWidth
                            size="large"
                            sx={{
                              backgroundColor: "#3e5d8f",
                              backgroundImage: "linear-gradient(135deg, #3e5d8f 0%, #2c4a7a 100%)",
                              borderRadius: "12px",
                              padding: "12px 24px",
                              fontSize: "16px",
                              fontWeight: "600",
                              textTransform: "none",
                              boxShadow: "0 8px 25px rgba(62, 93, 143, 0.3)",
                              "&:hover": {
                                transform: "translateY(-2px)",
                                boxShadow: "0 12px 35px rgba(62, 93, 143, 0.4)",
                              },
                              "&:disabled": {
                                opacity: 0.6,
                                transform: "none",
                                boxShadow: "0 4px 15px rgba(62, 93, 143, 0.2)",
                              }
                            }}
                          >
                            Kod Gönder
                          </MDButton>
                        ) : (
                          <MDButton
                            onClick={verifyResetCode}
                            variant="gradient"
                            color="info"
                            fullWidth
                            size="large"
                            sx={{
                              backgroundColor: "#3e5d8f",
                              backgroundImage: "linear-gradient(135deg, #3e5d8f 0%, #2c4a7a 100%)",
                              borderRadius: "12px",
                              padding: "12px 24px",
                              fontSize: "16px",
                              fontWeight: "600",
                              textTransform: "none",
                              boxShadow: "0 8px 25px rgba(62, 93, 143, 0.3)",
                              "&:hover": {
                                transform: "translateY(-2px)",
                                boxShadow: "0 12px 35px rgba(62, 93, 143, 0.4)",
                              }
                            }}
                          >
                            Kodu Doğrula
                          </MDButton>
                        )}
                      </MDBox>
                    </MDBox>
                  ) : (
                    <MDBox component="form" role="form">
                      <MDBox mb={3}>
                        <MDTypography variant="body2" fontWeight="medium" color="dark" mb={1}>
                          Yeni Şifre
                        </MDTypography>
                        <MDInput
                          type="password"
                          value={newPw}
                          error={!!passwordError}
                          onChange={(e: any) => handlePasswordChange(e.target.value)}
                          variant="outlined"
                          fullWidth
                          placeholder="••••••••••"
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "12px",
                              backgroundColor: "#f8f9fa",
                              border: "1px solid #e9ecef",
                              "&:hover": {
                                borderColor: "#3e5d8f",
                              },
                              "&.Mui-focused": {
                                borderColor: "#3e5d8f",
                                boxShadow: "0 0 0 3px rgba(62, 93, 143, 0.1)",
                              }
                            }
                          }}
                        />
                      </MDBox>

                      <MDBox mb={3}>
                        <MDTypography variant="body2" fontWeight="medium" color="dark" mb={1}>
                          Şifreyi Tekrar Girin
                        </MDTypography>
                        <MDInput
                          type="password"
                          value={newPwConfirm}
                          error={!!passwordError}
                          onChange={(e: any) => handleConfirmPasswordChange(e.target.value)}
                          variant="outlined"
                          fullWidth
                          placeholder="••••••••••"
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "12px",
                              backgroundColor: "#f8f9fa",
                              border: "1px solid #e9ecef",
                              "&:hover": {
                                borderColor: "#3e5d8f",
                              },
                              "&.Mui-focused": {
                                borderColor: "#3e5d8f",
                                boxShadow: "0 0 0 3px rgba(62, 93, 143, 0.1)",
                              }
                            }
                          }}
                        />
                      </MDBox>

                      {passwordError && (
                        <MDBox mb={2}>
                          <Typography variant="caption" color="error" fontWeight="medium">
                            {passwordError}
                          </Typography>
                        </MDBox>
                      )}

                      <MDBox mb={3}>
                        <MDTypography variant="body2" color="text" mb={1} sx={{ opacity: 0.8 }}>
                          Şifre Gereksinimleri:
                        </MDTypography>
                        <MDBox component="ul" m={0} pl={2}>
                          {renderPasswordRequirements}
                        </MDBox>
                      </MDBox>

                      <MDBox mb={3}>
                        <MDButton
                          onClick={changePassword}
                          disabled={pswTrue}
                          variant="gradient"
                          color="info"
                          fullWidth
                          size="large"
                          sx={{
                            backgroundColor: "#3e5d8f",
                            backgroundImage: "linear-gradient(135deg, #3e5d8f 0%, #2c4a7a 100%)",
                            borderRadius: "12px",
                            padding: "12px 24px",
                            fontSize: "16px",
                            fontWeight: "600",
                            textTransform: "none",
                            boxShadow: "0 8px 25px rgba(62, 93, 143, 0.3)",
                            "&:hover": {
                              transform: "translateY(-2px)",
                              boxShadow: "0 12px 35px rgba(62, 93, 143, 0.4)",
                            },
                            "&:disabled": {
                              opacity: 0.6,
                              transform: "none",
                              boxShadow: "0 4px 15px rgba(62, 93, 143, 0.2)",
                            }
                          }}
                        >
                          Şifreyi Değiştir
                        </MDButton>
                      </MDBox>
                    </MDBox>
                  )}

                  <MDBox textAlign="center">
                    <MDTypography variant="body2" color="text" sx={{ opacity: 0.7 }}>
                      Şifrenizi hatırladınız mı?{" "}
                      <Typography
                        component="span"
                        variant="body2"
                        color="info"
                        fontWeight="medium"
                        sx={{ cursor: "pointer", textDecoration: "underline" }}
                        onClick={() => window.location.href = "/authentication/sign-in/cover"}
                      >
                        Giriş yapın
                      </Typography>
                    </MDTypography>
                  </MDBox>
                </RightSection>
              </Grid>
            </Grid>
          </ResetCard>
        </Container>
      </ResetContainer>

      <MessageBox
        type="Information"
        open={msgOpen}
        onClose={handleMsgDialog}
        titleText="Bilgi"
        actions={[MessageBoxAction.OK]}
      >
        Şifreniz başarıyla değiştirilmiştir
      </MessageBox>
    </PageLayout>
  );
}

export default Cover;
