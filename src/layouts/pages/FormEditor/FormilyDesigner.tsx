import React, { useEffect, useMemo, useState } from "react";

// Styles (LESS yerine derlenmiş CSS kullanıyoruz)
import "antd/dist/antd.css";
import "@designable/react/dist/designable.react.umd.production.css";
import "@designable/react-settings-form/dist/designable.settings-form.umd.production.css";
import "./FormEditorReactions.css";

// Ant Design UI (üst bar için)
import { Space as AntSpace, Button as AntButton, Typography, Input as AntdInput, Form as AntdForm, message, Tag, Drawer, List, Select as AntdSelect, InputNumber as AntdInputNumber, Switch as AntdSwitch, Divider as AntdDivider, Modal, Card as AntdCard, Slider as AntdSlider, Rate as AntdRate } from "antd";
import { SaveOutlined, RocketOutlined, HistoryOutlined, EyeOutlined, CodeOutlined, PlusOutlined, EditOutlined, DeleteOutlined, DollarCircleOutlined, DollarOutlined, MoneyCollectOutlined, BankOutlined, WalletOutlined, InfoCircleOutlined, CheckCircleOutlined } from "@ant-design/icons";
import * as Icons from "@ant-design/icons";
import formNeoLogo from "assets/images/logoson.svg";

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
  SettingsPanel,
  ComponentTreeWidget,
  DesignerToolsWidget,
  ViewToolsWidget,
  ResourceWidget,
} from "@designable/react";

// TS tür uyumsuzluklarını izole etmek için "any" sarmalayıcılar
const DesignerAny = Designer as any;
const StudioPanelAny = StudioPanel as any;
const CompositePanelAny = CompositePanel as any;
const WorkspaceAny = Workspace as any;
const WorkspacePanelAny = WorkspacePanel as any;
const ViewportPanelAny = ViewportPanel as any;
const ToolbarPanelAny = ToolbarPanel as any;
const ViewPanelAny = ViewPanel as any;
const SettingsPanelAny = SettingsPanel as any;
const ComponentTreeWidgetAny = ComponentTreeWidget as any;
const DesignerToolsWidgetAny = DesignerToolsWidget as any;
const ViewToolsWidgetAny = ViewToolsWidget as any;
const ResourceWidgetAny = ResourceWidget as any;

// Designable çekirdek
import { createDesigner } from "@designable/core";
import { GlobalRegistry } from "@designable/core";

// Ayar formu
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
import { createForm } from "@formily/core";
import { FormProvider, createSchemaField } from "@formily/react";
import * as AntdFormily from "@formily/antd";
import { AllLocales as FormilyAntdLocales } from "@designable/formily-antd/esm/locales";
import { useParams, useNavigate } from "react-router-dom";
import { FormDataApi } from "api/generated";
import getConfiguration from "confiuration";
import FormNeoButton from "./custom/FormNeoButton";
import ApproveButtons from "./custom/ApproveButtons";
import CurrencyInput, { CurrencyInputSource } from "./custom/CurrencyInput";
import EntityManager, { Entity } from "./EntityManager";
import AIAssistant from "./AIAssistant";
import {
  DepartmentSelect,
  PositionSelect,
  ParametreSelectExport as ParametreSelect,
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
} from "./custom/StandardComboboxes";
import LookupParametreSetter from "./custom/LookupParametreSetter";
import { createResource } from "@designable/core";
import { Editor } from "@monaco-editor/react";
import { useFormWorkflowScope } from "utils/formWorkflowScope";

interface FormButton {
  id: string;
  label: string;
  type?: "primary" | "default" | "dashed" | "link" | "text";
  icon?: string;
  action: string; // ✅ ZORUNLU: Process ekranında kullanılacak action kodu (workflow routing için)
}

export default function FormilyDesigner(): JSX.Element {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isBusy, setIsBusy] = useState(false);
  const [formName, setFormName] = useState<string>("New Form");
  const [publicationStatus, setPublicationStatus] = useState<number>(1);
  const [revision, setRevision] = useState<number | undefined>(undefined);
  const [parentFormId, setParentFormId] = useState<string | undefined>(undefined);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [formButtons, setFormButtons] = useState<FormButton[]>([]);
  const [editingButton, setEditingButton] = useState<FormButton | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  // Dil ve locale kayıtlarını motor yaratılmadan ÖNCE yap
  GlobalRegistry.setDesignerLanguage("en-US");
  try {
    GlobalRegistry.registerDesignerLocales(FormilyAntdLocales as any);
  } catch {}
  // Custom bileşen davranışlarını kaydet
  try {
    GlobalRegistry.registerDesignerBehaviors(
      FormNeoButton as any, 
      ApproveButtons as any, 
      CurrencyInput as any,
      DepartmentSelect as any,
      PositionSelect as any,
      ParametreSelect as any,
      CompanySelect as any,
      LocationSelect as any,
      ProjectSelect as any,
      SupplierSelect as any,
      ProductSelect as any,
      CategorySelect as any,
      CurrencySelect as any,
      CountrySelect as any,
      CitySelect as any,
      ApproverSelect as any
    );
  } catch {}
  
  // Custom icon'ları kaydet - NumberPickerSource pattern'ini kullan
  try {
    GlobalRegistry.registerDesignerIcons({
      CurrencyInputSource: CurrencyInputSource,
      EntityDatabase: () => (
        <svg viewBox="0 0 1024 1024" width="1em" height="1em" fill="currentColor">
          <path d="M512 128c-141.385 0-256 51.197-256 114.286v73.143C256 378.617 370.615 429.714 512 429.714s256-51.097 256-114.285v-73.143C768 179.197 653.385 128 512 128z m0 73.143c94.257 0 170.667 34.132 170.667 41.143 0 7.011-76.41 41.143-170.667 41.143S341.333 249.297 341.333 242.286c0-7.011 76.41-41.143 170.667-41.143zM256 475.429v73.142C256 611.76 370.615 662.857 512 662.857s256-51.097 256-114.286v-73.142c-55.406 44.397-138.423 70.857-256 70.857s-200.594-26.46-256-70.857z m0 219.428v73.143C256 831.189 370.615 882.286 512 882.286s256-51.097 256-114.286v-73.143c-55.406 44.398-138.423 70.857-256 70.857s-200.594-26.459-256-70.857z"/>
        </svg>
      ),
      AIAssistant: () => (
        <svg viewBox="0 0 1024 1024" width="1em" height="1em" fill="currentColor">
          <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"/>
          <path d="M464 336a48 48 0 1 0 96 0 48 48 0 1 0-96 0zm72 112h-48c-4.4 0-8 3.6-8 8v272c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V456c0-4.4-3.6-8-8-8z"/>
          <circle cx="512" cy="512" r="40" opacity="0.3"/>
          <path d="M512 420c-50.8 0-92 41.2-92 92s41.2 92 92 92 92-41.2 92-92-41.2-92-92-92zm0 144c-28.7 0-52-23.3-52-52s23.3-52 52-52 52 23.3 52 52-23.3 52-52 52z"/>
          <path d="M300 512c0-22.1 3.5-43.4 10-63.6l-50.8-29.3C245.9 449.8 240 480.3 240 512s5.9 62.2 19.2 92.9l50.8-29.3c-6.5-20.2-10-41.5-10-63.6zm424 0c0 22.1-3.5 43.4-10 63.6l50.8 29.3C778.1 574.2 784 543.7 784 512s-5.9-62.2-19.2-92.9l-50.8 29.3c6.5 20.2 10 41.5 10 63.6z"/>
        </svg>
      ),
    } as any);
  } catch {}

  const engine = useMemo(
    () =>
      createDesigner({
        rootComponentName: "Form",
      }),
    []
  );
  // Localization: TR paketi olmadığı için en-US'e sabitle (güvence)
  GlobalRegistry.setDesignerLanguage("en-US");

  // Gözükmeyen/Çince kalan başlıklar için açık EN override
  GlobalRegistry.registerDesignerLocales({
    RadioGroup: {
      'en-US': { title: 'Radio' },
    },
    Input: {
      'en-US': { title: 'Input' },
    },
    Password: {
      'en-US': { title: 'Password' },
    },
    Checkbox: {
      'en-US': { title: 'Checkbox' },
    },
    Select: {
      'en-US': { title: 'Select' },
    },
  } as any);

  const previewForm = useMemo(() => createForm(), []);
  const workflowScope = useFormWorkflowScope(previewForm);
  const SchemaField = useMemo(
    () => createSchemaField({ 
      components: { 
        ...(AntdFormily as any), 
        FormItem: (AntdFormily as any).FormItem, 
        FormNeoButton, 
        ApproveButtons, 
        CurrencyInput, 
        Card: AntdCard, 
        Slider: AntdSlider, 
        Rate: AntdRate,
        DepartmentSelect,
        PositionSelect,
        ParametreSelect,
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
      } 
    }),
    []
  );

  // Load form by id
  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setIsBusy(true);
        const conf = getConfiguration();
        const api = new FormDataApi(conf);
        const res = await api.apiFormDataIdGet(id);
        const data = res?.data as any;
        if (!data) return;
        setFormName(data.formName || "New Form");
        if ((data as any).parentFormId) setParentFormId((data as any).parentFormId);
        if (typeof data.publicationStatus === "number") setPublicationStatus(data.publicationStatus);
        if (typeof data.revision === "number") setRevision(data.revision);
        const design = data.formDesign ? JSON.parse(data.formDesign) : null;
        
        // Button paneli bilgilerini önce yükle (engine'den bağımsız)
        if (design && design.buttonPanel && design.buttonPanel.buttons) {
          setFormButtons(design.buttonPanel.buttons);
        } else {
          setFormButtons([]);
        }
        
        // Entity bilgilerini yükle
        if (design && design.entities) {
          setEntities(design.entities);
        } else {
          setEntities([]);
        }
        
        // Schema'yı yükle (engine hazır olmalı)
        if (design && design.schema) {
          // Engine'in hazır olmasını bekle
          setTimeout(() => {
            try {
              const root = transformToTreeNode(design);
              const workspace = engine.workbench?.activeWorkspace;
              const operation = workspace?.operation;
              if (operation && root) {
                // Ağacı temizle ve yeni ağacı yükle
                operation.tree.from(root as any);
              }
            } catch (e) {
              // Schema yüklenirken hata
            }
          }, 100);
        }
      } catch (e) {
        // Form yüklenirken hata
      } finally {
        setIsBusy(false);
      }
    };
    load();
  }, [id]);

  const handleSave = async () => {
    try {
      if (!formName || !formName.trim()) {
        message.warning("Form name is required");
        return;
      }
      const workspace = engine.workbench?.activeWorkspace;
      const tree = workspace?.operation?.tree;
      const result = tree ? transformToSchema(tree) : { schema: {} };
      
      // Button paneli ve entities bilgilerini her zaman ekle
      const designWithButtons = {
        ...result,
        buttonPanel: {
          buttons: formButtons || [],
        },
        entities: entities || [], // Entity tanımları
      };
      
      setIsBusy(true);
      const conf = getConfiguration();
      const api = new FormDataApi(conf);
      
      if (id) {
        // Mevcut formu güncelle - mevcut bilgileri koru
        const currentFormRes = await api.apiFormDataIdGet(id);
        const currentForm = currentFormRes?.data as any;
        
        const payload = {
          id,
          concurrencyToken: 0,
          formName: currentForm.formName || formName,
          formDescription: currentForm.formDescription || "",
          formDesign: JSON.stringify(designWithButtons),
          javaScriptCode: currentForm.javaScriptCode || "",
          isActive: currentForm.isActive as any,
          canEdit: currentForm.canEdit !== undefined ? currentForm.canEdit : true,
          publicationStatus: currentForm.publicationStatus || 1, // Mevcut status'ü koru
          showInMenu: currentForm.showInMenu || false,
        } as any;
        
        await api.apiFormDataPut(payload);
        message.success("Form saved successfully");
      } else {
        // Yeni form oluştur
        const payload = {
          formName,
          formDescription: "",
          formDesign: JSON.stringify(designWithButtons),
          javaScriptCode: "",
          isActive: 1 as any,
          canEdit: true,
          publicationStatus: 1 as any,
          showInMenu: false,
        } as any;
        
        const res: any = await api.apiFormDataPost(payload);
        const newId = res?.data?.id;
        if (newId) {
          message.success("Form saved successfully");
          navigate(`/forms/designer/${newId}`);
        }
      }
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Failed to save form");
    } finally {
      setIsBusy(false);
    }
  };

  const handlePublish = async () => {
    try {
      if (!id) return;
      setIsBusy(true);
      
      // Önce formu buttonPanel ile kaydet
      const workspace = engine.workbench?.activeWorkspace;
      const tree = workspace?.operation?.tree;
      const result = tree ? transformToSchema(tree) : { schema: {} };
      
      const designWithButtons = {
        ...result,
        buttonPanel: {
          buttons: formButtons || [],
        },
      };
      
      const conf = getConfiguration();
      const api = new FormDataApi(conf);
      
      // Mevcut form bilgilerini al
      const currentFormRes = await api.apiFormDataIdGet(id);
      const currentForm = currentFormRes?.data as any;
      
      // Formu buttonPanel ile güncelle
      await api.apiFormDataPut({
        id,
        concurrencyToken: 0,
        formName: currentForm.formName || formName,
        formDescription: currentForm.formDescription || "",
        formDesign: JSON.stringify(designWithButtons),
        javaScriptCode: currentForm.javaScriptCode || "",
        isActive: currentForm.isActive as any,
        canEdit: currentForm.canEdit !== undefined ? currentForm.canEdit : true,
        publicationStatus: currentForm.publicationStatus || 1,
        showInMenu: currentForm.showInMenu || false,
      } as any);
      
      // Sonra yayınla
      await api.apiFormDataPublishIdPost(id);
      message.success("Form published");
      setPublicationStatus(2);
      await openRevisions(true);
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Failed to publish");
    } finally {
      setIsBusy(false);
    }
  };

  const openRevisions = async (silent?: boolean) => {
    try {
      if (!id) {
        message.warning("Save first");
        return;
      }
      setIsBusy(true);
      const conf = getConfiguration();
      const api = new FormDataApi(conf);
      const parent = parentFormId || id;
      const res = await api.apiFormDataVersionsParentIdGet(parent);
      const list = (res?.data || []) as any[];
      setVersions(list);
      if (!silent) setVersionsOpen(true);
      } catch (e) {
        message.error("Failed to load versions");
    } finally {
      setIsBusy(false);
    }
  };

  const handleOpenVersions = () => {
    openRevisions(false);
  };

  const handleCreateRevision = async () => {
    // Kullanıcıya onay sor
    Modal.confirm({
      title: "Revizyon Oluştur",
      icon: <InfoCircleOutlined />,
      content: "Mevcut formdan yeni bir revizyon oluşturmak istediğinizden emin misiniz? Yaptığınız tüm değişiklikler yeni revizyona kopyalanacaktır.",
      okText: "Evet, Oluştur",
      cancelText: "İptal",
      onOk: async () => {
        try {
          if (!id) {
            message.warning("Önce formu taslak olarak kaydedin");
            return;
          }
          setIsBusy(true);
          
          const conf = getConfiguration();
          const api = new FormDataApi(conf);
          
          // ✅ Kullanıcının güncel tree'sinden schema'yı al
          const workspace = engine.workbench?.activeWorkspace;
          const tree = workspace?.operation?.tree;
          const result = tree ? transformToSchema(tree) : { schema: {} };
          
          // Mevcut form bilgilerini al
          const currentFormRes = await api.apiFormDataIdGet(id);
          const currentForm = currentFormRes?.data as any;
          
          // ✅ Kullanıcının tüm değişikliklerini içeren tam design
          const designWithAllChanges = {
            ...result,
            buttonPanel: {
              buttons: formButtons || [],
            },
            entities: entities || [],
          };
          
          // ✅ KONTROL: Form durumunu kontrol et
          if (currentForm.publicationStatus === 2) {
            // ✅ YAYINLANMIŞ FORM: Direkt revizyon oluştur (güncelleme yapma!)
            const hide = message.loading("Yayınlanmış formdan revizyon oluşturuluyor...", 0);
            
            try {
              // Revizyon oluştur
              await api.apiFormDataCreateRevisionIdPost(id);
              
              // Yeni revizyonu bul
              const parent = currentForm.parentFormId || id;
              const resList = await api.apiFormDataVersionsParentIdGet(parent);
              const list = (resList?.data || []) as any[];
              const drafts = list.filter((x: any) => x.publicationStatus === 1);
              const latestDraft = drafts.sort((a: any, b: any) => (b.revision || 0) - (a.revision || 0))[0];
              
              if (latestDraft?.id) {
                // ✅ Kullanıcının tüm değişikliklerini yeni revizyona kopyala
                const latestFormRes = await api.apiFormDataIdGet(latestDraft.id);
                const latestFormData = latestFormRes?.data as any;
                
                // ⚠️ ÖNEMLİ: Kullanıcının tree'sindeki değişiklikleri kullan (API'den gelen değil!)
                await api.apiFormDataPut({
                  id: latestDraft.id,
                  concurrencyToken: 0,
                  formName: latestFormData.formName,
                  formDescription: latestFormData.formDescription || "",
                  formDesign: JSON.stringify(designWithAllChanges), // ✅ Kullanıcının değişiklikleri
                  javaScriptCode: latestFormData.javaScriptCode || "",
                  isActive: latestFormData.isActive as any,
                  canEdit: latestFormData.canEdit !== undefined ? latestFormData.canEdit : true,
                  publicationStatus: 1 as any,
                  showInMenu: latestFormData.showInMenu || false,
                } as any);
                
                hide();
                Modal.success({
                  title: "Revizyon Başarıyla Oluşturuldu!",
                  icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
                  content: (
                    <div>
                      <p>✅ Revizyon #{latestDraft.revision} oluşturuldu</p>
                      <p>✅ Tüm değişiklikleriniz yeni revizyona kopyalandı</p>
                      <p>✅ Form artık düzenlenebilir durumda</p>
                    </div>
                  ),
                  onOk: () => {
                    navigate(`/forms/designer/${latestDraft.id}`);
                  },
                });
                return;
              } else {
                hide();
                message.warning("Revizyon oluşturuldu ancak yeni revizyon bulunamadı. Lütfen sayfayı yenileyin.");
                await openRevisions(true);
                return;
              }
            } catch (err: any) {
              hide();
              throw err;
            }
          } else {
            // ✅ TASLAK FORM: Önce formu güncelle, sonra revizyon oluştur
            const hide = message.loading("Taslak form kaydediliyor...", 0);
            
            try {
              // ADIM 1: Mevcut taslak formu son değişikliklerle güncelle
              await api.apiFormDataPut({
                id,
                concurrencyToken: 0,
                formName: currentForm.formName || formName,
                formDescription: currentForm.formDescription || "",
                formDesign: JSON.stringify(designWithAllChanges), // ✅ Tüm değişiklikler
                javaScriptCode: currentForm.javaScriptCode || "",
                isActive: currentForm.isActive as any,
                canEdit: currentForm.canEdit !== undefined ? currentForm.canEdit : true,
                publicationStatus: currentForm.publicationStatus || 1,
                showInMenu: currentForm.showInMenu || false,
              } as any);
              
              hide();
              const hide2 = message.loading("Revizyon oluşturuluyor...", 0);
              
              // ADIM 2: Revizyon oluştur
              await api.apiFormDataCreateRevisionIdPost(id);
              
              // ✅ ADIM 3: Yeni revizyonu bul ve tüm verileri kopyala
              const parent = currentForm.parentFormId || id;
              const resList = await api.apiFormDataVersionsParentIdGet(parent);
              const list = (resList?.data || []) as any[];
              const drafts = list.filter((x: any) => x.publicationStatus === 1);
              const latestDraft = drafts.sort((a: any, b: any) => (b.revision || 0) - (a.revision || 0))[0];
              
              if (latestDraft?.id) {
                // Yeni revizyona tüm verileri kopyala
                const latestFormRes = await api.apiFormDataIdGet(latestDraft.id);
                const latestFormData = latestFormRes?.data as any;
                
                // ⚠️ ÖNEMLİ: Kullanıcının tree'sindeki değişiklikleri kullan
                await api.apiFormDataPut({
                  id: latestDraft.id,
                  concurrencyToken: 0,
                  formName: latestFormData.formName,
                  formDescription: latestFormData.formDescription || "",
                  formDesign: JSON.stringify(designWithAllChanges), // ✅ Kullanıcının değişiklikleri
                  javaScriptCode: latestFormData.javaScriptCode || "",
                  isActive: latestFormData.isActive as any,
                  canEdit: latestFormData.canEdit !== undefined ? latestFormData.canEdit : true,
                  publicationStatus: 1 as any,
                  showInMenu: latestFormData.showInMenu || false,
                } as any);
                
                hide2();
                Modal.success({
                  title: "Revizyon Başarıyla Oluşturuldu!",
                  icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
                  content: (
                    <div>
                      <p>✅ Mevcut form kaydedildi</p>
                      <p>✅ Revizyon #{latestDraft.revision} oluşturuldu</p>
                      <p>✅ Tüm değişiklikleriniz yeni revizyona kopyalandı</p>
                    </div>
                  ),
                  onOk: () => {
                    navigate(`/forms/designer/${latestDraft.id}`);
                  },
                });
              } else {
                hide2();
                message.success("Revizyon oluşturuldu");
                await openRevisions(true);
              }
            } catch (err: any) {
              hide();
              throw err;
            }
          }
        } catch (e: any) {
          message.error(e?.response?.data?.message || "Revizyon oluşturma başarısız oldu");
        } finally {
          setIsBusy(false);
        }
      },
    });
  };

  const renderPreview = (tree: any) => {
    if (!tree) return <div style={{ padding: 16 }}>No schema</div>;
    const result = transformToSchema(tree);
    return (
      <div style={{ padding: 16 }}>
        <FormProvider form={previewForm}>
          <AntdFormily.Form>
            <AntdFormily.FormLayout layout="horizontal" labelAlign="left" labelCol={6} wrapperCol={18} size="default">
              <SchemaField schema={result.schema || {}} scope={workflowScope} />
            </AntdFormily.FormLayout>
          </AntdFormily.Form>
        </FormProvider>
      </div>
    );
  };

  // CRUD Ayarları Paneli (seçili alan için x-crud meta yazma/okuma)
  const CrudSettingsPanel = () => {
    // Seçili node'u bul
    const workspace = engine.workbench?.activeWorkspace as any;
    const operation = workspace?.operation as any;
    const selection = operation?.selection as any;
    const selectedIds: string[] = Array.from((selection?.selected as Set<string>) || []);
    const selectedId = selectedIds[0];
    const node = selectedId
      ? (operation?.tree?.findById
          ? operation.tree.findById(selectedId)
          : operation?.tree?.find?.((n: any) => n?.id === selectedId))
      : null;

    // Form/Container gibi düğümler için gizle (basit kontrol)
    const xc = node?.props?.['x-component'];
    const isContainer = ['Form', 'FormLayout', 'FormGrid', 'FormTab', 'FormCollapse', 'ArrayCards', 'ArrayTable', 'Card', 'Space'].includes(String(xc));
    if (!node || isContainer) return null;

    const crud = (node?.props?.['x-crud'] as any) || {};
    const listCfg = crud.list || {};
    const filterCfg = crud.filter || {};

    const updateCrud = (patch: any) => {
      try {
        const nextCrud = { ...crud, ...patch, list: { ...listCfg, ...(patch.list || {}) }, filter: { ...filterCfg, ...(patch.filter || {}) } };
        const nextProps = { ...(node.props || {}), ['x-crud']: nextCrud };
        if (typeof (node as any).setProps === 'function') {
          (node as any).setProps(nextProps);
        } else {
          node.props = nextProps;
        }
        // küçük bir titreşimle yeniden çiz
        (workspace as any)?.operation?.dispatch?.(new (class {})());
      } catch {
        // ignore
      }
    };

    return (
      <div style={{ padding: 12, borderBottom: "1px solid #f0f0f0", marginBottom: 8 }}>
        <Typography.Text strong>CRUD Ayarları</Typography.Text>
        <AntdForm layout="vertical" size="small" style={{ marginTop: 8 }}>
          <AntdDivider orientation="left" plain>Liste</AntdDivider>
          <AntdForm.Item label="Görünsün">
            <AntdSwitch
              checked={listCfg.visible !== false}
              onChange={(val) => updateCrud({ list: { visible: !!val } })}
            />
          </AntdForm.Item>
          <AntdForm.Item label="Başlık">
            <AntdInput
              value={listCfg.title}
              placeholder="Kolon başlığı (boşsa alan başlığı)"
              onChange={(e) => updateCrud({ list: { title: e.target.value } })}
            />
          </AntdForm.Item>
          <AntdForm.Item label="Sıra">
            <AntdInputNumber
              style={{ width: '100%' }}
              value={typeof listCfg.order === 'number' ? listCfg.order : undefined}
              onChange={(v) => updateCrud({ list: { order: typeof v === 'number' ? v : undefined } })}
            />
          </AntdForm.Item>
          <AntdForm.Item label="Genişlik">
            <AntdInputNumber
              style={{ width: '100%' }}
              value={typeof listCfg.width === 'number' ? listCfg.width : undefined}
              onChange={(v) => updateCrud({ list: { width: typeof v === 'number' ? v : undefined } })}
            />
          </AntdForm.Item>
          <AntdForm.Item label="Hizalama">
            <AntdSelect
              value={listCfg.align || 'left'}
              options={[
                { label: 'Sol', value: 'left' },
                { label: 'Orta', value: 'center' },
                { label: 'Sağ', value: 'right' },
              ]}
              onChange={(v) => updateCrud({ list: { align: v } })}
            />
          </AntdForm.Item>
          <AntdForm.Item label="Sıralanabilir">
            <AntdSwitch
              checked={listCfg.sortable !== false}
              onChange={(val) => updateCrud({ list: { sortable: !!val } })}
            />
          </AntdForm.Item>

          <AntdDivider orientation="left" plain>Filtre</AntdDivider>
          <AntdForm.Item label="Filtrede kullan">
            <AntdSwitch
              checked={!!filterCfg.enabled}
              onChange={(val) => updateCrud({ filter: { enabled: !!val } })}
            />
          </AntdForm.Item>
          <AntdForm.Item label="Tip">
            <AntdSelect
              value={filterCfg.type || 'text'}
              options={[
                { label: 'Metin', value: 'text' },
                { label: 'Seçim', value: 'select' },
                { label: 'Sayı', value: 'number' },
                { label: 'Aralık', value: 'range' },
                { label: 'Boolean', value: 'boolean' },
                { label: 'Tarih', value: 'date' },
                { label: 'Tarih Aralığı', value: 'daterange' },
              ]}
              onChange={(v) => updateCrud({ filter: { type: v } })}
            />
          </AntdForm.Item>
          <AntdForm.Item label="Placeholder">
            <AntdInput
              value={filterCfg.placeholder}
              placeholder="Filtre placeholder"
              onChange={(e) => updateCrud({ filter: { placeholder: e.target.value } })}
            />
          </AntdForm.Item>
        </AntdForm>
      </div>
    );
  };

  // Button Panel Yönetimi
  const handleAddButton = () => {
    const newButton: FormButton = {
      id: `btn_${Date.now()}`,
      label: "Yeni Buton",
      type: "default",
      action: "", // Kullanıcı doldurmalı
    };
    setEditingButton(newButton);
  };

  const handleEditButton = (button: FormButton) => {
    setEditingButton({ ...button });
  };

  const handleDeleteButton = (buttonId: string) => {
    setFormButtons(formButtons.filter((b) => b.id !== buttonId));
  };

  const handleSaveButton = () => {
    if (!editingButton) return;
    
    // ✅ Label kontrolü
    if (!editingButton.label.trim()) {
      message.warning("Buton etiketi gereklidir");
      return;
    }
    
    // ✅ Action code kontrolü - ZORUNLU
    if (!editingButton.action || !editingButton.action.trim()) {
      message.error("Action Code zorunludur! Workflow routing için gereklidir.");
      return;
    }
    
    // ✅ Action code format kontrolü (büyük harf, boşluk yok, özel karakter yok)
    const actionCode = editingButton.action.trim().toUpperCase().replace(/\s+/g, "_");
    if (!/^[A-Z0-9_]+$/.test(actionCode)) {
      message.error("Action Code sadece büyük harf, rakam ve alt çizgi içerebilir (örn: APPROVE, REJECT, SAVE)");
      return;
    }
    
    // ✅ Aynı action code'un başka bir butonda kullanılıp kullanılmadığını kontrol et
    const existingButtonWithSameAction = formButtons.find(
      (b) => b.id !== editingButton.id && b.action?.toUpperCase() === actionCode
    );
    if (existingButtonWithSameAction) {
      message.error(`Action Code "${actionCode}" zaten "${existingButtonWithSameAction.label}" butonunda kullanılıyor!`);
      return;
    }
    
    // Action code'u normalize et
    const normalizedButton: FormButton = {
      ...editingButton,
      action: actionCode,
    };
    
    const existingIndex = formButtons.findIndex((b) => b.id === normalizedButton.id);
    if (existingIndex >= 0) {
      const updated = [...formButtons];
      updated[existingIndex] = normalizedButton;
      setFormButtons(updated);
    } else {
      setFormButtons([...formButtons, normalizedButton]);
    }
    setEditingButton(null);
    message.success("Buton kaydedildi");
  };

  const ButtonPanelSettings = () => {

    return (
      <div style={{ padding: 12, borderBottom: "1px solid #f0f0f0", marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Typography.Text strong>Button Paneli</Typography.Text>
          <AntButton type="primary" size="small" icon={<PlusOutlined />} onClick={handleAddButton}>
            Buton Ekle
          </AntButton>
        </div>
        {formButtons.length === 0 ? (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Henüz buton eklenmedi. &quot;Buton Ekle&quot; butonuna tıklayarak buton ekleyebilirsiniz.
          </Typography.Text>
        ) : (
          <List
            size="small"
            dataSource={formButtons}
            renderItem={(btn) => (
              <List.Item
                style={{ 
                  padding: "12px 8px",
                  border: "1px solid #f0f0f0",
                  borderRadius: 4,
                  marginBottom: 8,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onClick={() => handleEditButton(btn)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#fafafa";
                  e.currentTarget.style.borderColor = "#d9d9d9";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor = "#f0f0f0";
                }}
                actions={[
                  <AntButton
                    key="edit"
                    type="link"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditButton(btn);
                    }}
                    title="Düzenle"
                  />,
                  <AntButton
                    key="delete"
                    type="link"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteButton(btn.id);
                    }}
                    title="Sil"
                  />,
                ]}
              >
                <List.Item.Meta
                  title={
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 500 }}>{btn.label}</span>
                      <Tag style={{ fontSize: 11 }}>{btn.type || "default"}</Tag>
                      {btn.action ? (
                        <Tag style={{ fontSize: 11 }} color="blue">{btn.action}</Tag>
                      ) : (
                        <Tag style={{ fontSize: 11 }} color="red">Action Code Yok!</Tag>
                      )}
                      {btn.icon && (
                        <Tag style={{ fontSize: 11 }} color="purple">
                          {React.createElement((Icons as any)[`${btn.icon}Outlined`] || (Icons as any)[btn.icon] || Icons.QuestionCircleOutlined)}
                        </Tag>
                      )}
                    </div>
                  }
                  description={
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                      Tıklayarak düzenleyebilirsiniz
                    </Typography.Text>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>
    );
  };

  return (
    <div style={{ width: "100%", height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column", paddingBottom: formButtons.length > 0 ? "60px" : "0" }}>
      <DesignerAny engine={engine}>
        <StudioPanelAny
          logo={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img src={formNeoLogo} alt="FormNeo" style={{ height: 40, width: "auto", display: "block" }} />
              <Typography.Text strong>FormNeo Designer</Typography.Text>
            </div>
          }
          actions={
            <AntSpace size="small">
              <AntButton 
                type="primary" 
                size="small" 
                icon={<SaveOutlined />} 
                onClick={handleSave}
                loading={isBusy}
                disabled={isBusy}
              >
                Kaydet
              </AntButton>
              <AntButton 
                size="small" 
                icon={<RocketOutlined />} 
                onClick={handlePublish}
                loading={isBusy}
                disabled={isBusy}
              >
                Yayınla
              </AntButton>
              <AntButton 
                size="small" 
                icon={<HistoryOutlined />} 
                onClick={handleOpenVersions}
                disabled={isBusy}
              >
                Revizyonlar
              </AntButton>
              <AntButton 
                size="small" 
                onClick={handleCreateRevision}
                loading={isBusy}
                disabled={isBusy}
              >
                Revizyon Oluştur
              </AntButton>
              <AntButton 
                size="small" 
                icon={<EyeOutlined />} 
                onClick={() => {}}
                disabled={isBusy}
              >
                Preview
              </AntButton>
              <AntButton 
                size="small" 
                icon={<CodeOutlined />} 
                onClick={() => {}}
                disabled={isBusy}
              >
                JSON
              </AntButton>
            </AntSpace>
          }
        >
          <CompositePanelAny>
            <CompositePanelAny.Item title="Bileşenler" icon="Component">
              <ResourceWidgetAny
                title="Girdiler"
                sources={[
                  Input,
                  Password,
                  NumberPicker,
                  CurrencyInput,
                  Rate,
                  Slider,
                  Select,
                  TreeSelect,
                  Cascader,
                  Transfer,
                  Checkbox,
                  Radio,
                  DatePicker,
                  TimePicker,
                  Upload,
                  Switch,
                  DepartmentSelect,
                  PositionSelect,
                  ParametreSelect,
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
                ]}
              />
              <ResourceWidgetAny
                title="FormNeo"
                sources={createResource(
                  ...((FormNeoButton as any).Resource || []),
                  ...((ApproveButtons as any).Resource || [])
                )}
              />
              <ResourceWidgetAny
                title="Yerleşimler"
                sources={[Card, FormGrid, FormTab, FormLayout, FormCollapse, Space]}
              />
              <ResourceWidgetAny title="Diziler" sources={[ArrayCards, ArrayTable]} />
              <ResourceWidgetAny title="Görüntüleme" sources={[Text]} />
            </CompositePanelAny.Item>
            <CompositePanelAny.Item title="Entities" icon="EntityDatabase">
              <div style={{ padding: 0, height: "100%" }}>
                <EntityManager
                  entities={entities}
                  onEntitiesChange={setEntities}
                />
              </div>
            </CompositePanelAny.Item>
            <CompositePanelAny.Item title="AI Assistant" icon="AIAssistant">
              <div style={{ padding: 0, height: "100%" }}>
                <AIAssistant
                  onFormGenerated={(formSchema, generatedEntities) => {
                    // Entity'leri ekle
                    if (generatedEntities && generatedEntities.length > 0) {
                      setEntities([...entities, ...generatedEntities]);
                    }
                    
                    // Form schema'yı canvas'a yükle
                    if (formSchema) {
                      try {
                        const tree = transformToTreeNode({ schema: formSchema });
                        const workspace = engine.workbench?.activeWorkspace;
                        const operation = workspace?.operation;
                        if (operation && tree) {
                          operation.tree.append(tree as any);
                        }
                        message.success("Form başarıyla oluşturuldu!");
                      } catch (error) {
                        console.error("Form yüklenirken hata:", error);
                        message.error("Form yüklenemedi");
                      }
                    }
                  }}
                />
              </div>
            </CompositePanelAny.Item>
          </CompositePanelAny>

          <WorkspaceAny id="form">
            <WorkspacePanelAny>
              <ToolbarPanelAny>
                <DesignerToolsWidgetAny />
                <ViewToolsWidgetAny use={["DESIGNABLE", "JSONTREE", "PREVIEW"]} />
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
                        FormNeoButton,
                        ApproveButtons,
                        CurrencyInput,
                        DepartmentSelect,
                        PositionSelect,
                        ParametreSelect,
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
                      }}
                    />
                  )}
                </ViewPanelAny>
                <ViewPanelAny type="JSONTREE" scrollable={false}>
                  {(tree: any) => {
                    const jsonString = (() => {
                      try {
                        const result = transformToSchema(tree);
                        return JSON.stringify(result.schema || {}, null, 2);
                      } catch {
                        return "{}";
                      }
                    })();
                    return (
                      <Editor
                        height="100%"
                        defaultLanguage="json"
                        value={jsonString}
                        onChange={(val) => {
                          try {
                            if (!val) return;
                            const parsed = JSON.parse(val);
                            const root = transformToTreeNode({ schema: parsed });
                            const workspace = engine.workbench?.activeWorkspace;
                            const operation = workspace?.operation;
                            if (operation && root) operation.tree.from(root as any);
                          } catch {
                            // invalid JSON: ignore live update
                          }
                        }}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 13,
                          wordWrap: "on",
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                        }}
                      />
                    );
                  }}
                </ViewPanelAny>
                <ViewPanelAny type="PREVIEW">
                  {(tree: any) => renderPreview(tree)}
                </ViewPanelAny>
              </ViewportPanelAny>
            </WorkspacePanelAny>
          </WorkspaceAny>

          <SettingsPanelAny title="Özellikler">
            <div style={{ padding: 12, borderBottom: "1px solid #f0f0f0", marginBottom: 8 }}>
              <AntdForm layout="vertical" size="small">
                <AntdForm.Item label="Form Name" required>
                  <AntdInput
                    placeholder="Enter form name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    disabled={!!id}
                  />
                </AntdForm.Item>
                {!!id && (
                  <Typography.Text type="secondary">
                    Form name is fixed for existing/revision forms.
                  </Typography.Text>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Typography.Text type="secondary">Status:</Typography.Text>
                  {publicationStatus === 2 ? (
                    <Tag color="green">Published</Tag>
                  ) : publicationStatus === 3 ? (
                    <Tag>Archived</Tag>
                  ) : (
                    <Tag color="default">Draft</Tag>
                  )}
                  {typeof revision === 'number' && (
                    <Tag color="blue">Rev #{revision}</Tag>
                  )}
                </div>
              </AntdForm>
            </div>
            {/* CRUD Ayarları (seçili alan için) */}
            <CrudSettingsPanel />
            {/* Button Panel Yönetimi */}
            <ButtonPanelSettings />
            <SettingsForm
              uploadAction="https://www.mocky.io/v2/5cc8019d300000980a055e76"
              components={{ LookupParametreSetter }}
            />
          </SettingsPanelAny>

          {/* Button Paneli - En Alta Sabitlenmiş */}
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: "#f5f5f5",
              borderTop: "1px solid #d9d9d9",
              padding: "12px 24px",
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 8,
              zIndex: 1000,
              boxShadow: "0 -2px 8px rgba(0,0,0,0.1)",
            }}
          >
            {formButtons.map((btn) => {
              const IconComponent = btn.icon ? (Icons as any)[`${btn.icon}Outlined`] || (Icons as any)[btn.icon] : null;
              return (
                <AntButton
                  key={btn.id}
                  type={btn.type || "default"}
                  icon={IconComponent ? React.createElement(IconComponent) : undefined}
                  onClick={() => {
                    if (btn.action) {
                      message.info(`Buton tıklandı: ${btn.label} (Action: ${btn.action})`);
                    } else {
                      message.warning(`"${btn.label}" butonunda Action Code tanımlı değil! Lütfen düzenleyin.`);
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleEditButton(btn);
                  }}
                  title={`${btn.label}${btn.action ? ` - Action: ${btn.action}` : " - Action Code yok!"} (Sağ tıkla düzenle)`}
                >
                  {btn.label}
                </AntButton>
              );
            })}
            {/* Buton Ekle Butonu */}
            <AntButton
              type="dashed"
              icon={<PlusOutlined />}
              onClick={handleAddButton}
              style={{ minWidth: 120 }}
            >
              Buton Ekle
            </AntButton>
          </div>
          {/* Button Edit Modal - Component seviyesinde */}
          <Modal
            title={editingButton?.id && formButtons.find((b) => b.id === editingButton.id) ? "Buton Düzenle" : "Yeni Buton"}
            open={!!editingButton}
            onOk={handleSaveButton}
            onCancel={() => setEditingButton(null)}
            okText="Kaydet"
            cancelText="İptal"
          >
            {editingButton && (
              <AntdForm layout="vertical" size="small">
                <AntdForm.Item label="Buton Etiketi" required>
                  <AntdInput
                    value={editingButton.label}
                    onChange={(e) => setEditingButton({ ...editingButton, label: e.target.value })}
                    placeholder="Buton etiketi"
                  />
                </AntdForm.Item>
                <AntdForm.Item label="Buton Tipi">
                  <AntdSelect
                    value={editingButton.type || "default"}
                    onChange={(v) => setEditingButton({ ...editingButton, type: v })}
                    options={[
                      { label: "Varsayılan", value: "default" },
                      { label: "Birincil", value: "primary" },
                      { label: "Kesikli", value: "dashed" },
                      { label: "Link", value: "link" },
                      { label: "Metin", value: "text" },
                    ]}
                  />
                </AntdForm.Item>
                <AntdForm.Item label="İkon (Opsiyonel)">
                  <AntdInput
                    value={editingButton.icon || ""}
                    onChange={(e) => setEditingButton({ ...editingButton, icon: e.target.value })}
                    placeholder="Ant Design icon adı (örn: save, delete)"
                  />
                </AntdForm.Item>
                <AntdForm.Item 
                  label="Action Code (Zorunlu)" 
                  required
                  help="Workflow routing için gereklidir. Örn: APPROVE, REJECT, SAVE"
                  validateStatus={editingButton.action && editingButton.action.trim() ? "" : "warning"}
                >
                  <AntdInput
                    value={editingButton.action || ""}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/\s+/g, "_");
                      setEditingButton({ ...editingButton, action: value });
                    }}
                    placeholder="APPROVE, REJECT, SAVE vb."
                    maxLength={50}
                  />
                  <Typography.Text type="secondary" style={{ fontSize: 11, display: "block", marginTop: 4 }}>
                    ⚠️ Bu kod workflow&apos;da hangi yolu takip edeceğini belirler. Büyük harf, rakam ve alt çizgi kullanın.
                  </Typography.Text>
                </AntdForm.Item>
              </AntdForm>
            )}
          </Modal>
          <Drawer open={versionsOpen} onClose={() => setVersionsOpen(false)} width={360}>
            <div style={{ padding: 16 }}>
              <Typography.Title level={5}>Revisions</Typography.Title>
              <List
                dataSource={versions}
                renderItem={(v: any, idx) => (
                  <List.Item style={{ cursor: 'pointer' }} onClick={() => navigate(`/forms/designer/${v.id}`)}>
                    <List.Item.Meta
                      title={`Rev #${v.revision ?? idx + 1} ${v.publicationStatus === 2 ? '(Published)' : '(Draft)'}`}
                      description={v.updatedDate || v.createdDate}
                    />
                  </List.Item>
                )}
              />
            </div>
          </Drawer>
        </StudioPanelAny>
      </DesignerAny>
    </div>
  );
}


