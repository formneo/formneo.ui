import React, { useEffect, useState } from "react";
import { PositionsApi, PositionListDto, CreatePositionDto, UpdatePositionDto } from "api/generated";
import getConfiguration from "confiuration";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";
import {
  Card,
  Typography,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  TextField,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

const defaultForm = { name: "", description: "", parentPositionId: "" };

function PositionManagement() {
  const [positions, setPositions] = useState<PositionListDto[]>([]);
  const [filteredPositions, setFilteredPositions] = useState<PositionListDto[]>([]);
  const [search, setSearch] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState<any>(defaultForm);
  const [editId, setEditId] = useState<string | null>(null);

  const fetchPositions = async () => {
    try {
      const conf = getConfiguration();
      const api = new PositionsApi(conf);
      const response = await api.apiPositionsGet();
      setPositions(response.data || []);
    } catch (error) {
      console.error("Pozisyon listesi alınırken hata oluştu:", error);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  useEffect(() => {
    let filtered = [...positions];
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (pos) =>
          pos.name?.toLowerCase().includes(searchLower) ||
          pos.description?.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredPositions(filtered);
  }, [positions, search]);

  const handleEdit = (pos: PositionListDto) => {
    setForm({
      name: pos.name || "",
      description: pos.description || "",
      parentPositionId: pos.parentPositionId || "",
    });
    setEditId(pos.id || null);
    setOpenDialog(true);
  };

  const handleDelete = async (id: string | null | undefined) => {
    if (!id) return;
    try {
      const conf = getConfiguration();
      const api = new PositionsApi(conf);
      await api.apiPositionsDelete(id);
      fetchPositions();
    } catch (error) {
      console.error("Pozisyon silinirken hata oluştu:", error);
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setForm(defaultForm);
    setEditId(null);
  };

  const handleSave = async () => {
    if (!form.name) return;
    try {
      const conf = getConfiguration();
      const api = new PositionsApi(conf);
      
      if (editId) {
        const updateDto: UpdatePositionDto = {
          id: editId,
          name: form.name || null,
          description: form.description || null,
          parentPositionId: form.parentPositionId || null,
        };
        await api.apiPositionsPut(updateDto);
      } else {
        const createDto: CreatePositionDto = {
          name: form.name || null,
          description: form.description || null,
          parentPositionId: form.parentPositionId || null,
        };
        await api.apiPositionsPost(createDto);
      }
      handleDialogClose();
      fetchPositions();
    } catch (error) {
      console.error("Pozisyon kaydedilirken hata oluştu:", error);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Card sx={{ p: 2, mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            Pozisyon Yönetimi
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <MDInput
                label="Ara (Pozisyon Adı/Açıklama)"
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <MDButton color="info" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>
                Yeni Pozisyon
              </MDButton>
            </Grid>
          </Grid>
        </Card>
        <Card>
          <Grid container sx={{ p: 2, fontWeight: 600, borderBottom: "1px solid #eee" }}>
            <Grid item xs={4}>Pozisyon Adı</Grid>
            <Grid item xs={4}>Açıklama</Grid>
            <Grid item xs={2}>Üst Pozisyon</Grid>
            <Grid item xs={2}>Aksiyonlar</Grid>
          </Grid>
          {filteredPositions.map(pos => (
            <Grid container key={pos.id} sx={{ p: 2, borderBottom: "1px solid #f5f5f5" }} alignItems="center">
              <Grid item xs={4}>{pos.name || "-"}</Grid>
              <Grid item xs={4}>{pos.description || "-"}</Grid>
              <Grid item xs={2}>{positions.find(p => p.id === pos.parentPositionId)?.name || "-"}</Grid>
              <Grid item xs={2}>
                <IconButton color="info" onClick={() => handleEdit(pos)}><EditIcon /></IconButton>
                <IconButton color="error" onClick={() => handleDelete(pos.id)}><DeleteIcon /></IconButton>
              </Grid>
            </Grid>
          ))}
          {filteredPositions.length === 0 && (
            <Typography align="center" sx={{ p: 3, color: "#aaa" }}>Kayıt bulunamadı.</Typography>
          )}
        </Card>
        <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
          <DialogTitle>{editId ? "Pozisyon Düzenle" : "Yeni Pozisyon"}</DialogTitle>
          <DialogContent>
            <MDInput
              label="Pozisyon Adı *"
              value={form.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            <TextField
              label="Açıklama"
              value={form.description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Üst Pozisyon</InputLabel>
              <Select
                value={form.parentPositionId || ""}
                label="Üst Pozisyon"
                onChange={e => setForm({ ...form, parentPositionId: e.target.value })}
              >
                <MenuItem value="">Yok</MenuItem>
                {positions.filter(p => !editId || p.id !== editId).map(p => (
                  <MenuItem key={p.id} value={p.id || ""}>{p.name || "-"}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <MDButton onClick={handleDialogClose} color="secondary">İptal</MDButton>
            <MDButton onClick={handleSave} color="info">Kaydet</MDButton>
          </DialogActions>
        </Dialog>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default PositionManagement;
