import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  Stack,
  TextField,
} from "@mui/material";
import {
  Description as DescriptionIcon,
  ToggleOn as ToggleOnIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

/**
 * Workflow Ayarları Panel
 * Sağ tarafta workflow'un genel ayarlarını gösterir
 */
const WorkflowSettingsTab = ({ selectedForm, workflowName, isActive, onActiveChange, onWorkflowNameChange }) => {
  const [active, setActive] = useState(isActive || false);
  const [name, setName] = useState(workflowName || "");

  useEffect(() => {
    setActive(isActive || false);
  }, [isActive]);

  useEffect(() => {
    setName(workflowName || "");
  }, [workflowName]);

  const handleActiveToggle = (event) => {
    const newValue = event.target.checked;
    setActive(newValue);
    if (onActiveChange) {
      onActiveChange(newValue);
    }
  };

  const handleNameChange = (event) => {
    const newValue = event.target.value;
    setName(newValue);
    if (onWorkflowNameChange) {
      onWorkflowNameChange(newValue);
    }
  };

  return (
    <MDBox sx={{ p: 2, height: "100%", overflow: "auto" }}>
      {/* Header */}
      <MDBox sx={{ mb: 3 }}>
        <MDBox sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <InfoIcon sx={{ color: "#0284c7" }} />
          <MDTypography variant="h6" fontWeight="medium">
            Workflow Ayarları
          </MDTypography>
        </MDBox>
        <MDTypography variant="caption" color="text" sx={{ opacity: 0.7 }}>
          Workflow&apos;un genel bilgileri ve ayarları
        </MDTypography>
      </MDBox>

      <Divider sx={{ mb: 2 }} />

      {/* Workflow Bilgileri */}
      <Card sx={{ p: 2, mb: 2, backgroundColor: "#f8fafc" }}>
        <MDTypography variant="caption" color="text" fontWeight="medium" sx={{ mb: 1, display: "block" }}>
          WORKFLOW ADI
        </MDTypography>
        <TextField
          fullWidth
          size="small"
          value={name}
          onChange={handleNameChange}
          placeholder="Workflow adını giriniz"
          variant="outlined"
          sx={{
            "& .MuiOutlinedInput-root": {
              fontSize: "14px",
              backgroundColor: "#ffffff",
            }
          }}
        />
      </Card>

      {/* Form Bilgileri */}
      <Card sx={{ p: 2, mb: 2, backgroundColor: selectedForm ? "#f0f9ff" : "#fef3c7" }}>
        <MDBox sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <DescriptionIcon sx={{ fontSize: 20, color: selectedForm ? "#0284c7" : "#f59e0b" }} />
          <MDTypography variant="caption" color="text" fontWeight="medium">
            BAĞLI FORM
          </MDTypography>
        </MDBox>
        
        {selectedForm ? (
          <>
            <MDTypography variant="body2" fontWeight="medium" sx={{ mb: 0.5 }}>
              {selectedForm.formName}
            </MDTypography>
            <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
              <Chip
                label={`ID: ${selectedForm.id?.substring(0, 8)}...`}
                size="small"
                sx={{ fontSize: "10px", height: "20px" }}
              />
              {selectedForm.formType && (
                <Chip
                  label={selectedForm.formType}
                  size="small"
                  color="info"
                  sx={{ fontSize: "10px", height: "20px" }}
                />
              )}
            </Stack>
          </>
        ) : (
          <MDTypography variant="body2" color="warning" fontWeight="regular">
            Henüz form seçilmedi
          </MDTypography>
        )}
      </Card>

      {/* Aktif/Pasif Durumu */}
      <Card sx={{ p: 2, mb: 2 }}>
        <MDBox sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <ToggleOnIcon sx={{ fontSize: 20, color: active ? "#10b981" : "#6b7280" }} />
          <MDTypography variant="caption" color="text" fontWeight="medium">
            WORKFLOW DURUMU
          </MDTypography>
        </MDBox>
        
        <FormControlLabel
          control={
            <Switch
              checked={active}
              onChange={handleActiveToggle}
              color="success"
            />
          }
          label={
            <MDTypography variant="body2" fontWeight="regular">
              {active ? "Aktif" : "Pasif"}
            </MDTypography>
          }
        />
        
        <MDTypography variant="caption" color="text" sx={{ opacity: 0.7, display: "block", mt: 1 }}>
          {active
            ? "✅ Workflow aktif ve kullanılabilir"
            : "⚠️ Workflow pasif - kullanıcılar başlatamaz"}
        </MDTypography>
      </Card>

      {/* Bilgi Notu */}
      <Card sx={{ p: 2, backgroundColor: "#fef3c7", border: "1px solid #fde047" }}>
        <MDTypography variant="caption" color="text" fontWeight="medium" sx={{ mb: 0.5, display: "block" }}>
          💡 BİLGİ
        </MDTypography>
        <MDTypography variant="caption" color="text" sx={{ opacity: 0.8 }}>
          Workflow&apos;u kaydetmeden önce tüm node&apos;ları bağladığınızdan ve ayarları kontrol ettiğinizden emin olun.
        </MDTypography>
      </Card>
    </MDBox>
  );
};

export default WorkflowSettingsTab;

