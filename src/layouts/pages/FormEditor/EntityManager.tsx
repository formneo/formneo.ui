import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tooltip,
  Divider,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  TableChart as TableIcon,
  ViewColumn as ColumnIcon,
  KeyboardArrowDown,
  KeyboardArrowRight,
} from "@mui/icons-material";

// Entity ve Field tipleri
export interface EntityField {
  id: string;
  name: string;
  type: "string" | "number" | "boolean" | "date" | "datetime" | "reference";
  required: boolean;
  unique: boolean;
  defaultValue?: string;
  referenceEntity?: string; // reference type için
  description?: string;
}

export interface Entity {
  id: string;
  name: string;
  description?: string;
  fields: EntityField[];
  collapsed?: boolean;
}

interface EntityManagerProps {
  entities: Entity[];
  onEntitiesChange: (entities: Entity[]) => void;
}

const FIELD_TYPES = [
  { value: "string", label: "String (Metin)", icon: "📝" },
  { value: "number", label: "Number (Sayı)", icon: "🔢" },
  { value: "boolean", label: "Boolean (Evet/Hayır)", icon: "✓" },
  { value: "date", label: "Date (Tarih)", icon: "📅" },
  { value: "datetime", label: "DateTime (Tarih/Saat)", icon: "🕐" },
  { value: "reference", label: "Reference (İlişki)", icon: "🔗" },
];

export default function EntityManager({ entities, onEntitiesChange }: EntityManagerProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [currentEntity, setCurrentEntity] = useState<Entity | null>(null);
  const [currentField, setCurrentField] = useState<EntityField | null>(null);
  const [editingEntityId, setEditingEntityId] = useState<string | null>(null);

  // Entity Ekle/Düzenle
  const handleSaveEntity = () => {
    if (!currentEntity || !currentEntity.name.trim()) {
      alert("Entity adı gerekli!");
      return;
    }

    if (editingEntityId) {
      // Düzenleme
      onEntitiesChange(
        entities.map((e) =>
          e.id === editingEntityId ? { ...currentEntity, id: editingEntityId } : e
        )
      );
    } else {
      // Yeni ekleme
      onEntitiesChange([
        ...entities,
        { ...currentEntity, id: Date.now().toString(), fields: [] },
      ]);
    }

    setEditDialogOpen(false);
    setCurrentEntity(null);
    setEditingEntityId(null);
  };

  // Field Ekle/Düzenle
  const handleSaveField = () => {
    if (!currentField || !currentField.name.trim() || !editingEntityId) {
      alert("Field adı gerekli!");
      return;
    }

    onEntitiesChange(
      entities.map((entity) => {
        if (entity.id === editingEntityId) {
          const existingFieldIndex = entity.fields.findIndex(
            (f) => f.id === currentField.id
          );

          if (existingFieldIndex >= 0) {
            // Düzenleme
            const updatedFields = [...entity.fields];
            updatedFields[existingFieldIndex] = currentField;
            return { ...entity, fields: updatedFields };
          } else {
            // Yeni ekleme
            return {
              ...entity,
              fields: [...entity.fields, { ...currentField, id: Date.now().toString() }],
            };
          }
        }
        return entity;
      })
    );

    setFieldDialogOpen(false);
    setCurrentField(null);
  };

  // Entity Sil
  const handleDeleteEntity = (entityId: string) => {
    if (window.confirm("Bu entity'yi silmek istediğinizden emin misiniz?")) {
      onEntitiesChange(entities.filter((e) => e.id !== entityId));
    }
  };

  // Field Sil
  const handleDeleteField = (entityId: string, fieldId: string) => {
    if (window.confirm("Bu field'ı silmek istediğinizden emin misiniz?")) {
      onEntitiesChange(
        entities.map((entity) =>
          entity.id === entityId
            ? { ...entity, fields: entity.fields.filter((f) => f.id !== fieldId) }
            : entity
        )
      );
    }
  };

  // Entity Collapse Toggle
  const toggleEntityCollapse = (entityId: string) => {
    onEntitiesChange(
      entities.map((e) =>
        e.id === entityId ? { ...e, collapsed: !e.collapsed } : e
      )
    );
  };

  // Field tipi için ikon
  const getFieldTypeIcon = (type: string) => {
    return FIELD_TYPES.find((t) => t.value === type)?.icon || "📄";
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: "#fafafa" }}>
      {/* Compact Header */}
      <Box
        sx={{
          p: 0.75,
          bgcolor: "#fff",
          borderBottom: "1px solid #e0e0e0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Button
          variant="contained"
          fullWidth
          size="small"
          startIcon={<AddIcon sx={{ fontSize: 14 }} />}
          onClick={() => {
            setCurrentEntity({ id: "", name: "", fields: [] });
            setEditingEntityId(null);
            setEditDialogOpen(true);
          }}
          sx={{
            textTransform: "none",
            bgcolor: "#1976d2",
            fontSize: "0.75rem",
            py: 0.5,
            minHeight: "32px",
            "&:hover": { bgcolor: "#1565c0" },
          }}
        >
          New Entity
        </Button>
      </Box>

      {/* Entity Listesi */}
      <Box sx={{ flex: 1, overflow: "auto", p: 1 }}>
        {entities.length === 0 ? (
          <Box
            sx={{
              textAlign: "center",
              py: 2,
              color: "#999",
            }}
          >
            <Typography variant="caption" sx={{ fontSize: "0.75rem" }}>
              Henüz entity tanımlanmamış
              <br />
              &quot;New Entity&quot; butonuna tıklayarak başlayın
            </Typography>
          </Box>
        ) : (
          entities.map((entity) => (
            <Paper
              key={entity.id}
              sx={{
                mb: 1,
                border: "1px solid #e0e0e0",
                borderRadius: 1,
                overflow: "hidden",
              }}
            >
              {/* Entity Header */}
              <Box
                sx={{
                  p: 0.75,
                  px: 1,
                  bgcolor: "#f5f5f5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "#eeeeee" },
                }}
                onClick={() => toggleEntityCollapse(entity.id)}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <IconButton size="small" sx={{ p: 0.25 }}>
                    {entity.collapsed ? <KeyboardArrowRight sx={{ fontSize: 16 }} /> : <KeyboardArrowDown sx={{ fontSize: 16 }} />}
                  </IconButton>
                  <TableIcon sx={{ color: "#1976d2", fontSize: 16 }} />
                  <Typography fontWeight={600} sx={{ color: "#333", fontSize: "0.813rem" }}>
                    {entity.name}
                  </Typography>
                  <Chip
                    label={`${entity.fields.length}`}
                    size="small"
                    sx={{ height: 16, fontSize: "0.65rem", minWidth: 24 }}
                  />
                </Box>
                <Box sx={{ display: "flex", gap: 0.25 }}>
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      sx={{ p: 0.25 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentEntity(entity);
                        setEditingEntityId(entity.id);
                        setEditDialogOpen(true);
                      }}
                    >
                      <EditIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      sx={{ p: 0.25 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEntity(entity.id);
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Entity Fields */}
              {!entity.collapsed && (
                <Box sx={{ bgcolor: "#fff" }}>
                  {entity.description && (
                    <Box sx={{ px: 1, pt: 0.5, pb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                        {entity.description}
                      </Typography>
                    </Box>
                  )}
                  
                  {entity.fields.length === 0 ? (
                    <Box sx={{ p: 1, textAlign: "center", color: "#999" }}>
                      <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
                        Henüz field eklenmemiş
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ px: 0.5, pb: 0.5 }}>
                      {entity.fields.map((field) => (
                        <Box
                          key={field.id}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            p: 0.5,
                            px: 0.75,
                            mx: 0.5,
                            my: 0.25,
                            borderRadius: 0.5,
                            bgcolor: "#fafafa",
                            border: "1px solid #e8e8e8",
                            "&:hover": {
                              bgcolor: "#f0f0f0",
                              "& .field-actions": { opacity: 1 },
                            },
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flex: 1, flexWrap: "wrap" }}>
                            <ColumnIcon sx={{ fontSize: 12, color: "#666" }} />
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              sx={{ color: "#333", fontSize: "0.75rem" }}
                            >
                              {field.name}
                            </Typography>
                            <Chip
                              label={`${getFieldTypeIcon(field.type)} ${field.type}`}
                              size="small"
                              sx={{
                                height: 16,
                                fontSize: "0.6rem",
                                bgcolor: "#e3f2fd",
                                color: "#1976d2",
                              }}
                            />
                            {field.required && (
                              <Chip
                                label="Req"
                                size="small"
                                sx={{
                                  height: 16,
                                  fontSize: "0.6rem",
                                  bgcolor: "#ffebee",
                                  color: "#c62828",
                                }}
                              />
                            )}
                            {field.unique && (
                              <Chip
                                label="Uniq"
                                size="small"
                                sx={{
                                  height: 16,
                                  fontSize: "0.6rem",
                                  bgcolor: "#fff3e0",
                                  color: "#ef6c00",
                                }}
                              />
                            )}
                            {field.type === "reference" && field.referenceEntity && (
                              <Chip
                                label={`→ ${field.referenceEntity}`}
                                size="small"
                                sx={{
                                  height: 16,
                                  fontSize: "0.6rem",
                                  bgcolor: "#f3e5f5",
                                  color: "#7b1fa2",
                                }}
                              />
                            )}
                          </Box>
                          <Box
                            className="field-actions"
                            sx={{ display: "flex", gap: 0.25, opacity: 0, transition: "opacity 0.2s" }}
                          >
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                sx={{ p: 0.25 }}
                                onClick={() => {
                                  setCurrentField(field);
                                  setEditingEntityId(entity.id);
                                  setFieldDialogOpen(true);
                                }}
                              >
                                <EditIcon sx={{ fontSize: 12 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                sx={{ p: 0.25 }}
                                onClick={() => handleDeleteField(entity.id, field.id)}
                              >
                                <DeleteIcon sx={{ fontSize: 12 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}

                  {/* Add Field Button */}
                  <Box sx={{ p: 0.75, pt: 0.5 }}>
                    <Button
                      fullWidth
                      size="small"
                      variant="outlined"
                      startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                      onClick={() => {
                        setCurrentField({
                          id: "",
                          name: "",
                          type: "string",
                          required: false,
                          unique: false,
                        });
                        setEditingEntityId(entity.id);
                        setFieldDialogOpen(true);
                      }}
                      sx={{
                        textTransform: "none",
                        borderStyle: "dashed",
                        color: "#1976d2",
                        borderColor: "#1976d2",
                        fontSize: "0.75rem",
                        py: 0.25,
                        minHeight: "28px",
                        "&:hover": {
                          bgcolor: "#e3f2fd",
                          borderColor: "#1565c0",
                        },
                      }}
                    >
                      Add Field
                    </Button>
                  </Box>
                </Box>
              )}
            </Paper>
          ))
        )}
      </Box>

      {/* Entity Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingEntityId ? "Edit Entity" : "New Entity"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Entity Name *"
              fullWidth
              value={currentEntity?.name || ""}
              onChange={(e) =>
                setCurrentEntity((prev) => ({ ...prev!, name: e.target.value }))
              }
              placeholder="ör: Customer, Product, Order"
              helperText="Entity adı (tablo adı)"
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              value={currentEntity?.description || ""}
              onChange={(e) =>
                setCurrentEntity((prev) => ({ ...prev!, description: e.target.value }))
              }
              placeholder="Entity açıklaması (opsiyonel)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>İptal</Button>
          <Button variant="contained" onClick={handleSaveEntity}>
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Field Dialog */}
      <Dialog
        open={fieldDialogOpen}
        onClose={() => setFieldDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {currentField?.id ? "Edit Field" : "New Field"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Field Name *"
              fullWidth
              value={currentField?.name || ""}
              onChange={(e) =>
                setCurrentField((prev) => ({ ...prev!, name: e.target.value }))
              }
              placeholder="ör: email, price, isActive"
              helperText="Field adı (kolon adı)"
            />

            <FormControl fullWidth>
              <InputLabel>Field Type *</InputLabel>
              <Select
                value={currentField?.type || "string"}
                label="Field Type *"
                onChange={(e) =>
                  setCurrentField((prev) => ({
                    ...prev!,
                    type: e.target.value as any,
                  }))
                }
                renderValue={(value) => {
                  const selectedType = FIELD_TYPES.find((t) => t.value === value);
                  return (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box component="span" sx={{ fontSize: "1.2rem" }}>
                        {selectedType?.icon}
                      </Box>
                      <Typography variant="body2">
                        {selectedType?.label}
                      </Typography>
                    </Box>
                  );
                }}
                sx={{
                  "& .MuiSelect-select": {
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  },
                }}
              >
                {FIELD_TYPES.map((type) => (
                  <MenuItem 
                    key={type.value} 
                    value={type.value}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      py: 1.5,
                      "&:hover": {
                        bgcolor: "#f5f5f5",
                      },
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        fontSize: "1.5rem",
                        lineHeight: 1,
                        display: "inline-flex",
                        alignItems: "center",
                        minWidth: "32px",
                        justifyContent: "center",
                      }}
                    >
                      {type.icon}
                    </Box>
                    <Box
                      component="span"
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                      }}
                    >
                      <Typography variant="body2" fontWeight={600}>
                        {type.value.charAt(0).toUpperCase() + type.value.slice(1)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {type.label}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {currentField?.type === "reference" && (
              <FormControl fullWidth>
                <InputLabel>Reference Entity</InputLabel>
                <Select
                  value={currentField?.referenceEntity || ""}
                  label="Reference Entity"
                  onChange={(e) =>
                    setCurrentField((prev) => ({
                      ...prev!,
                      referenceEntity: e.target.value,
                    }))
                  }
                  renderValue={(value) => {
                    if (!value) return <em>Select an entity...</em>;
                    return (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <TableIcon sx={{ fontSize: 18, color: "#1976d2" }} />
                        <Typography variant="body2">{value}</Typography>
                      </Box>
                    );
                  }}
                >
                  {entities
                    .filter((e) => e.id !== editingEntityId)
                    .map((entity) => (
                      <MenuItem 
                        key={entity.id} 
                        value={entity.name}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          py: 1.5,
                          "&:hover": {
                            bgcolor: "#f5f5f5",
                          },
                        }}
                      >
                        <TableIcon sx={{ fontSize: 18, color: "#1976d2" }} />
                        <Typography variant="body2">{entity.name}</Typography>
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            )}

            <TextField
              label="Default Value"
              fullWidth
              value={currentField?.defaultValue || ""}
              onChange={(e) =>
                setCurrentField((prev) => ({
                  ...prev!,
                  defaultValue: e.target.value,
                }))
              }
              placeholder="Varsayılan değer (opsiyonel)"
            />

            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              value={currentField?.description || ""}
              onChange={(e) =>
                setCurrentField((prev) => ({
                  ...prev!,
                  description: e.target.value,
                }))
              }
              placeholder="Field açıklaması (opsiyonel)"
            />

            <Divider />

            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={currentField?.required || false}
                    onChange={(e) =>
                      setCurrentField((prev) => ({
                        ...prev!,
                        required: e.target.checked,
                      }))
                    }
                  />
                }
                label="Required (Zorunlu)"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={currentField?.unique || false}
                    onChange={(e) =>
                      setCurrentField((prev) => ({
                        ...prev!,
                        unique: e.target.checked,
                      }))
                    }
                  />
                }
                label="Unique (Benzersiz)"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFieldDialogOpen(false)}>İptal</Button>
          <Button variant="contained" onClick={handleSaveField}>
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
