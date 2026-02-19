/**
 * GridSchemaEditor - Grid kolonlarını düzenleme (label değiştir, sırala, ekle/çıkar)
 * Şema veritabanına (workflow defination içinde) kaydedilir.
 */
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  Typography,
  Divider,
} from "@mui/material";
import * as MuiIcons from "@mui/icons-material";
import { extractFieldsFromFormDesign } from "../utils/formDesignFields";
import type { GridColumnSchema, GridSchema } from "../types/gridSchema";

export interface GridSchemaEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (schema: GridSchema) => void;
  /** Mevcut şema (DB'den yüklenmiş) */
  initialSchema: GridSchema;
  /** Form tasarımı - form alanlarından ekleme için */
  formDesign: string | object | null;
}

export default function GridSchemaEditor({
  open,
  onClose,
  onSave,
  initialSchema,
  formDesign,
}: GridSchemaEditorProps): JSX.Element {
  const [schema, setSchema] = useState<GridSchema>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingLabel, setEditingLabel] = useState("");

  useEffect(() => {
    setSchema(open ? [...initialSchema] : []);
    setEditingIndex(null);
    setEditingLabel("");
  }, [open, initialSchema]);

  const formFields = React.useMemo(
    () => extractFieldsFromFormDesign(formDesign),
    [formDesign]
  );

  const addColumn = (field: { name: string; label: string; type?: string; valueEditorType?: string; values?: any[] }) => {
    if (schema.some((c) => c.fieldKey === field.name)) return;
    const newCol: GridColumnSchema = {
      fieldKey: field.name,
      label: field.label,
      width: 140,
      order: schema.length,
      type: (field.type as GridColumnSchema["type"]) || "string",
      valueEditorType: field.valueEditorType,
      values: field.values,
    };
    setSchema((prev) => [...prev, newCol]);
  };

  const removeColumn = (index: number) => {
    setSchema((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
    else if (editingIndex !== null && editingIndex > index) setEditingIndex(editingIndex - 1);
  };

  const moveUp = (index: number) => {
    if (index <= 0) return;
    setSchema((prev) => {
      const arr = [...prev];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return arr;
    });
    if (editingIndex === index) setEditingIndex(index - 1);
    else if (editingIndex === index - 1) setEditingIndex(index);
  };

  const moveDown = (index: number) => {
    if (index >= schema.length - 1) return;
    setSchema((prev) => {
      const arr = [...prev];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      return arr;
    });
    if (editingIndex === index) setEditingIndex(index + 1);
    else if (editingIndex === index + 1) setEditingIndex(index);
  };

  const startEditLabel = (index: number) => {
    setEditingIndex(index);
    setEditingLabel(schema[index].label);
  };

  const saveEditLabel = () => {
    if (editingIndex !== null && editingLabel.trim()) {
      setSchema((prev) =>
        prev.map((c, i) => (i === editingIndex ? { ...c, label: editingLabel.trim() } : c))
      );
      setEditingIndex(null);
      setEditingLabel("");
    }
  };

  const handleSave = () => {
    onSave(schema.map((c, i) => ({ ...c, order: i })));
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Grid Düzenle</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Kolonları sıralayın, label&apos;ları değiştirin. Kaydet&apos;e basınca şema güncellenir. Veritabanına yazmak için workflow Kaydet butonuna basın.
        </Typography>

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Grid Kolonları
        </Typography>
        <List dense sx={{ border: "1px solid #e0e0e0", borderRadius: 1, mb: 2 }}>
          {schema.map((col, index) => (
            <ListItem key={col.fieldKey} divider={index < schema.length - 1}>
              {editingIndex === index ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
                  <TextField
                    size="small"
                    value={editingLabel}
                    onChange={(e) => setEditingLabel(e.target.value)}
                    onBlur={saveEditLabel}
                    onKeyDown={(e) => e.key === "Enter" && saveEditLabel()}
                    autoFocus
                    sx={{ flex: 1 }}
                  />
                  <IconButton size="small" onClick={saveEditLabel}>
                    <MuiIcons.Check />
                  </IconButton>
                </Box>
              ) : (
                <>
                  <ListItemText
                    primary={col.label}
                    secondary={<Typography variant="caption" color="text.secondary">{col.fieldKey}</Typography>}
                  />
                  <ListItemSecondaryAction>
                    <IconButton size="small" onClick={() => startEditLabel(index)} title="Label düzenle">
                      <MuiIcons.Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => moveUp(index)} disabled={index === 0} title="Yukarı">
                      <MuiIcons.ArrowUpward fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => moveDown(index)} disabled={index === schema.length - 1} title="Aşağı">
                      <MuiIcons.ArrowDownward fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => removeColumn(index)} title="Kaldır">
                      <MuiIcons.Delete fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </>
              )}
            </ListItem>
          ))}
          {schema.length === 0 && (
            <ListItem>
              <ListItemText primary="Henüz kolon yok. Aşağıdan form alanı ekleyin." />
            </ListItem>
          )}
        </List>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Form Alanlarından Ekle
        </Typography>
        <List dense sx={{ border: "1px solid #e0e0e0", borderRadius: 1, maxHeight: 200, overflow: "auto" }}>
          {formFields
            .filter((f) => !schema.some((c) => c.fieldKey === f.name))
            .map((field) => (
              <ListItem key={field.name}>
                <ListItemText primary={field.label} secondary={field.name} />
                <IconButton size="small" color="primary" onClick={() => addColumn(field)} title="Ekle">
                  <MuiIcons.Add />
                </IconButton>
              </ListItem>
            ))}
          {formFields.filter((f) => !schema.some((c) => c.fieldKey === f.name)).length === 0 && (
            <ListItem>
              <ListItemText primary="Tüm form alanları eklendi veya form alanı yok." />
            </ListItem>
          )}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>İptal</Button>
        <Button variant="contained" onClick={handleSave} startIcon={<MuiIcons.Save />}>
          Kaydet
        </Button>
      </DialogActions>
    </Dialog>
  );
}
