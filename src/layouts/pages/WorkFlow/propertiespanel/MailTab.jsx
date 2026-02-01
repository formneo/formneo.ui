import React, { useState, useEffect } from "react";
import { Grid, TextField, Typography } from "@mui/material";
import { Icon } from "@mui/material";
import MDButton from "components/MDButton";

const MailTab = ({ initialValues, node, onButtonClick }) => {
  const [values, setValues] = useState({
    From: "",
    To: "",
    Cc: "",
    Bcc: "",
    Subject: "",
    Body: "",
  });

  useEffect(() => {
    setValues({
      From: initialValues?.From || "",
      To: initialValues?.To || "",
      Cc: initialValues?.Cc || "",
      Bcc: initialValues?.Bcc || "",
      Subject: initialValues?.Subject || "",
      Body: initialValues?.Body || "",
    });
  }, [initialValues]);

  const handleChange = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Sadece dolu alanları filtrele
    if (!values.From.trim() || !values.To.trim()) {
      alert("From ve To alanları zorunludur!");
      return;
    }
    const safevalues = { ...values };

    

    if (onButtonClick) {
      onButtonClick({
        id: node.id,
        data: safevalues, // ✅ PascalCase ile backend'e uyumlu
      });
    }

    alert("Mail ayarları kaydedildi!");
  };

  return (
    <Grid container spacing={2} p={2}>
      <Grid item xs={12}>
        <Typography variant="h6">MAIL ATTRIBUTES</Typography>
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          label="From *"
          fullWidth
          value={values.From}
          onChange={(e) => handleChange("From", e.target.value)}
          required
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          label="To *"
          fullWidth
          value={values.To}
          onChange={(e) => handleChange("To", e.target.value)}
          required
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          label="Cc"
          fullWidth
          value={values.Cc}
          onChange={(e) => handleChange("Cc", e.target.value)}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          label="Bcc"
          fullWidth
          value={values.Bcc}
          onChange={(e) => handleChange("Bcc", e.target.value)}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          label="Subject"
          fullWidth
          value={values.Subject}
          onChange={(e) => handleChange("Subject", e.target.value)}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          label="Mail Body"
          fullWidth
          multiline
          minRows={6}
          value={values.Body}
          onChange={(e) => handleChange("Body", e.target.value)}
        />
      </Grid>

      <Grid item xs={12}>
        <Grid container justifyContent="flex-start">
          <MDButton
            variant="gradient"
            color="info"
            startIcon={<Icon>save</Icon>}
            onClick={handleSave}
          >
            Kaydet
          </MDButton>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default MailTab;
