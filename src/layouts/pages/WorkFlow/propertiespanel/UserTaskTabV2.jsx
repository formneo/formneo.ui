import React, { useState, useEffect } from "react";
import {
  Form,
  FormItem,
  Input,
  Button,
  Title,
} from "@ui5/webcomponents-react";
import { 
  Grid, 
  TextField, 
  IconButton, 
  Typography, 
  Divider, 
  Autocomplete,
  Box,
  Paper,
  Chip,
} from "@mui/material";
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  AddCircle as CustomIcon,
} from "@mui/icons-material";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";
import { UserApi } from "api/generated";
import getConfiguration from "confiuration";
import { useBusy } from "layouts/pages/hooks/useBusy";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/**
 * ✅ Basit Drag-and-Drop UserTask Component
 * 
 * Özellikler:
 * - Sol tarafta hazır buton şablonları (Approve, Reject, Custom)
 * - Sağ tarafta seçilen butonların sıralanabilir listesi
 * - Drag-and-drop ile buton ekleme ve sıralama
 * - Her buton için action code zorunlu
 */

// Hazır buton şablonları
const BUTTON_TEMPLATES = [
  {
    id: "approve",
    label: "Onayla",
    action: "APPROVE",
    icon: <ApproveIcon />,
    color: "success",
    type: "primary",
  },
  {
    id: "reject",
    label: "Reddet",
    action: "REJECT",
    icon: <RejectIcon />,
    color: "error",
    type: "default",
  },
  {
    id: "custom",
    label: "Özel Buton",
    action: "CUSTOM",
    icon: <CustomIcon />,
    color: "info",
    type: "default",
  },
];

// Sortable Button Item Component
function SortableButtonItem({ button, index, onEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: button.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      sx={{
        p: 1.5,
        mb: 1,
        display: "flex",
        alignItems: "center",
        gap: 1,
        cursor: "grab",
        "&:hover": {
          boxShadow: 2,
        },
        border: "1px solid #e0e0e0",
      }}
    >
      <div
        {...attributes}
        {...listeners}
        style={{
          cursor: "grab",
          display: "flex",
          alignItems: "center",
          color: "#999",
        }}
      >
        <DragIcon />
      </div>
      
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" fontWeight={600}>
          {button.label || "İsimsiz Buton"}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          Action: {button.action || "Tanımlı değil"}
        </Typography>
      </Box>

      <Chip
        label={button.action || "NO_ACTION"}
        size="small"
        color={button.action ? "primary" : "error"}
        sx={{ fontSize: "0.7rem" }}
      />

      <IconButton
        size="small"
        onClick={() => onEdit(index)}
        color="primary"
      >
        <AddIcon fontSize="small" />
      </IconButton>

      <IconButton
        size="small"
        onClick={() => onDelete(index)}
        color="error"
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Paper>
  );
}

// Draggable Template Button Component
function DraggableTemplateButton({ template, onClick }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `template-${template.id}`,
    data: { template },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      sx={{
        p: 2,
        mb: 1,
        cursor: "grab",
        border: "2px dashed #ccc",
        "&:hover": {
          borderColor: "#1976d2",
          backgroundColor: "#f5f5f5",
        },
        "&:active": {
          cursor: "grabbing",
        },
        display: "flex",
        alignItems: "center",
        gap: 1,
      }}
      {...listeners}
      {...attributes}
      onClick={() => onClick && onClick(template)}
    >
      {template.icon}
      <Typography variant="body2" fontWeight={500}>
        {template.label}
      </Typography>
      <Chip
        label={template.action}
        size="small"
        color={template.color}
        sx={{ ml: "auto", fontSize: "0.7rem" }}
      />
    </Paper>
  );
}

// Drop Zone Component
function DropZone({ children }) {
  const { setNodeRef, isOver } = useDroppable({
    id: "button-drop-zone",
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        minHeight: "200px",
        backgroundColor: isOver ? "#e3f2fd" : "transparent",
        borderRadius: "4px",
        padding: isOver ? "8px" : "0",
        transition: "all 0.2s",
      }}
    >
      {children}
    </div>
  );
}

const UserTaskTabV2 = ({
  initialValues,
  node,
  onButtonClick,
}) => {
  const [name, setName] = useState(initialValues?.name || "Kullanıcı Görevi");
  const [fields, setFields] = useState(initialValues?.fields || []);
  const [buttons, setButtons] = useState(initialValues?.buttons || []);
  const [searchByName, setSearchByName] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingButtonIndex, setEditingButtonIndex] = useState(null);
  const [editingButton, setEditingButton] = useState(null);
  const dispatchBusy = useBusy();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (initialValues) {
      setName(initialValues.name || "Kullanıcı Görevi");
      setFields(initialValues.fields || []);
      setButtons(initialValues.buttons || []);
      if (initialValues.userId || initialValues.userName) {
        setSelectedUser({
          id: initialValues.userId,
          userName: initialValues.userName,
          firstName: initialValues.userFirstName,
          lastName: initialValues.userLastName,
        });
      }
    }
  }, [initialValues]);

  const handleSearchByName = async (value) => {
    if (value === "") {
      setSearchByName([]);
    } else {
      dispatchBusy({ isBusy: true });
      try {
        const conf = getConfiguration();
        const api = new UserApi(conf);
        const data = await api.apiUserGetAllUsersWithNameNameGet(value);
        const pureData = data.data;
        setSearchByName(pureData);
      } catch (error) {
        console.error("Kullanıcı arama hatası:", error);
        setSearchByName([]);
      } finally {
        dispatchBusy({ isBusy: false });
      }
    }
  };

  const handleAddField = () => {
    setFields([
      ...fields,
      {
        id: `field-${Date.now()}`,
        label: "",
        value: "",
        displayValue: "",
      },
    ]);
  };

  const handleDeleteField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index, field, value) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [field]: value };
    setFields(newFields);
  };

  // ✅ Drag-and-drop ile buton ekleme
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over) return;

    // Template'den sürükleniyorsa
    if (active.id.toString().startsWith("template-")) {
      const templateId = active.id.toString().replace("template-", "");
      const template = BUTTON_TEMPLATES.find((t) => t.id === templateId);
      if (template && over.id === "button-drop-zone") {
        const newButton = {
          id: `button-${Date.now()}`,
          label: template.label,
          action: template.action,
          type: template.type,
        };
        setButtons([...buttons, newButton]);
      }
      return;
    }

    // Butonlar arasında sıralama
    if (active.id !== over.id && !active.id.toString().startsWith("template-")) {
      const oldIndex = buttons.findIndex((b) => b.id === active.id);
      const newIndex = buttons.findIndex((b) => b.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        setButtons(arrayMove(buttons, oldIndex, newIndex));
      }
    }
  };

  // ✅ Template butonuna tıklayarak ekleme
  const handleTemplateClick = (template) => {
    const newButton = {
      id: `button-${Date.now()}`,
      label: template.label,
      action: template.action,
      type: template.type,
    };
    setButtons([...buttons, newButton]);
  };

  // ✅ Buton düzenleme
  const handleEditButton = (index) => {
    setEditingButtonIndex(index);
    setEditingButton({ ...buttons[index] });
  };

  // ✅ Buton kaydetme
  const handleSaveButton = () => {
    if (!editingButton || editingButtonIndex === null) return;

    if (!editingButton.label?.trim()) {
      alert("Buton etiketi gereklidir");
      return;
    }

    if (!editingButton.action?.trim()) {
      alert("Action Code zorunludur!");
      return;
    }

    const actionCode = editingButton.action.trim().toUpperCase().replace(/\s+/g, "_");
    
    const newButtons = [...buttons];
    newButtons[editingButtonIndex] = {
      ...editingButton,
      action: actionCode,
    };
    setButtons(newButtons);
    setEditingButton(null);
    setEditingButtonIndex(null);
  };

  // ✅ Buton silme
  const handleDeleteButton = (index) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (onButtonClick && node) {
      // Action code kontrolü
      const invalidButtons = buttons.filter((b) => !b.action || !b.action.trim());
      if (invalidButtons.length > 0) {
        alert("Lütfen tüm butonlar için Action Code tanımlayın!");
        return;
      }

      onButtonClick({
        id: node.id,
        data: {
          ...initialValues,
          name,
          fields: fields.filter((f) => f.label || f.value),
          buttons: buttons.filter((b) => b.label && b.action),
          userId: selectedUser?.id || selectedUser?.userAppId,
          userName: selectedUser?.userName,
          userFirstName: selectedUser?.firstName,
          userLastName: selectedUser?.lastName,
          assignedUserName: selectedUser ? `${selectedUser.firstName || ""} ${selectedUser.lastName || ""}`.trim() : "",
        },
      });
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      <Title level="H4" style={{ marginBottom: "16px" }}>
        Kullanıcı Görevi Özellikleri
      </Title>

      <Form>
        <FormItem label="Görev Adı">
          <Input
            value={name}
            onInput={(e: any) => setName(e.target.value)}
            placeholder="Kullanıcı görevi adı"
          />
        </FormItem>

        <Divider style={{ margin: "16px 0" }} />

        <Typography variant="h6" style={{ marginBottom: "8px" }}>
          Atanacak Kullanıcı
        </Typography>
        <Typography variant="body2" color="textSecondary" style={{ marginBottom: "16px" }}>
          Bu görevi hangi kullanıcıya atayacaksınız?
        </Typography>

        <Autocomplete
          sx={{ mb: 3 }}
          options={searchByName}
          getOptionLabel={(option) => {
            if (option.firstName && option.lastName) {
              return `${option.firstName} ${option.lastName}`;
            }
            return option.userAppName || option.userName || "";
          }}
          value={selectedUser}
          isOptionEqualToValue={(option, value) => {
            if (!option || !value) return false;
            return option.id === value.id || option.id === value.userAppId || option.userAppId === value.id;
          }}
          onChange={(event, newValue) => {
            setSelectedUser(newValue);
          }}
          onInputChange={(event, newInputValue) => {
            handleSearchByName(newInputValue);
          }}
          renderInput={(params) => (
            <MDInput
              {...params}
              size="large"
              placeholder="Kullanıcı ara..."
              label="Kullanıcı"
              inputProps={{ ...params.inputProps, sx: { height: "12px" } }}
            />
          )}
          renderOption={(props, option) => (
            <li {...props} key={option.id || option.userAppId}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 600 }}>
                  {option.firstName && option.lastName
                    ? `${option.firstName} ${option.lastName}`
                    : option.userAppName || option.userName}
                </span>
                {option.email && (
                  <span style={{ fontSize: "0.85em", color: "#666" }}>{option.email}</span>
                )}
                {option.userName && (
                  <span style={{ fontSize: "0.85em", color: "#666" }}>@{option.userName}</span>
                )}
              </div>
            </li>
          )}
        />

        {selectedUser && (
          <Typography variant="body2" color="success" style={{ marginBottom: "16px" }}>
            ✅ Seçili: {selectedUser.firstName} {selectedUser.lastName} ({selectedUser.userName})
          </Typography>
        )}

        <Divider style={{ margin: "16px 0" }} />

        <Typography variant="h6" style={{ marginBottom: "8px" }}>
          Gösterilecek Alanlar
        </Typography>
        <Typography variant="body2" color="textSecondary" style={{ marginBottom: "16px" }}>
          Kullanıcıya gösterilecek bilgileri ekleyin (Label - Value)
        </Typography>

        {fields.map((field, index) => (
          <Grid container spacing={2} key={field.id || index} style={{ marginBottom: "12px" }}>
            <Grid item xs={5}>
              <TextField
                fullWidth
                size="small"
                label="Label"
                value={field.label || ""}
                onChange={(e) => handleFieldChange(index, "label", e.target.value)}
                placeholder="Alan adı"
              />
            </Grid>
            <Grid item xs={5}>
              <TextField
                fullWidth
                size="small"
                label="Value"
                value={field.value || field.displayValue || ""}
                onChange={(e) => handleFieldChange(index, "value", e.target.value)}
                placeholder="Değer veya ${formField}"
              />
            </Grid>
            <Grid item xs={2}>
              <IconButton
                color="error"
                onClick={() => handleDeleteField(index)}
                size="small"
              >
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
        ))}

        <MDButton
          variant="outlined"
          color="info"
          size="small"
          onClick={handleAddField}
          startIcon={<AddIcon />}
          style={{ marginBottom: "16px" }}
        >
          Alan Ekle
        </MDButton>

        <Divider style={{ margin: "16px 0" }} />

        {/* ✅ YENİ: Drag-and-Drop Buton Yönetimi */}
        <Typography variant="h6" style={{ marginBottom: "8px" }}>
          Butonlar
        </Typography>
        <Typography variant="body2" color="textSecondary" style={{ marginBottom: "16px" }}>
          Hazır butonları sürükleyip ekleyin veya tıklayarak ekleyin. Butonları sürükleyerek sıralayabilirsiniz.
        </Typography>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Grid container spacing={2}>
            {/* Sol Panel: Hazır Buton Şablonları */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, backgroundColor: "#f8f9fa", minHeight: "200px" }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Hazır Butonlar
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: "block" }}>
                  Sürükleyip ekleyin veya tıklayın
                </Typography>
                
                {BUTTON_TEMPLATES.map((template) => (
                  <DraggableTemplateButton
                    key={template.id}
                    template={template}
                    onClick={handleTemplateClick}
                  />
                ))}
              </Paper>
            </Grid>

            {/* Sağ Panel: Seçilen Butonlar */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2, minHeight: "200px" }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Seçilen Butonlar ({buttons.length})
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: "block" }}>
                  Sürükleyerek sıralayabilirsiniz
                </Typography>

                <DropZone>
                  <SortableContext
                    items={buttons.map((b) => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {buttons.length === 0 ? (
                      <Box
                        sx={{
                          p: 4,
                          textAlign: "center",
                          border: "2px dashed #ccc",
                          borderRadius: 1,
                          color: "text.secondary",
                        }}
                      >
                        <Typography variant="body2">
                          Henüz buton eklenmedi. Sol taraftan buton sürükleyin veya tıklayın.
                        </Typography>
                      </Box>
                    ) : (
                      buttons.map((button, index) => (
                        <SortableButtonItem
                          key={button.id}
                          button={button}
                          index={index}
                          onEdit={handleEditButton}
                          onDelete={handleDeleteButton}
                        />
                      ))
                    )}
                  </SortableContext>
                </DropZone>
              </Paper>
            </Grid>
          </Grid>
        </DndContext>

        {/* Buton Düzenleme Modal */}
        {editingButton && editingButtonIndex !== null && (
          <Paper sx={{ p: 2, mt: 2, backgroundColor: "#fff3cd" }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Buton Düzenle
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Buton Label"
                  value={editingButton.label || ""}
                  onChange={(e) => setEditingButton({ ...editingButton, label: e.target.value })}
                  placeholder="Buton adı"
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Action Code (Zorunlu)"
                  value={editingButton.action || ""}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/\s+/g, "_");
                    setEditingButton({ ...editingButton, action: value });
                  }}
                  placeholder="APPROVE, REJECT, vb."
                  required
                  error={!editingButton.action || !editingButton.action.trim()}
                  helperText={!editingButton.action ? "Action Code zorunludur!" : ""}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <MDButton
                    variant="gradient"
                    color="success"
                    size="small"
                    onClick={handleSaveButton}
                  >
                    Kaydet
                  </MDButton>
                  <MDButton
                    variant="outlined"
                    color="secondary"
                    size="small"
                    onClick={() => {
                      setEditingButton(null);
                      setEditingButtonIndex(null);
                    }}
                  >
                    İptal
                  </MDButton>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}

        <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
          <Button design="Emphasized" onClick={handleSave}>
            Kaydet
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default UserTaskTabV2;

