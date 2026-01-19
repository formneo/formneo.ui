import React, { useEffect, useMemo, useState } from "react";
import "antd/dist/antd.css";
import "@designable/react/dist/designable.react.umd.production.css";
import "@designable/react-settings-form/dist/designable.settings-form.umd.production.css";

import { Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, Box, Typography, IconButton, Autocomplete, TextField, Divider, Chip } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import MDButton from "components/MDButton";
import { UserApi } from "api/generated";
import getConfiguration from "confiuration";
import { useBusy } from "layouts/pages/hooks/useBusy";

// Designable React bileşenleri
import {
  Designer,
  StudioPanel,
  CompositePanel,
  Workspace,
  WorkspacePanel,
  ViewportPanel,
  ToolbarPanel,
  ViewPanel,
  ComponentTreeWidget,
  DesignerToolsWidget,
  ViewToolsWidget,
  ResourceWidget,
} from "@designable/react";

// TS tür uyumsuzluklarını izole etmek için "any" sarmalayıcılar
const DesignerAny = Designer;
const StudioPanelAny = StudioPanel;
const CompositePanelAny = CompositePanel;
const WorkspaceAny = Workspace;
const WorkspacePanelAny = WorkspacePanel;
const ViewportPanelAny = ViewportPanel;
const ToolbarPanelAny = ToolbarPanel;
const ViewPanelAny = ViewPanel;
const ResourceWidgetAny = ResourceWidget;
const ComponentTreeWidgetAny = ComponentTreeWidget;
const DesignerToolsWidgetAny = DesignerToolsWidget;
const ViewToolsWidgetAny = ViewToolsWidget;

// Designable çekirdek
import { createDesigner } from "@designable/core";
import { GlobalRegistry } from "@designable/core";
import { SettingsForm } from "@designable/react-settings-form";

// Formily-antd kaynakları
import {
  Form,
  Field,
  Input,
  Select,
  TreeSelect,
  Cascader,
  Radio,
  Checkbox,
  Slider,
  Rate,
  NumberPicker,
  Transfer,
  Password,
  DatePicker,
  TimePicker,
  Upload,
  Switch,
  Text,
  Card,
  ArrayCards,
  ArrayTable,
  Space,
  FormTab,
  FormCollapse,
  FormGrid,
  FormLayout,
} from "@designable/formily-antd";
import { transformToSchema, transformToTreeNode } from "@designable/formily-transformer";
import { AllLocales as FormilyAntdLocales } from "@designable/formily-antd/esm/locales";
import { createResource } from "@designable/core";

/**
 * ✅ UserTask için Özelleştirilmiş Formily Designer
 * 
 * Özellikler:
 * - Formily designer'ı modal içinde kullanır
 * - Properties panel'i kaldırıldı (sadeleştirildi)
 * - Sadece form alanları için Formily kullanır
 * - Butonlar için ayrı panel
 * - Kullanıcı atama için ayrı bölüm
 */

// Buton şablonları
const BUTTON_TEMPLATES = [
  { id: "approve", label: "Onayla", action: "APPROVE", color: "success" },
  { id: "reject", label: "Reddet", action: "REJECT", color: "error" },
  { id: "custom", label: "Özel Buton", action: "CUSTOM", color: "info" },
];

const UserTaskFormDesigner = ({ open, onClose, initialValues, node, onSave }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [name, setName] = useState(initialValues?.name || "Kullanıcı Görevi");
  const [buttons, setButtons] = useState(initialValues?.buttons || []);
  const [editingButton, setEditingButton] = useState(null);
  const [editingButtonIndex, setEditingButtonIndex] = useState(null);
  const [searchByName, setSearchByName] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const dispatchBusy = useBusy();

  // Formily Designer Engine
  GlobalRegistry.setDesignerLanguage("en-US");
  try {
    GlobalRegistry.registerDesignerLocales(FormilyAntdLocales);
  } catch {}

  const engine = useMemo(
    () =>
      createDesigner({
        rootComponentName: "Form",
      }),
    []
  );

  useEffect(() => {
    if (initialValues) {
      setName(initialValues.name || "Kullanıcı Görevi");
      setButtons(initialValues.buttons || []);
      
      // Formily schema'yı yükle
      if (initialValues.formSchema) {
        setTimeout(() => {
          try {
            const root = transformToTreeNode(initialValues.formSchema);
            const workspace = engine.workbench?.activeWorkspace;
            const operation = workspace?.operation;
            if (operation && root) {
              operation.tree.from(root);
            }
          } catch (e) {
            console.error("Schema yüklenirken hata:", e);
          }
        }, 100);
      }

      if (initialValues.userId || initialValues.userName) {
        setSelectedUser({
          id: initialValues.userId,
          userName: initialValues.userName,
          firstName: initialValues.userFirstName,
          lastName: initialValues.userLastName,
        });
      }
    }
  }, [initialValues, engine]);

  const handleSearchByName = async (value) => {
    if (value === "") {
      setSearchByName([]);
    } else {
      dispatchBusy({ isBusy: true });
      try {
        const conf = getConfiguration();
        const api = new UserApi(conf);
        const data = await api.apiUserGetAllUsersWithNameNameGet(value);
        setSearchByName(data.data || []);
      } catch (error) {
        console.error("Kullanıcı arama hatası:", error);
        setSearchByName([]);
      } finally {
        dispatchBusy({ isBusy: false });
      }
    }
  };

  const handleAddButton = (template) => {
    const newButton = {
      id: `button-${Date.now()}`,
      label: template.label,
      action: template.action,
      type: "default",
    };
    setButtons([...buttons, newButton]);
  };

  const handleEditButton = (index) => {
    setEditingButtonIndex(index);
    setEditingButton({ ...buttons[index] });
  };

  const handleSaveButton = () => {
    if (!editingButton || editingButtonIndex === null) return;
    if (!editingButton.label?.trim() || !editingButton.action?.trim()) {
      alert("Label ve Action Code zorunludur!");
      return;
    }

    const newButtons = [...buttons];
    newButtons[editingButtonIndex] = {
      ...editingButton,
      action: editingButton.action.trim().toUpperCase().replace(/\s+/g, "_"),
    };
    setButtons(newButtons);
    setEditingButton(null);
    setEditingButtonIndex(null);
  };

  const handleDeleteButton = (index) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    // Formily schema'yı al
    const workspace = engine.workbench?.activeWorkspace;
    const tree = workspace?.operation?.tree;
    const result = tree ? transformToSchema(tree) : { schema: {} };

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
          formSchema: result.schema || {},
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
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "12px",
          maxHeight: "95vh",
          height: "95vh",
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600}>
            UserTask Form Tasarımı
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0, height: "calc(95vh - 120px)", overflow: "hidden" }}>
        {/* Üst Bar: Görev Adı ve Kullanıcı */}
        <Box sx={{ p: 2, borderBottom: "1px solid #e0e0e0" }}>
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              label="Görev Adı"
              value={name}
              onChange={(e) => setName(e.target.value)}
              size="small"
              sx={{ width: 300 }}
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
              onChange={(event, newValue) => setSelectedUser(newValue)}
              onInputChange={(event, newInputValue) => handleSearchByName(newInputValue)}
              renderInput={(params) => (
                <TextField {...params} label="Atanacak Kullanıcı" size="small" sx={{ width: 300 }} />
              )}
            />
            {selectedUser && (
              <Chip
                label={`${selectedUser.firstName} ${selectedUser.lastName}`}
                color="success"
                size="small"
              />
            )}
          </Box>
        </Box>

        {/* Sekmeler */}
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ borderBottom: "1px solid #e0e0e0" }}>
          <Tab label="Form Tasarımı (Formily)" />
          <Tab label={`Butonlar (${buttons.length})`} />
        </Tabs>

        {/* Form Tasarımı Sekmesi */}
        {activeTab === 0 && (
          <Box sx={{ height: "calc(95vh - 250px)", overflow: "hidden" }}>
            <DesignerAny engine={engine}>
              <StudioPanelAny>
                <CompositePanelAny>
                  <CompositePanelAny.Item title="Component&apos;ler" icon="Component">
                    <ResourceWidgetAny title="Temel" sources={[Input, Password, NumberPicker]} />
                    <ResourceWidgetAny title="Seçim" sources={[Select, TreeSelect, Cascader, Radio, Checkbox]} />
                    <ResourceWidgetAny title="Tarih/Saat" sources={[DatePicker, TimePicker]} />
                    <ResourceWidgetAny title="Diğer" sources={[Switch, Upload, Transfer, Slider, Rate]} />
                    <ResourceWidgetAny title="Yerleşimler" sources={[Card, FormGrid, FormTab, FormLayout, FormCollapse, Space]} />
                    <ResourceWidgetAny title="Diziler" sources={[ArrayCards, ArrayTable]} />
                  </CompositePanelAny.Item>
                </CompositePanelAny>

                <WorkspaceAny id="form">
                  <WorkspacePanelAny>
                    <ToolbarPanelAny>
                      <DesignerToolsWidgetAny />
                      <ViewToolsWidgetAny use={["DESIGNABLE", "PREVIEW"]} />
                    </ToolbarPanelAny>
                    <ViewportPanelAny style={{ height: "100%" }}>
                      <ViewPanelAny type="DESIGNABLE">
                        {() => (
                          <ComponentTreeWidgetAny
                            components={{
                              Form,
                              Field,
                              Input,
                              Select,
                              TreeSelect,
                              Cascader,
                              Radio,
                              Checkbox,
                              Slider,
                              Rate,
                              NumberPicker,
                              Transfer,
                              Password,
                              DatePicker,
                              TimePicker,
                              Upload,
                              Switch,
                              Text,
                              Card,
                              ArrayCards,
                              ArrayTable,
                              Space,
                              FormTab,
                              FormCollapse,
                              FormGrid,
                              FormLayout,
                            }}
                          />
                        )}
                      </ViewPanelAny>
                      <ViewPanelAny type="PREVIEW">
                        {() => {
                          const workspace = engine.workbench?.activeWorkspace;
                          const tree = workspace?.operation?.tree;
                          const result = tree ? transformToSchema(tree) : { schema: {} };
                          return (
                            <Box sx={{ p: 3 }}>
                              <Typography variant="h6" gutterBottom>
                                Ön İzleme
                              </Typography>
                              {/* Preview buraya eklenecek */}
                            </Box>
                          );
                        }}
                      </ViewPanelAny>
                    </ViewportPanelAny>
                  </WorkspacePanelAny>
                </WorkspaceAny>
              </StudioPanelAny>
            </DesignerAny>
          </Box>
        )}

        {/* Butonlar Sekmesi */}
        {activeTab === 1 && (
          <Box sx={{ p: 3, height: "calc(95vh - 250px)", overflow: "auto" }}>
            <Box display="flex" gap={2} mb={3}>
              {BUTTON_TEMPLATES.map((template) => (
                <MDButton
                  key={template.id}
                  variant="gradient"
                  color={template.color}
                  size="small"
                  onClick={() => handleAddButton(template)}
                >
                  {template.label}
                </MDButton>
              ))}
              <MDButton
                variant="outlined"
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
              >
                + Yeni Buton
              </MDButton>
            </Box>

            <Divider sx={{ my: 2 }} />

            {buttons.length === 0 ? (
              <Typography variant="body2" color="textSecondary" textAlign="center" py={4}>
                Henüz buton eklenmedi. Yukarıdaki butonları kullanarak ekleyin.
              </Typography>
            ) : (
              <Box>
                {buttons.map((button, index) => (
                  <Box
                    key={button.id}
                    sx={{
                      p: 2,
                      mb: 1,
                      border: "1px solid #e0e0e0",
                      borderRadius: 1,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {button.label}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Action: {button.action || "Tanımlı değil"}
                      </Typography>
                    </Box>
                    <Box display="flex" gap={1}>
                      <MDButton
                        size="small"
                        variant="outlined"
                        color="info"
                        onClick={() => handleEditButton(index)}
                      >
                        Düzenle
                      </MDButton>
                      <MDButton
                        size="small"
                        variant="gradient"
                        color="error"
                        onClick={() => handleDeleteButton(index)}
                      >
                        Sil
                      </MDButton>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}

            {/* Buton Düzenleme */}
            {editingButton && editingButtonIndex !== null && (
              <Box sx={{ mt: 3, p: 2, backgroundColor: "#fff3cd", borderRadius: 1 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Buton Düzenle
                </Typography>
                <Box display="flex" gap={2} mt={1}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Buton Label"
                    value={editingButton.label || ""}
                    onChange={(e) => setEditingButton({ ...editingButton, label: e.target.value })}
                    required
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="Action Code (Zorunlu)"
                    value={editingButton.action || ""}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/\s+/g, "_");
                      setEditingButton({ ...editingButton, action: value });
                    }}
                    required
                    error={!editingButton.action || !editingButton.action.trim()}
                    helperText={!editingButton.action ? "Action Code zorunludur!" : ""}
                  />
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
              </Box>
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

export default UserTaskFormDesigner;

