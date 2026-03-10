import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  Button,
  Autocomplete,
  TextField,
} from "@mui/material";
import { FormDataApi } from "api/generated";
import getConfiguration from "confiuration";

export default function WorkflowFormSelector({ open, onClose, onConfirm }) {
  const [formOptions, setFormOptions] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);

  useEffect(() => {
    if (open) {
      const fetchForms = async () => {
        try {
          const conf = getConfiguration();
          const api = new FormDataApi(conf);
          const res = await api.apiFormDataLatestNamesOnlyGet();
          setFormOptions(res.data ?? []);
        } catch (error) {
          console.error("Formlar çekilemedi", error);
        }
      };
      fetchForms();
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!selectedForm) return;
    try {
      const conf = getConfiguration();
      const api = new FormDataApi(conf);
      const res = await api.apiFormDataIdGet(selectedForm.id);
      const fullForm = res.data;
      if (fullForm) {
        onConfirm(fullForm);
        onClose();
      }
    } catch (error) {
      console.error("Form detayı çekilemedi", error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogContent>
        <Typography variant="h6" mb={2}>
          Bir Form Seçin
        </Typography>

        {/* ComboBox */}
        <Autocomplete
          options={formOptions}
          getOptionLabel={(option) => `${option.formName} (${option.id})`} // 🔧 eşsiz hale getirildi
          value={selectedForm}
          onChange={(event, newValue) => setSelectedForm(newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Form Seçiniz"
              placeholder="Form Ara..."
              variant="outlined"
              fullWidth
            />
          )}
        />

        {/* SEÇİLEN FORM BİLGİLERİ */}
        {selectedForm && (
          <Box mt={2} p={2} bgcolor="#f5f5f5" borderRadius={2}>
            <Typography variant="subtitle1" fontWeight="bold">
              Seçilen Form:
            </Typography>
            <Typography variant="body2">ID: {selectedForm.id}</Typography>
            <Typography variant="body2">Adı: {selectedForm.formName}</Typography>
          </Box>
        )}

        <Box textAlign="right" mt={2}>
          <Button
            variant="contained"
            disabled={!selectedForm}
            onClick={handleConfirm}
            sx={{ color: "#f5f5f5" }}
          >
            Devam Et
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
