/**
 * 🏢 FormNeo - Süreç Merkezi View
 * Belirli bir workflow ve view tipi için veri görüntüleme sayfası
 * API'den gelen dataGridSchema ile dinamik kolonlar oluşturulur
 */

import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Box, Typography, Paper } from "@mui/material";
import * as MuiIcons from "@mui/icons-material";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import WorkflowInstancesGrid from "../WorkFlow/components/WorkflowInstancesGrid";

export default function ProcessHubView(): JSX.Element {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const workflowId = searchParams.get("workflowId");
  const viewType = searchParams.get("viewType");

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Box sx={{ maxWidth: 1200, mx: "auto" }}>
          {/* Header */}
          <Paper
            sx={{
              p: 3,
              mb: 3,
              borderRadius: "16px",
              background: "linear-gradient(135deg, #667eea22 0%, #667eea11 100%)",
              border: "1px solid #667eea33",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                  Süreç Görünümü
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Workflow ID: {workflowId || "Belirtilmemiş"}
                  <br />
                  View Type: {viewType || "Belirtilmemiş"}
                </Typography>
              </Box>
              <MDButton
                variant="outlined"
                color="secondary"
                startIcon={<MuiIcons.ArrowBack />}
                onClick={() => navigate("/process-hub")}
              >
                Geri Dön
              </MDButton>
            </Box>
          </Paper>

          {/* Grid - API'den dataGridSchema ile dinamik kolonlar */}
          {workflowId && viewType ? (
            <WorkflowInstancesGrid
              workflowId={workflowId}
              viewType={viewType}
              formDesign={null}
              height={650}
              onRowClick={(row) => console.log("Satıra tıklandı:", row)}
            />
          ) : (
            <Paper sx={{ p: 4, textAlign: "center", border: "1px dashed #e0e0e0" }}>
              <Typography color="text.secondary">workflowId ve viewType gerekli</Typography>
            </Paper>
          )}
        </Box>
      </MDBox>
    </DashboardLayout>
  );
}

