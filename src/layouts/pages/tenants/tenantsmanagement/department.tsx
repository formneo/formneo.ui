import React, { useEffect, useState } from "react";
import { OrgUnitsApi, OrgUnitListDto, OrgUnitInsertDto, OrgUnitUpdateDto } from "api/generated";
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
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

const defaultForm = { name: "", code: "", parentOrgUnitId: "", isActive: true };

function DepartmentManagement() {
  const [orgUnits, setOrgUnits] = useState<OrgUnitListDto[]>([]);
  const [filteredOrgUnits, setFilteredOrgUnits] = useState<OrgUnitListDto[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState<any>(defaultForm);
  const [editId, setEditId] = useState<string | null>(null);

  const fetch = async () => {
    try {
      const conf = getConfiguration();
      const api = new OrgUnitsApi(conf);
      const response = await api.apiOrgUnitsGet();
      setOrgUnits(response.data || []);
    } catch (error) {
      console.error("OrgUnit listesi alınırken hata oluştu:", error);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  useEffect(() => {
    let filtered = [...orgUnits];
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (unit) =>
          unit.name?.toLowerCase().includes(searchLower) ||
          unit.code?.toLowerCase().includes(searchLower)
      );
    }
    
    // Active filter
    if (activeFilter === "active") {
      filtered = filtered.filter((unit) => unit.isActive === true);
    } else if (activeFilter === "passive") {
      filtered = filtered.filter((unit) => unit.isActive === false);
    }
    
    setFilteredOrgUnits(filtered);
  }, [orgUnits, search, activeFilter]);

  const handleEdit = (unit: OrgUnitListDto) => {
    setForm({
      name: unit.name || "",
      code: unit.code || "",
      parentOrgUnitId: unit.parentOrgUnitId || "",
      isActive: unit.isActive ?? true,
    });
    setEditId(unit.id || null);
    setOpenDialog(true);
  };

  const handleDelete = async (id: string | null | undefined) => {
    if (!id) return;
    try {
      const conf = getConfiguration();
      const api = new OrgUnitsApi(conf);
      await api.apiOrgUnitsIdDelete(id);
      fetch();
    } catch (error) {
      console.error("OrgUnit silinirken hata oluştu:", error);
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
      const api = new OrgUnitsApi(conf);
      
      if (editId) {
        const updateDto: OrgUnitUpdateDto = {
          id: editId,
          name: form.name || null,
          code: form.code || null,
          parentOrgUnitId: form.parentOrgUnitId || null,
          isActive: form.isActive ?? true,
        };
        await api.apiOrgUnitsPut(updateDto);
      } else {
        const insertDto: OrgUnitInsertDto = {
          name: form.name || null,
          code: form.code || null,
          parentOrgUnitId: form.parentOrgUnitId || null,
          isActive: form.isActive ?? true,
        };
        await api.apiOrgUnitsPost(insertDto);
      }
      handleDialogClose();
      fetch();
    } catch (error) {
      console.error("OrgUnit kaydedilirken hata oluştu:", error);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Card sx={{ p: 2, mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            Departman Yönetimi
          </Typography>
          <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <MDInput
              label="Ara (Ad/Kod)"
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Aktif/Pasif</InputLabel>
              <Select
                value={activeFilter}
                label="Aktif/Pasif"
                onChange={e => setActiveFilter(e.target.value)}
              >
                <MenuItem value="all">Tümü</MenuItem>
                <MenuItem value="active">Aktif</MenuItem>
                <MenuItem value="passive">Pasif</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <MDButton color="info" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>
              Yeni Departman
            </MDButton>
          </Grid>
        </Grid>
      </Card>
      <Card>
        <Grid container sx={{ p: 2, fontWeight: 600, borderBottom: "1px solid #eee" }}>
          <Grid item xs={3}>Ad</Grid>
          <Grid item xs={2}>Kod</Grid>
          <Grid item xs={3}>Bağlı Departman</Grid>
          <Grid item xs={2}>Durum</Grid>
          <Grid item xs={2}>Aksiyonlar</Grid>
        </Grid>
        {filteredOrgUnits.map(unit => (
          <Grid container key={unit.id} sx={{ p: 2, borderBottom: "1px solid #f5f5f5" }} alignItems="center">
            <Grid item xs={3}>{unit.name || "-"}</Grid>
            <Grid item xs={2}>{unit.code || "-"}</Grid>
            <Grid item xs={3}>{orgUnits.find(d => d.id === unit.parentOrgUnitId)?.name || "-"}</Grid>
            <Grid item xs={2}>
              <Switch checked={unit.isActive ?? false} disabled />
              {unit.isActive ? "Aktif" : "Pasif"}
            </Grid>
            <Grid item xs={2}>
              <IconButton color="info" onClick={() => handleEdit(unit)}><EditIcon /></IconButton>
              <IconButton color="error" onClick={() => handleDelete(unit.id)}><DeleteIcon /></IconButton>
            </Grid>
          </Grid>
        ))}
        {filteredOrgUnits.length === 0 && (
          <Typography align="center" sx={{ p: 3, color: "#aaa" }}>Kayıt bulunamadı.</Typography>
        )}
      </Card>
      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? "Departman Düzenle" : "Yeni Departman"}</DialogTitle>
        <DialogContent>
          <MDInput
            label="Ad *"
            value={form.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <MDInput
            label="Kod"
            value={form.code}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, code: e.target.value })}
            fullWidth
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Bağlı Departman</InputLabel>
            <Select
              value={form.parentOrgUnitId || ""}
              label="Bağlı Departman"
              onChange={e => setForm({ ...form, parentOrgUnitId: e.target.value })}
            >
              <MenuItem value="">Yok</MenuItem>
              {orgUnits.filter(d => !editId || d.id !== editId).map(d => (
                <MenuItem key={d.id} value={d.id || ""}>{d.name || "-"}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={form.isActive}
                onChange={e => setForm({ ...form, isActive: e.target.checked })}
              />
            }
            label="Aktif"
          />
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

export default DepartmentManagement;
