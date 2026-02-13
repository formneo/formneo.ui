/**
 * Form Şeması Özellik Düzenleme Modalı
 *
 * Formily designer'ı açarak sadece mevcut elemanların özelliklerini düzenlemeye izin verir.
 * Sürükle-bırak (yeni bileşen ekleme) devre dışıdır.
 */
import React, { useEffect, useMemo, useState } from "react";
import "antd/dist/antd.css";
import "@designable/react/dist/designable.react.umd.production.css";
import "@designable/react-settings-form/dist/designable.settings-form.umd.production.css";
import "../../FormEditor/FormEditorReactions.css";

import { Dialog, DialogTitle, DialogContent, Box, Typography, IconButton, Button } from "@mui/material";
import { Close as CloseIcon, Save as SaveIcon } from "@mui/icons-material";
import { message } from "antd";

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
  SettingsPanel,
  useOperation,
} from "@designable/react";

import { createDesigner } from "@designable/core";
import { GlobalRegistry } from "@designable/core";
import { SettingsForm } from "@designable/react-settings-form";

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
import { FormDataApi } from "api/generated";
import getConfiguration from "confiuration";
import FormNeoButton from "../../FormEditor/custom/FormNeoButton";
import ApproveButtons from "../../FormEditor/custom/ApproveButtons";
import CurrencyInput from "../../FormEditor/custom/CurrencyInput";
import {
  DepartmentSelect,
  PositionSelect,
  CompanySelect,
  LocationSelect,
  ProjectSelect,
  SupplierSelect,
  ProductSelect,
  CategorySelect,
  CurrencySelect,
  CountrySelect,
  CitySelect,
  ApproverSelect,
} from "../../FormEditor/custom/StandardComboboxes";

const DesignerAny = Designer;
const StudioPanelAny = StudioPanel;
const CompositePanelAny = CompositePanel;
const WorkspaceAny = Workspace;
const WorkspacePanelAny = WorkspacePanel;
const ViewportPanelAny = ViewportPanel;
const ToolbarPanelAny = ToolbarPanel;
const ViewPanelAny = ViewPanel;
const ComponentTreeWidgetAny = ComponentTreeWidget;
const DesignerToolsWidgetAny = DesignerToolsWidget;
const ViewToolsWidgetAny = ViewToolsWidget;
const ResourceWidgetAny = ResourceWidget;
const SettingsPanelAny = SettingsPanel;

const FORM_COMPONENTS = {
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
  FormNeoButton,
  ApproveButtons,
  CurrencyInput,
  DepartmentSelect,
  PositionSelect,
  CompanySelect,
  LocationSelect,
  ProjectSelect,
  SupplierSelect,
  ProductSelect,
  CategorySelect,
  CurrencySelect,
  CountrySelect,
  CitySelect,
  ApproverSelect,
};

export default function FormDesignerPropertiesOnlyModal({ open, onClose, formId, formName, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formDesign, setFormDesign] = useState(null);

  GlobalRegistry.setDesignerLanguage("en-US");
  try {
    GlobalRegistry.registerDesignerLocales(FormilyAntdLocales);
  } catch {}
  try {
    GlobalRegistry.registerDesignerBehaviors(
      FormNeoButton,
      ApproveButtons,
      CurrencyInput,
      DepartmentSelect,
      PositionSelect,
      CompanySelect,
      LocationSelect,
      ProjectSelect,
      SupplierSelect,
      ProductSelect,
      CategorySelect,
      CurrencySelect,
      CountrySelect,
      CitySelect,
      ApproverSelect
    );
  } catch {}

  const engine = useMemo(
    () =>
      createDesigner({
        rootComponentName: "Form",
      }),
    [formId]
  );

  // Modal kapandığında state temizle
  useEffect(() => {
    if (!open) {
      setFormDesign(null);
      setLoading(false);
    }
  }, [open]);

  // 1. API'den form tasarımını yükle
  useEffect(() => {
    if (open && formId) {
      setFormDesign(null);
      setLoading(true);
      const conf = getConfiguration();
      const api = new FormDataApi(conf);
      api
        .apiFormDataIdGet(formId)
        .then((res) => {
          const data = res?.data;
          if (data?.formDesign) {
            let design;
            try {
              design = typeof data.formDesign === "string" ? JSON.parse(data.formDesign) : data.formDesign;
            } catch (e) {
              console.error("formDesign parse hatası:", e);
              message.error("Form tasarımı Parse edilemedi");
              return;
            }
            setFormDesign(design);
          } else {
            message.warning("Form tasarımı bulunamadı");
          }
        })
        .catch((err) => {
          console.error("Form yüklenirken hata:", err);
          message.error("Form yüklenemedi");
        })
        .finally(() => setLoading(false));
    }
  }, [open, formId]);

  // Tree'yi Workspace context'inde yükleyen yardımcı bileşen (Workspace içinde çalışır)
  const TreeLoader = () => {
    const operation = useOperation(); // Mevcut workspace'ten al
    useEffect(() => {
      if (!formDesign || !operation) return;
      let root;
      try {
        const design =
          formDesign?.schema !== undefined
            ? { schema: formDesign.schema, form: formDesign.form || {} }
            : { schema: formDesign, form: {} };
        root = transformToTreeNode(design);
        if (root) operation.tree.from(root);
      } catch (e) {
        console.error("Schema parse hatası:", e);
      }
    }, [formDesign, operation]);
    return null;
  };

  const handleSave = () => {
    if (!formId || !formDesign) return;
    setSaving(true);
    const conf = getConfiguration();
    const api = new FormDataApi(conf);
    api
      .apiFormDataIdGet(formId)
      .then(async (res) => {
        const current = res?.data;
        if (!current) throw new Error("Form bulunamadı");
        const workspace = engine.workbench?.activeWorkspace;
        const tree = workspace?.operation?.tree;
        const result = tree ? transformToSchema(tree) : { schema: {}, form: {} };
        const designToSave = {
          ...formDesign,
          ...result,
          buttonPanel: formDesign?.buttonPanel,
          entities: formDesign?.entities,
        };
        await api.apiFormDataPut({
          id: formId,
          concurrencyToken: current.concurrencyToken ?? 0,
          formName: current.formName || formName,
          formDescription: current.formDescription || "",
          formDesign: JSON.stringify(designToSave),
          javaScriptCode: current.javaScriptCode || "",
          isActive: current.isActive,
          canEdit: current.canEdit !== undefined ? current.canEdit : true,
          publicationStatus: current.publicationStatus,
          showInMenu: current.showInMenu ?? false,
        });
        message.success("Form kaydedildi");
        onSaved?.();
        onClose();
      })
      .catch((err) => {
        console.error("Kaydetme hatası:", err);
        message.error(err?.response?.data?.message || "Kaydetme başarısız");
      })
      .finally(() => setSaving(false));
  };

  if (!open) return null;

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
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Form Şemasını Düzenle (Sadece Özellikler)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formName || "Form"} — Yeni bileşen eklenemez, sadece mevcut alanların özellikleri değiştirilebilir
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={loading || saving}
            >
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0, height: "calc(95vh - 100px)", overflow: "hidden" }}>
        {!formId ? (
          <Box display="flex" alignItems="center" justifyContent="center" height="100%" minHeight={300}>
            <Typography color="text.secondary">Form seçilmedi. Önce workflow için bir form seçin.</Typography>
          </Box>
        ) : loading || (formId && !formDesign) ? (
          <Box display="flex" alignItems="center" justifyContent="center" height="100%" minHeight={300}>
            <Typography color="text.secondary">Form yükleniyor...</Typography>
          </Box>
        ) : !formDesign ? (
          <Box display="flex" alignItems="center" justifyContent="center" height="100%" minHeight={300}>
            <Typography color="text.secondary">Form tasarımı bulunamadı veya boş.</Typography>
          </Box>
        ) : (
          <DesignerAny key={`form-designer-${formId}`} engine={engine}>
            <StudioPanelAny>
              {/* Sol panel: Sürükle-bırak DEVRE DIŞI - boş ResourceWidget */}
              <CompositePanelAny style={{ minWidth: 220 }}>
                <CompositePanelAny.Item title="Bileşenler" icon="Component">
                  <Box sx={{ p: 2, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      Bu modda yeni bileşen eklenemez.
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Canvas&apos;ta mevcut alanlara tıklayarak özelliklerini sağ panelden düzenleyebilirsiniz.
                    </Typography>
                  </Box>
                  <ResourceWidgetAny title="Devre Dışı" sources={[]} />
                </CompositePanelAny.Item>
              </CompositePanelAny>

              <WorkspaceAny id="form">
                <TreeLoader />
                <WorkspacePanelAny>
                  <ToolbarPanelAny>
                    <DesignerToolsWidgetAny />
                    <ViewToolsWidgetAny use={["DESIGNABLE", "PREVIEW"]} />
                  </ToolbarPanelAny>
                  <ViewportPanelAny style={{ height: "100%" }}>
                    <ViewPanelAny type="DESIGNABLE">
                      {() => (
                        <ComponentTreeWidgetAny
                          components={FORM_COMPONENTS}
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
                            <Typography variant="body2" color="text.secondary">
                              Önizleme: {JSON.stringify(result.schema || {}).substring(0, 100)}...
                            </Typography>
                          </Box>
                        );
                      }}
                    </ViewPanelAny>
                  </ViewportPanelAny>
                </WorkspacePanelAny>
              </WorkspaceAny>

              <SettingsPanelAny title="Özellikler">
                <SettingsForm uploadAction="https://www.mocky.io/v2/5cc8019d300000980a055e76" />
              </SettingsPanelAny>
            </StudioPanelAny>
          </DesignerAny>
        )}
      </DialogContent>
    </Dialog>
  );
}
