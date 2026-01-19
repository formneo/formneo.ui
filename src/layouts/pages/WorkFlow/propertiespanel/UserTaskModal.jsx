import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Box,
  Typography,
  TextField,
  IconButton,
  Autocomplete,
  Paper,
  Chip,
  Divider,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  AddCircle as CustomIcon,
  Close as CloseIcon,
  TextFields as TextFieldsIcon,
  Notes as NotesIcon,
  CalendarToday as CalendarIcon,
  List as ListIcon,
  CheckBox as CheckBoxIcon,
  Numbers as NumbersIcon,
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  Visibility as VisibilityIcon,
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
 * ✅ Basit Sürükle-Bırak UserTask Component
 * 
 * Özellikler:
 * - Sol tarafta form component'leri (sürüklenebilir)
 * - Sağ tarafta form alanları listesi (sıralanabilir)
 * - Butonlar için ayrı drag-and-drop panel
 * - Çok basit ve kullanıcı dostu
 */

// Form Component Şablonları
const FORM_COMPONENTS = [
  {
    id: "input",
    type: "Input",
    label: "Metin Alanı",
    icon: <TextFieldsIcon />,
    color: "#1976d2",
  },
  {
    id: "textarea",
    type: "TextArea",
    label: "Çok Satırlı Metin",
    icon: <NotesIcon />,
    color: "#2e7d32",
  },
  {
    id: "number",
    type: "Number",
    label: "Sayı",
    icon: <NumbersIcon />,
    color: "#ed6c02",
  },
  {
    id: "date",
    type: "Date",
    label: "Tarih",
    icon: <CalendarIcon />,
    color: "#9c27b0",
  },
  {
    id: "select",
    type: "Select",
    label: "Seçim Listesi",
    icon: <ListIcon />,
    color: "#d32f2f",
  },
  {
    id: "checkbox",
    type: "Checkbox",
    label: "Onay Kutusu",
    icon: <CheckBoxIcon />,
    color: "#0288d1",
  },
];

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

// Draggable Form Component
function DraggableFormComponent({ component, onClick }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `component-${component.id}`,
    data: { component },
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
        p: 1.5,
        mb: 1,
        cursor: "grab",
        border: `2px solid ${component.color}`,
        backgroundColor: `${component.color}08`,
        "&:hover": {
          borderColor: component.color,
          backgroundColor: `${component.color}15`,
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
      onClick={() => onClick && onClick(component)}
    >
      <Box sx={{ color: component.color }}>{component.icon}</Box>
      <Typography variant="body2" fontWeight={500}>
        {component.label}
      </Typography>
    </Paper>
  );
}

// Sortable Form Field Item
function SortableFormFieldItem({ field, index, onEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const componentInfo = FORM_COMPONENTS.find((c) => c.type === field.type) || FORM_COMPONENTS[0];

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      sx={{
        p: 1.5,
        mb: 1,
        cursor: "grab",
        "&:hover": {
          boxShadow: 2,
        },
        border: "1px solid #e0e0e0",
      }}
    >
      <Box display="flex" alignItems="center" gap={1}>
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

        <Box sx={{ color: componentInfo.color }}>{componentInfo.icon}</Box>

        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" fontWeight={600}>
            {field.label || "İsimsiz Alan"}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {field.type} {field.required && "(Zorunlu)"}
          </Typography>
        </Box>

        <IconButton size="small" onClick={() => onEdit(index)} color="primary">
          <AddIcon fontSize="small" />
        </IconButton>

        <IconButton size="small" onClick={() => onDelete(index)} color="error">
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    </Paper>
  );
}

// Sortable Button Item
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
        cursor: "grab",
        "&:hover": {
          boxShadow: 2,
        },
        border: "1px solid #e0e0e0",
      }}
    >
      <Box display="flex" alignItems="center" gap={1}>
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

        <IconButton size="small" onClick={() => onEdit(index)} color="primary">
          <AddIcon fontSize="small" />
        </IconButton>

        <IconButton size="small" onClick={() => onDelete(index)} color="error">
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    </Paper>
  );
}

// Draggable Template Button
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
        p: 1.5,
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

// Drop Zone
function DropZone({ children, id }) {
  const { setNodeRef, isOver } = useDroppable({
    id,
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

const UserTaskModal = ({ open, onClose, initialValues, node, onSave }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [name, setName] = useState(initialValues?.name || "Kullanıcı Görevi");
  const [fields, setFields] = useState(initialValues?.fields || []);
  const [buttons, setButtons] = useState(initialValues?.buttons || []);
  const [searchByName, setSearchByName] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingFieldIndex, setEditingFieldIndex] = useState(null);
  const [editingField, setEditingField] = useState(null);
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
        const data = await api.apiUserGetAllUsersWithNameGet(value);
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

  // ✅ Drag-and-drop ile form alanı ekleme
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over) return;

    // Form component'inden sürükleniyorsa
    if (active.id.toString().startsWith("component-")) {
      const componentId = active.id.toString().replace("component-", "");
      const component = FORM_COMPONENTS.find((c) => c.id === componentId);
      if (component && over.id === "fields-drop-zone") {
        const newField = {
          id: `field-${Date.now()}`,
          type: component.type,
          label: component.label,
          required: false,
          placeholder: "",
        };
        setFields([...fields, newField]);
      }
      return;
    }

    // Template butonundan sürükleniyorsa
    if (active.id.toString().startsWith("template-")) {
      const templateId = active.id.toString().replace("template-", "");
      const template = BUTTON_TEMPLATES.find((t) => t.id === templateId);
      if (template && over.id === "buttons-drop-zone") {
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

    // Form alanları arasında sıralama
    if (active.id !== over.id && !active.id.toString().startsWith("component-") && !active.id.toString().startsWith("template-")) {
      const isField = fields.find((f) => f.id === active.id);
      const isButton = buttons.find((b) => b.id === active.id);

      if (isField) {
        const oldIndex = fields.findIndex((f) => f.id === active.id);
        const newIndex = fields.findIndex((f) => f.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
          setFields(arrayMove(fields, oldIndex, newIndex));
        }
      } else if (isButton) {
        const oldIndex = buttons.findIndex((b) => b.id === active.id);
        const newIndex = buttons.findIndex((b) => b.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
          setButtons(arrayMove(buttons, oldIndex, newIndex));
        }
      }
    }
  };

  // ✅ Component'e tıklayarak ekleme
  const handleComponentClick = (component) => {
    const newField = {
      id: `field-${Date.now()}`,
      type: component.type,
      label: component.label,
      required: false,
      placeholder: "",
    };
    setFields([...fields, newField]);
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

  // ✅ Form alanı düzenleme
  const handleEditField = (index) => {
    setEditingFieldIndex(index);
    setEditingField({ ...fields[index] });
  };

  // ✅ Form alanı kaydetme
  const handleSaveField = () => {
    if (!editingField || editingFieldIndex === null) return;

    if (!editingField.label?.trim()) {
      alert("Alan etiketi gereklidir");
      return;
    }

    const newFields = [...fields];
    newFields[editingFieldIndex] = editingField;
    setFields(newFields);
    setEditingField(null);
    setEditingFieldIndex(null);
  };

  // ✅ Form alanı silme
  const handleDeleteField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
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

  // ✅ Kaydetme
  const handleSave = () => {
    // Action code kontrolü
    const invalidButtons = buttons.filter((b) => !b.action || !b.action.trim());
    if (invalidButtons.length > 0) {
      alert("Lütfen tüm butonlar için Action Code tanımlayın!");
      return;
    }

    if (onSave && node) {
      onSave({
        id: node.id,
        data: {
          ...initialValues,
          name,
          fields: fields.filter((f) => f.label),
          buttons: buttons.filter((b) => b.label && b.action),
          userId: selectedUser?.id || selectedUser?.userAppId,
          userName: selectedUser?.userName,
          userFirstName: selectedUser?.firstName,
          userLastName: selectedUser?.lastName,
          assignedUserName: selectedUser
            ? `${selectedUser.firstName || ""} ${selectedUser.lastName || ""}`.trim()
            : "",
        },
      });
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "12px",
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600}>
            Kullanıcı Görevi Yapılandırması
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Görev Adı ve Kullanıcı Seçimi */}
        <Box mb={3}>
          <TextField
            fullWidth
            label="Görev Adı"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Kullanıcı görevi adı"
            sx={{ mb: 2 }}
          />

          <Autocomplete
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
              return (
                option.id === value.id ||
                option.id === value.userAppId ||
                option.userAppId === value.id
              );
            }}
            onChange={(event, newValue) => {
              setSelectedUser(newValue);
            }}
            onInputChange={(event, newInputValue) => {
              handleSearchByName(newInputValue);
            }}
            renderInput={(params) => (
              <TextField {...params} label="Atanacak Kullanıcı" placeholder="Kullanıcı ara..." />
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
            <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
              ✅ Seçili: {selectedUser.firstName} {selectedUser.lastName} ({selectedUser.userName})
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Sekmeler */}
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Form Alanları" />
          <Tab label="Butonlar" />
        </Tabs>

        {/* Form Alanları Sekmesi */}
        {activeTab === 0 && (
          <Box sx={{ mt: 3 }}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <Grid container spacing={2}>
                {/* Sol Panel: Form Component'leri */}
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, backgroundColor: "#f8f9fa", minHeight: "400px" }}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      Form Component&apos;leri
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: "block" }}>
                      Sürükleyip ekleyin veya tıklayın
                    </Typography>

                    {FORM_COMPONENTS.map((component) => (
                      <DraggableFormComponent
                        key={component.id}
                        component={component}
                        onClick={handleComponentClick}
                      />
                    ))}
                  </Paper>
                </Grid>

                {/* Orta Panel: Form Alanları Listesi */}
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, minHeight: "400px" }}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      Form Alanları ({fields.length})
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: "block" }}>
                      Sürükleyerek sıralayabilirsiniz
                    </Typography>

                    <DropZone id="fields-drop-zone">
                      <SortableContext
                        items={fields.map((f) => f.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {fields.length === 0 ? (
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
                              Henüz form alanı eklenmedi. Sol taraftan component sürükleyin veya tıklayın.
                            </Typography>
                          </Box>
                        ) : (
                          fields.map((field, index) => (
                            <SortableFormFieldItem
                              key={field.id}
                              field={field}
                              index={index}
                              onEdit={handleEditField}
                              onDelete={handleDeleteField}
                            />
                          ))
                        )}
                      </SortableContext>
                    </DropZone>
                  </Paper>
                </Grid>

                {/* Sağ Panel: Ön İzleme */}
                <Grid item xs={12} md={5}>
                  <Paper sx={{ p: 2, minHeight: "400px" }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Ön İzleme
                      </Typography>
                      <Chip
                        icon={<VisibilityIcon />}
                        label={`${fields.length} Alan`}
                        size="small"
                        color="primary"
                      />
                    </Box>

                    <Box
                      sx={{
                        p: 2,
                        backgroundColor: "#f8f9fa",
                        borderRadius: 1,
                        border: "1px solid #e0e0e0",
                        minHeight: "300px",
                        maxHeight: "400px",
                        overflowY: "auto",
                      }}
                    >
                      {fields.length === 0 ? (
                        <Typography variant="body2" color="textSecondary" textAlign="center" py={4}>
                          Form alanı ekledikçe burada görünecek
                        </Typography>
                      ) : (
                        fields
                          .filter((f) => f.label)
                          .map((field) => (
                            <Box key={field.id}>{renderFormField(field)}</Box>
                          ))
                      )}

                      {/* Butonlar Ön İzlemesi */}
                      {buttons.length > 0 && (
                        <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid #e0e0e0" }}>
                          <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: "block" }}>
                            Butonlar:
                          </Typography>
                          <Box display="flex" gap={1} flexWrap="wrap">
                            {buttons
                              .filter((b) => b.label && b.action)
                              .map((button) => (
                                <Chip
                                  key={button.id}
                                  label={button.label}
                                  color={button.action === "APPROVE" ? "success" : button.action === "REJECT" ? "error" : "default"}
                                  sx={{ cursor: "not-allowed" }}
                                />
                              ))}
                          </Box>
                        </Box>
                      )}
                    </Box>

                    {/* JSON Formatı */}
                    <Accordion sx={{ mt: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <CodeIcon fontSize="small" />
                          <Typography variant="body2" fontWeight={600}>
                            JSON Formatı
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box
                          component="pre"
                          sx={{
                            p: 2,
                            backgroundColor: "#1e1e1e",
                            color: "#d4d4d4",
                            borderRadius: 1,
                            overflow: "auto",
                            fontSize: "0.75rem",
                            fontFamily: "monospace",
                            maxHeight: "300px",
                          }}
                        >
                          {JSON.stringify(getJsonData(), null, 2)}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  </Paper>
                </Grid>
              </Grid>
            </DndContext>

            {/* Form Alanı Düzenleme */}
            {editingField && editingFieldIndex !== null && (
              <Paper sx={{ p: 2, mt: 2, backgroundColor: "#fff3cd" }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Form Alanı Düzenle
                </Typography>
                <Grid container spacing={2} mt={1}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Alan Etiketi"
                      value={editingField.label || ""}
                      onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
                      placeholder="Alan adı"
                      required
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Placeholder"
                      value={editingField.placeholder || ""}
                      onChange={(e) =>
                        setEditingField({ ...editingField, placeholder: e.target.value })
                      }
                      placeholder="Placeholder metni"
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <Box display="flex" alignItems="center" gap={1} mt={1}>
                      <input
                        type="checkbox"
                        checked={editingField.required || false}
                        onChange={(e) =>
                          setEditingField({ ...editingField, required: e.target.checked })
                        }
                      />
                      <Typography variant="body2">Zorunlu</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box display="flex" gap={1}>
                      <MDButton variant="gradient" color="success" size="small" onClick={handleSaveField}>
                        Kaydet
                      </MDButton>
                      <MDButton
                        variant="outlined"
                        color="secondary"
                        size="small"
                        onClick={() => {
                          setEditingField(null);
                          setEditingFieldIndex(null);
                        }}
                      >
                        İptal
                      </MDButton>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            )}
          </Box>
        )}

        {/* Butonlar Sekmesi */}
        {activeTab === 1 && (
          <Box sx={{ mt: 3 }}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <Grid container spacing={2}>
                {/* Sol Panel: Hazır Buton Şablonları */}
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, backgroundColor: "#f8f9fa", minHeight: "400px" }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Hazır Butonlar
                      </Typography>
                      <Chip label={`${BUTTON_TEMPLATES.length} Şablon`} size="small" color="info" />
                    </Box>
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

                    <Divider sx={{ my: 2 }} />

                    {/* Manuel Buton Ekleme */}
                    <MDButton
                      fullWidth
                      variant="gradient"
                      color="info"
                      size="small"
                      onClick={() => {
                        const newButton = {
                          id: `button-${Date.now()}`,
                          label: "Yeni Buton",
                          action: "",
                          type: "default",
                        };
                        setButtons([...buttons, newButton]);
                        setEditingButtonIndex(buttons.length);
                        setEditingButton(newButton);
                      }}
                      startIcon={<AddIcon />}
                    >
                      Yeni Buton Ekle
                    </MDButton>
                  </Paper>
                </Grid>

                {/* Sağ Panel: Seçilen Butonlar */}
                <Grid item xs={12} md={8}>
                  <Paper sx={{ p: 2, minHeight: "400px" }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Seçilen Butonlar ({buttons.length})
                      </Typography>
                      <Chip
                        label="Sınırsız ekleyebilirsiniz"
                        size="small"
                        color={buttons.length > 0 ? "success" : "default"}
                      />
                    </Box>
                    <Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: "block" }}>
                      Sürükleyerek sıralayabilirsiniz. İstediğiniz kadar buton ekleyebilirsiniz.
                    </Typography>

                    <DropZone id="buttons-drop-zone">
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
                            <Typography variant="body2" sx={{ mb: 2 }}>
                              Henüz buton eklenmedi.
                            </Typography>
                            <Typography variant="caption">
                              Sol taraftan buton şablonlarını sürükleyin, tıklayın veya &quot;Yeni Buton Ekle&quot;
                              butonunu kullanın.
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

            {/* Buton Düzenleme */}
            {editingButton && editingButtonIndex !== null && (
              <Paper sx={{ p: 2, mt: 2, backgroundColor: "#fff3cd" }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Buton Düzenle
                </Typography>
                <Grid container spacing={2} mt={1}>
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
                    <Box display="flex" gap={1}>
                      <MDButton variant="gradient" color="success" size="small" onClick={handleSaveButton}>
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
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <MDButton variant="outlined" color="secondary" onClick={onClose}>
          İptal
        </MDButton>
        <MDButton variant="gradient" color="info" onClick={handleSave}>
          Kaydet
        </MDButton>
      </DialogActions>
    </Dialog>
  );
};

export default UserTaskModal;
