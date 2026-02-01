import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Grid, Card, Container, Icon } from "@mui/material";

// Proje bileşenleri
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import TextInput from "components/form/TextInput";
import SelectInput from "components/form/SelectInput";

// Form veri tipi
type ContactFormData = {
  name: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
};

export default function ContactPage(): JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<ContactFormData>();

  
  const selectedSubject = watch("subject");

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      
      // Simüle edilmiş API isteği
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      alert(data.subject === "demo" 
        ? "Demo talebiniz alındı! Satış ekibimiz sizinle iletişime geçecek." 
        : "Mesajınız iletildi, teşekkürler."
      );
      reset();
    } catch (error) {
      alert("Bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MDBox width="100%" minHeight="100vh" bgColor="white" sx={{ overflowX: "hidden" }}>
      {/* Banner Alanı */}
      <MDBox
        minHeight="40vh"
        width="100%"
        sx={{
         
          backgroundImage: `linear-gradient(135deg, #667eea, #764ba2)`,

          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "grid",
          placeItems: "center",
        }}
      >
        <Container>
          <Grid container item xs={12} lg={8} justifyContent="center" mx="auto" textAlign="center">
            <MDTypography variant="h2" color="white" mb={1}>
              İletişime Geçin
            </MDTypography>
            <MDTypography variant="body1" color="white" opacity={0.8}>
              Sorularınız için bize yazabilir veya ürünümüzü yakından tanımak için <b>Demo Talep</b> edebilirsiniz.
            </MDTypography>
          </Grid>
        </Container>
      </MDBox>

      {/* Form Kartı */}
      <Container sx={{ mt: -8, mb: 4 }}>
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} lg={10}>
            <Card>
              <Grid container>
                {/* Sol Taraf: İletişim Bilgileri */}
                <Grid item xs={12} md={5} sx={{ p: 3, bgcolor: "#f8f9fa" }}>
                  <MDBox display="flex" flexDirection="column" height="100%" justifyContent="space-between">
                    <MDBox>
                      <MDTypography variant="h5" mb={3} color="dark">
                        Bize Ulaşın
                      </MDTypography>
                      
                      <MDBox display="flex" alignItems="center" mb={2}>
                        <Icon fontSize="medium" color="inherit">email</Icon>
                        <MDTypography variant="body2" ml={2} color="text">
                          info@formneo.com
                        </MDTypography>
                      </MDBox>

                      <MDBox display="flex" alignItems="center" mb={2}>
                        {/* <Icon fontSize="medium" color="inherit">phone</Icon> */}
                        {/* <MDTypography variant="body2" ml={2} color="text">
                          +90 212 123 45 67
                        </MDTypography> */}
                      </MDBox>

                      {/* <MDBox display="flex" alignItems="center" mb={2}>
                        <Icon fontSize="medium" color="inherit">location_on</Icon>
                        <MDTypography variant="body2" ml={2} color="text">
                          Eskişehir, Turkey
                        </MDTypography>
                      </MDBox> */}
                    </MDBox>
                  </MDBox>
                </Grid>

                {/* Sağ Taraf: Form */}
                <Grid item xs={12} md={7} sx={{ p: 3 }}>
                  <MDBox component="form" role="form" onSubmit={handleSubmit(onSubmit)}>
                    <MDBox mb={2}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <TextInput label="Ad Soyad" name="name" register={register} error={errors.name?.message} placeholder="Adınız" />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextInput label="E-posta" name="email" type="email" register={register} error={errors.email?.message} placeholder="Email adresiniz" />
                        </Grid>
                      </Grid>
                    </MDBox>

                    <MDBox mb={2}>
                      <TextInput label="Firma Adı (Opsiyonel)" name="company" register={register} placeholder="Firma Adı" />
                    </MDBox>

                    <MDBox mb={2}>
                      <SelectInput
                        label="Konu"
                        name="subject"
                        register={register}
                        error={errors.subject?.message}
                        options={[
                          { value: "demo", label: "✨ Demo Talebi (Ürünü Denemek İstiyorum)" },
                          { value: "sales", label: "Satış & Fiyatlandırma" },
                          { value: "support", label: "Teknik Destek" },
                          { value: "other", label: "Diğer" }
                        ]}
                      />
                    </MDBox>

                    <MDBox mb={2}>
                       <label className="block text-sm font-medium mb-1">Mesajınız</label>
                       <textarea
                         {...register("message")}
                         rows={4}
                         className="w-full px-3 py-2 rounded-md border text-sm outline-none focus:border-blue-500"
                         style={{ borderColor: "#d2d6da", fontFamily: "inherit" }}
                         placeholder="Mesajınızı buraya yazın..."
                       />
                    </MDBox>

                <MDBox mt={2}> {/* display="flex" gerekmez çünkü buton %100 olacak */}
  <MDButton 
    type="submit" 
    variant="gradient" 
    color="info" 
    disabled={isSubmitting}
    fullWidth // Bu özellik butonu %100 genişliğe getirir
  >
    {selectedSubject === "demo" ? "Demo Talep Et" : "Gönder"}
  </MDButton>
</MDBox>
                  </MDBox>
                </Grid>
              </Grid>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </MDBox>
  );
}