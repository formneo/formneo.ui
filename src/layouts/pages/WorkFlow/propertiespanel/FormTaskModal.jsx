import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  TextField,
  IconButton,
  Autocomplete,
  Divider,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Paper,
  Chip,
  Switch,
  Tabs,
  Tab,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { createFilterOptions } from "@mui/material/Autocomplete";
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Layers as LayersIcon,
  VerifiedUser as VerifiedUserIcon,
  InfoOutlined as InfoOutlinedIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Message as MessageIcon,
  Settings as SettingsIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  Code as CodeIcon,
  ContentCopy as ContentCopyIcon,
  PlayArrow as PlayArrowIcon,
  BugReport as BugReportIcon,
  TableChart as TableChartIcon,
  FormatListBulleted as FormatListBulletedIcon,
  AccountTree as AccountTreeIcon,
  Work as WorkIcon,
  SupervisorAccount as SupervisorAccountIcon,
  Business as BusinessIcon,
  ChevronRight as ChevronRightIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Rule as RuleIcon,
} from "@mui/icons-material";
import { Editor } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";
import { UserApi, FormDataApi, OrgUnitsApi, PositionsApi, EmployeeAssignmentsApi } from "api/generated";
import getConfiguration from "confiuration";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { createForm } from "@formily/core";
import { FormProvider, createSchemaField } from "@formily/react";
import * as AntdFormily from "@formily/antd";
import { Card as AntdCard, Slider as AntdSlider, Rate as AntdRate, message as antdMessage, Button as AntdButton } from "antd";
import CurrencyInput from "../../FormEditor/custom/CurrencyInput";
import "antd/dist/antd.css";
import "../../FormEditor/FormEditorReactions.css";

/**
 * ✅ FormTask Modal Component
 * 
 * Özellikler:
 * - Kullanıcı atama (Autocomplete ile arama)
 * - Form alanlarını listeleme ve görünürlük kontrolü
 * - Workflow'dan seçili formu kullanır
 */

const STORAGE_KEY_REACTIONS_PENDING = "formTask_reactions_pending";

const FormTaskModal = ({ open, onClose, initialValues, node, onSave, workflowFormId, workflowFormName }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState(initialValues?.name || "Form Görevi");
  const [searchByName, setSearchByName] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formFields, setFormFields] = useState([]);
  const [formButtons, setFormButtons] = useState([]);
  const [fieldSettings, setFieldSettings] = useState({});
  const [buttonSettings, setButtonSettings] = useState({});
  const [message, setMessage] = useState(initialValues?.message || "");
  const [activeTab, setActiveTab] = useState("assignment");
  const [inputValue, setInputValue] = useState("");
  const [fieldScript, setFieldScript] = useState(initialValues?.fieldScript || "");
  const [scriptEventType, setScriptEventType] = useState(initialValues?.scriptEventType || "onLoad"); // "onLoad" | "onChange" | "both"
  const [monacoEditor, setMonacoEditor] = useState(null);
  const [monacoInstance, setMonacoInstance] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [showFieldReference, setShowFieldReference] = useState(false);
  const initialSelectedManagerId = initialValues?.selectedManagerId || null;
  const dispatchBusy = useBusy();
  
  // Atama tipi için state
  const [assignmentType, setAssignmentType] = useState(
    initialValues?.assignmentType || "direct_manager"
  ); // "direct_manager" | "department_manager" | "position" | "manual"
  
  // Organizasyon bazlı seçim için state'ler
  const [selectionMode, setSelectionMode] = useState(initialValues?.selectionMode || "manual"); // "manual" | "organization"
  const [orgUnits, setOrgUnits] = useState([]);
  const [positions, setPositions] = useState([]);
  const [managers, setManagers] = useState([]);
  const [selectedOrgUnit, setSelectedOrgUnit] = useState(initialValues?.selectedOrgUnit || "");
  const [selectedPosition, setSelectedPosition] = useState(initialValues?.selectedPosition || "");
  const [selectedManager, setSelectedManager] = useState(null);
  const [filteredUsersByOrg, setFilteredUsersByOrg] = useState([]);
  const userFilterOptions = createFilterOptions({
    stringify: (option) =>
      [
        option?.firstName,
        option?.lastName,
        option?.userAppName,
        option?.userName,
        option?.email,
      ]
        .filter(Boolean)
        .join(" "),
  });

  // ===== Form Başlangıç Ayarları için state'ler =====
  const [initRules, setInitRules] = useState([]);
  const [conditionalRules, setConditionalRules] = useState([]);
  const [visibilitySettings, setVisibilitySettings] = useState({});
  const [formSchema, setFormSchema] = useState(null);
  const [testPreviewOpen, setTestPreviewOpen] = useState(false);
  const [initSettingsTab, setInitSettingsTab] = useState(0); // 0: Değer Atama, 1: Koşullar, 2: Görünürlük, 3: Butonlar, 4: Formily Reactions
  const [buttonVisibilitySettings, setButtonVisibilitySettings] = useState({}); // { buttonId: true/false }
  const [formReactions, setFormReactions] = useState(null); // Formily x-reactions (ReactionsSetter)

  // FormTaskModal açıkken body'ye class ekle - ReactionsSetter modalı üstte görünsün
  useEffect(() => {
    if (open) {
      document.body.classList.add("form-task-modal-open");
    }
    return () => {
      document.body.classList.remove("form-task-modal-open");
    };
  }, [open]);
  
  // Test form instance
  const testForm = React.useMemo(() => createForm(), []);
  const SchemaField = React.useMemo(() => createSchemaField({ 
    components: { 
      ...AntdFormily, 
      CurrencyInput, 
      Card: AntdCard, 
      Slider: AntdSlider, 
      Rate: AntdRate 
    } 
  }), []);


  // Script şablonları
  const scriptTemplates = {
    "": "Özel Script",
    "conditional-visibility": `// Koşullu Görünürlük Şablonu
// Eğer bir alan belirli bir değere sahipse, diğer alanları göster/gizle

const anaAlan = getFieldValue("anaAlan");
if (anaAlan === "Değer1") {
  setFieldVisible("gizliAlan1", true);
  setFieldVisible("gizliAlan2", false);
} else if (anaAlan === "Değer2") {
  setFieldVisible("gizliAlan1", false);
  setFieldVisible("gizliAlan2", true);
}`,
    "auto-calculation": `// Otomatik Hesaplama Şablonu
// Birden fazla alanı toplayıp sonucu başka bir alana yaz

const deger1 = parseFloat(getFieldValue("deger1") || 0);
const deger2 = parseFloat(getFieldValue("deger2") || 0);
const deger3 = parseFloat(getFieldValue("deger3") || 0);

const toplam = deger1 + deger2 + deger3;
setFieldValue("toplam", toplam);`,
    "readonly-condition": `// Koşullu Readonly Şablonu
// Belirli koşullarda alanları readonly yap

const durum = getFieldValue("durum");
if (durum === "Onaylandi" || durum === "Reddedildi") {
  setFieldReadonly("aciklama", true);
  setFieldReadonly("notlar", true);
} else {
  setFieldReadonly("aciklama", false);
  setFieldReadonly("notlar", false);
}`,
    "form-validation": `// Form Validasyon Şablonu
// Alan değerlerini kontrol et ve uygun aksiyonlar al

const yas = parseInt(getFieldValue("yas") || 0);
if (yas < 18) {
  setFieldVisible("veliBilgileri", true);
  setFieldReadonly("veliBilgileri", false);
} else {
  setFieldVisible("veliBilgileri", false);
}

const email = getFieldValue("email");
if (email && !email.includes("@")) {
  // Email formatı hatalı - backend'de kontrol edilebilir
  console.warn("Email formatı hatalı");
}`,
    "date-calculation": `// Tarih Hesaplama Şablonu
// Tarih alanlarından süre hesapla

const baslangic = getFieldValue("baslangicTarihi");
const bitis = getFieldValue("bitisTarihi");

if (baslangic && bitis) {
  const baslangicDate = new Date(baslangic);
  const bitisDate = new Date(bitis);
  const gunFarki = Math.ceil((bitisDate - baslangicDate) / (1000 * 60 * 60 * 24));
  
  if (gunFarki > 0) {
    setFieldValue("gunSayisi", gunFarki);
  }
}`,
  };

  // Şablon seçildiğinde script'i güncelle
  const handleTemplateChange = (templateKey) => {
    setSelectedTemplate(templateKey);
    if (templateKey && scriptTemplates[templateKey]) {
      setFieldScript(scriptTemplates[templateKey]);
    }
  };

  // Hızlı işlemler
  const quickActions = {
    "hide-all": () => {
      const script = formFields.map(field => {
        const key = field.normalizedKey || field.key;
        return `setFieldVisible("${key}", false);`;
      }).join("\n");
      setFieldScript(script);
    },
    "show-all": () => {
      const script = formFields.map(field => {
        const key = field.normalizedKey || field.key;
        return `setFieldVisible("${key}", true);`;
      }).join("\n");
      setFieldScript(script);
    },
    "readonly-all": () => {
      const script = formFields.map(field => {
        const key = field.normalizedKey || field.key;
        return `setFieldReadonly("${key}", true);`;
      }).join("\n");
      setFieldScript(script);
    },
    "enable-all": () => {
      const script = formFields.map(field => {
        const key = field.normalizedKey || field.key;
        return `setFieldReadonly("${key}", false);`;
      }).join("\n");
      setFieldScript(script);
    },
    "debug-template": () => {
      const script = `// Debug Template - Tüm alanları console'a yazdır

${formFields.map(field => {
  const key = field.normalizedKey || field.key;
  return ``;
}).join("\n")}

`;
      setFieldScript(script);
    },
  };

  // Monaco Editor için IntelliSense tip tanımlarını oluştur ve güncelle
  useEffect(() => {
    if (!monacoInstance || activeTab !== "script") return;

    // Form alanları varsa detaylı tip tanımları, yoksa temel tip tanımları
    let typeDefinitions = '';
    
    if (formFields.length > 0) {
      // Form alanlarını tip tanımına dönüştür (normalize edilmiş key kullan)
      const fieldTypes = formFields.map(field => {
        const typeMap = {
          string: "string",
          number: "number",
          boolean: "boolean",
          date: "string",
          datetime: "string",
        };
        const fieldType = typeMap[field.type] || "any";
        const normalizedKey = field.normalizedKey || field.key;
        const label = (field.label || normalizedKey).replace(/"/g, '\\"');
        return `  /** ${label} (${field.type}) */\n  "${normalizedKey}": ${fieldType};`;
      }).join("\n");

      // Form alanlarını string literal union type olarak oluştur (IntelliSense için - normalize edilmiş key kullan)
      const fieldKeys = formFields.map(field => {
        const normalizedKey = field.normalizedKey || field.key;
        return `"${normalizedKey}"`;
      }).join(" | ");
      
      // Her form alanı için overload ekle (IntelliSense için - normalize edilmiş key kullan)
      const fieldOverloads = formFields.map(field => {
        const normalizedKey = field.normalizedKey || field.key;
        const label = (field.label || normalizedKey).replace(/"/g, '\\"');
        return `/**
 * ${label} alanının değerini oku
 * @param {"${normalizedKey}"} fieldKey
 * @returns {any}
 */
declare function getFieldValue(fieldKey: "${normalizedKey}"): any;`;
      }).join("\n");

      typeDefinitions = `
/**
 * Form Alanları Tip Tanımları
 * Bu dosya otomatik olarak oluşturulmuştur
 */

/** Form alan anahtarları */
type FormFieldKey = ${fieldKeys || "string"};

/** Form değerleri objesi */
declare var formValues: {
${fieldTypes}
};

/**
 * Alan görünürlüğünü ayarla
 * @param {FormFieldKey} fieldKey - Form alanının anahtarı
 * @param {boolean} visible - Görünür mü? (true/false)
 */
declare function setFieldVisible(fieldKey: FormFieldKey, visible: boolean): void;

/**
 * Alan readonly durumunu ayarla
 * @param {FormFieldKey} fieldKey - Form alanının anahtarı
 * @param {boolean} readonly - Readonly mi? (true/false)
 */
declare function setFieldReadonly(fieldKey: FormFieldKey, readonly: boolean): void;

/**
 * Alan değerini ata
 * @param {FormFieldKey} fieldKey - Form alanının anahtarı
 * @param {any} value - Atanacak değer
 */
declare function setFieldValue(fieldKey: FormFieldKey, value: any): void;

${fieldOverloads}

/**
 * Alan değerini oku (genel)
 * @param {string} fieldKey - Form alanının anahtarı
 * @returns {any} Alan değeri
 */
declare function getFieldValue(fieldKey: string): any;
`;
    } else {
      // Temel helper fonksiyonlar için tip tanımları (form alanları olmadan)
      typeDefinitions = `
/**
 * Form Script Helper Fonksiyonları
 */

/**
 * Alan görünürlüğünü ayarla
 * @param {string} fieldKey - Form alanının anahtarı
 * @param {boolean} visible - Görünür mü? (true/false)
 */
declare function setFieldVisible(fieldKey: string, visible: boolean): void;

/**
 * Alan readonly durumunu ayarla
 * @param {string} fieldKey - Form alanının anahtarı
 * @param {boolean} readonly - Readonly mi? (true/false)
 */
declare function setFieldReadonly(fieldKey: string, readonly: boolean): void;

/**
 * Alan değerini ata
 * @param {string} fieldKey - Form alanının anahtarı
 * @param {any} value - Atanacak değer
 */
declare function setFieldValue(fieldKey: string, value: any): void;

/**
 * Alan değerini oku
 * @param {string} fieldKey - Form alanının anahtarı
 * @returns {any} Alan değeri
 */
declare function getFieldValue(fieldKey: string): any;

/**
 * Form değerleri objesi
 */
declare var formValues: Record<string, any>;
`;
    }

    try {
      // Önceki tip tanımını kaldır ve yenisini ekle
      const existingLibs = monacoInstance.languages.typescript.javascriptDefaults.getExtraLibs();
      const libsMap = new Map(Object.entries(existingLibs || {}));
      
      if (libsMap.has("file:///formFields.d.ts")) {
        libsMap.delete("file:///formFields.d.ts");
        monacoInstance.languages.typescript.javascriptDefaults.setExtraLibs(
          Object.fromEntries(libsMap)
        );
      }

      // Güncellenmiş tip tanımlarını ekle (form alanları ile)
      const disposable = monacoInstance.languages.typescript.javascriptDefaults.addExtraLib(
        typeDefinitions,
        "file:///formFields.d.ts"
      );

      

      // IntelliSense'i tetikle
      if (monacoEditor) {
        const model = monacoEditor.getModel();
        if (model) {
          // Model URI'sini kontrol et
          
          
          // Model'i yeniden yükle (IntelliSense'i güncellemek için)
          setTimeout(() => {
            // IntelliSense'i manuel olarak tetikle
            try {
              monacoEditor.getAction("editor.action.triggerSuggest")?.run();
              
            } catch (e) {
              console.warn("IntelliSense tetiklenemedi:", e);
            }
          }, 300);
        }
      }

      // Cleanup function
      return () => {
        if (disposable) {
          disposable.dispose();
        }
      };
    } catch (error) {
      console.warn("Monaco IntelliSense güncellenirken hata:", error);
    }
  }, [formFields, monacoInstance, monacoEditor, activeTab]);

  // Kullanıcıları otomatik yükle (modal açıldığında)
  useEffect(() => {
    const loadInitialUsers = async () => {
      if (!open) return;
      
      try {
        dispatchBusy({ isBusy: true });
        const conf = getConfiguration();
        const api = new UserApi(conf);
        const data = await api.apiUserGetAllWithOuthPhotoGet();
        const pureData = Array.isArray(data?.data) ? data.data : [];
        setAllUsers(pureData);
        setSearchByName(pureData);
      } catch (error) {
        console.error("Kullanıcılar yüklenirken hata:", error);
        // Hata durumunda boş liste
        setSearchByName([]);
      } finally {
        dispatchBusy({ isBusy: false });
      }
    };

    if (open) {
      loadInitialUsers();
    } else {
      // Modal kapandığında listeyi temizle
      setSearchByName([]);
      setAllUsers([]);
    }
  }, [open, dispatchBusy]);

  // Organizasyon verilerini yükle (modal açıldığında)
  useEffect(() => {
    const loadOrganizationData = async () => {
      if (!open) return;
      
      try {
        dispatchBusy({ isBusy: true });
        const conf = getConfiguration();
        
        // Organizasyon birimleri, pozisyonlar ve yöneticileri paralel çek
        const [orgUnitsResponse, positionsResponse, managersResponse] = await Promise.all([
          new OrgUnitsApi(conf).apiOrgUnitsGet(),
          new PositionsApi(conf).apiPositionsGet(),
          new UserApi(conf).apiUserGetAllWithOuthPhotoGet(),
        ]);
        
        setOrgUnits(orgUnitsResponse.data || []);
        setPositions(positionsResponse.data || []);
        setManagers(managersResponse.data || []);
      } catch (error) {
        console.error("Organizasyon verileri yüklenirken hata:", error);
        setOrgUnits([]);
        setPositions([]);
        setManagers([]);
      } finally {
        dispatchBusy({ isBusy: false });
      }
    };

    if (open) {
      loadOrganizationData();
    } else {
      // Modal kapandığında temizle
      setOrgUnits([]);
      setPositions([]);
      setManagers([]);
      setSelectedOrgUnit("");
      setSelectedPosition("");
      setSelectedManager(null);
      setFilteredUsersByOrg([]);
    }
  }, [open, dispatchBusy]);

  useEffect(() => {
    if (!selectedManager && initialSelectedManagerId && managers.length > 0) {
      const match = managers.find(
        (manager) => manager.id === initialSelectedManagerId || manager.userAppId === initialSelectedManagerId
      );
      if (match) {
        setSelectedManager(match);
      }
    }
  }, [managers, initialSelectedManagerId, selectedManager]);

  useEffect(() => {
    if (!open) return;

    if (assignmentType === "manual") {
      setSelectedOrgUnit("");
      setSelectedPosition("");
      setSelectedManager(null);
      return;
    }

    if (assignmentType === "position") {
      setSelectedOrgUnit("");
      setSelectedManager(null);
      setSelectedUser(null);
      return;
    }

    if (assignmentType === "department_manager") {
      setSelectedPosition("");
      setSelectedManager(null);
      setSelectedUser(null);
      return;
    }

    if (assignmentType === "department_all") {
      setSelectedPosition("");
      setSelectedManager(null);
      setSelectedUser(null);
      return;
    }

    if (assignmentType === "direct_manager") {
      setSelectedOrgUnit("");
      setSelectedPosition("");
      setSelectedManager(null);
      setSelectedUser(null);
    }
  }, [assignmentType, open]);

  // Organizasyon kriterlerine göre kullanıcıları filtrele
  useEffect(() => {
    const filterUsersByOrganization = async () => {
      if (selectionMode !== "organization" || (!selectedOrgUnit && !selectedPosition && !selectedManager)) {
        setFilteredUsersByOrg([]);
        return;
      }

      try {
        dispatchBusy({ isBusy: true });
        const conf = getConfiguration();

        // Tüm aktif atamaları çek
        const employeeAssignmentsApi = new EmployeeAssignmentsApi(conf);
        const allAssignments = await employeeAssignmentsApi.apiEmployeeAssignmentsGet();
        
        const assignments = Array.isArray(allAssignments?.data) ? allAssignments.data : [];
        
        // Aktif atamaları filtrele (endDate null olanlar)
        const activeAssignments = assignments.filter(assignment => !assignment.endDate);
        
        // Seçilen kriterlere göre filtrele
        let filteredAssignments = activeAssignments;
        
        if (selectedOrgUnit) {
          filteredAssignments = filteredAssignments.filter(a => a.orgUnitId === selectedOrgUnit);
        }
        
        if (selectedPosition) {
          filteredAssignments = filteredAssignments.filter(a => a.positionId === selectedPosition);
        }
        
        if (selectedManager) {
          filteredAssignments = filteredAssignments.filter(a => a.managerId === selectedManager.id);
        }
        
        // Atamalardan kullanıcı ID'lerini al
        const userIds = [...new Set(filteredAssignments.map(a => a.userId))];
        
        // Kullanıcı bilgilerini çek
        if (userIds.length > 0) {
          const userApi = new UserApi(conf);
          const allUsers = await userApi.apiUserGetAllWithOuthPhotoGet();
          const allUsersList = Array.isArray(allUsers?.data) ? allUsers.data : [];
          
          // ID'lere göre kullanıcıları filtrele
          const filteredUsers = allUsersList.filter(user => userIds.includes(user.id));
          setFilteredUsersByOrg(filteredUsers);
        } else {
          setFilteredUsersByOrg([]);
        }
      } catch (error) {
        console.error("Organizasyon bazlı kullanıcı filtreleme hatası:", error);
        setFilteredUsersByOrg([]);
      } finally {
        dispatchBusy({ isBusy: false });
      }
    };

    if (open && selectionMode === "organization") {
      filterUsersByOrganization();
    }
  }, [open, selectionMode, selectedOrgUnit, selectedPosition, selectedManager, dispatchBusy]);

  // Form alanlarını yükle
  useEffect(() => {
    const loadFormFields = async () => {
      // ✅ formId'yi önce node'un mevcut data'sından al, yoksa workflowFormId'yi kullan
      const formId = initialValues?.formId || node?.data?.formId || workflowFormId;
      
      if (!formId) return;
      
      try {
        dispatchBusy({ isBusy: true });
        const conf = getConfiguration();
        const api = new FormDataApi(conf);
        const res = await api.apiFormDataIdGet(formId);
        const formData = res?.data;
        
        if (formData?.formDesign) {
          const design = JSON.parse(formData.formDesign);
          let schema = design?.schema ?? design;
          // transformToTreeNode için: { type: 'object', properties } formatı
          if (schema && schema.properties && !schema.type) {
            schema = { type: "object", ...schema };
          }
          setFormSchema(schema ? { schema, form: design?.form || {} } : null);

          // Form alanlarını yükle
          if (schema?.properties) {
            const fields = extractFieldsFromSchema(schema.properties);
            setFormFields(fields);
            
            // Mevcut field settings'i yükle veya varsayılan olarak tüm alanları görünür ve editable yap
            const settings = {};
            fields.forEach(field => {
              settings[field.key] = initialValues?.fieldSettings?.[field.key] ?? {
                visible: true,
                readonly: false,
                required: field.required || false,
              };
            });
            setFieldSettings(settings);
          }

          // Form butonlarını yükle
          const buttons = design?.buttonPanel?.buttons || [];
          setFormButtons(buttons);
          
          // Mevcut button settings'i yükle veya varsayılan olarak tüm butonları görünür yap
          const btnSettings = {};
          buttons.forEach(button => {
            btnSettings[button.id] = initialValues?.buttonSettings?.[button.id] ?? {
              visible: true,
            };
          });
          setButtonSettings(btnSettings);
        }
      } catch (error) {
        console.error("Form alanları yüklenirken hata:", error);
      } finally {
        dispatchBusy({ isBusy: false });
      }
    };

    if (open) {
      // ✅ formId varsa form alanlarını yükle
      const formId = initialValues?.formId || node?.data?.formId || workflowFormId;
      if (formId) {
        loadFormFields();
      }
    }
  }, [open, workflowFormId, initialValues, node]);

  // Initial values değiştiğinde state'i güncelle
  useEffect(() => {
    if (open && initialValues) {
      setName(initialValues.name || "Form Görevi");
      if (initialValues.userId || initialValues.userName) {
        setSelectedUser({
          id: initialValues.userId,
          userName: initialValues.userName,
          firstName: initialValues.userFirstName,
          lastName: initialValues.userLastName,
        });
        // Seçili kullanıcı varsa inputValue'yu set et
        if (initialValues.userFirstName && initialValues.userLastName) {
          setInputValue(`${initialValues.userFirstName} ${initialValues.userLastName}`);
        } else if (initialValues.userName) {
          setInputValue(initialValues.userName);
        }
      } else {
        setSelectedUser(null);
        setInputValue("");
      }
      if (initialValues.fieldSettings) {
        setFieldSettings(initialValues.fieldSettings);
      }
      if (initialValues.buttonSettings) {
        setButtonSettings(initialValues.buttonSettings);
      }
      if (initialValues.message) {
        setMessage(initialValues.message);
      }
      if (initialValues.fieldScript) {
        setFieldScript(initialValues.fieldScript);
      }
      setFormReactions(initialValues.formReactions ?? null);
    } else if (!open) {
      // Modal kapandığında state'leri sıfırla
      setInputValue("");
      setSearchByName([]);
    }
  }, [open, initialValues]);

  // Key'i normalize et (teknik ID'leri kaldır, sadece alan adını kullan)
  const normalizeFieldKey = (key) => {
    // "u0migqzm2uo.stafftype" -> "stafftype"
    // Nokta ile ayrılmışsa son kısmı al
    if (key.includes('.')) {
      const parts = key.split('.');
      return parts[parts.length - 1];
    }
    // Teknik ID formatı varsa (örn: "u0migqzm2uo") kaldır
    // Eğer key teknik ID gibi görünüyorsa (sadece harf ve rakam, uzunluğu 8-12 karakter), son kısmı al
    const match = key.match(/^[a-z0-9]{8,12}\.(.+)$/);
    if (match) {
      return match[1];
    }
    return key;
  };

  // Form schema'dan alanları çıkar
  const extractFieldsFromSchema = (properties, parentPath = "") => {
    const fields = [];
    
    Object.keys(properties).forEach(key => {
      const prop = properties[key];
      const fieldPath = parentPath ? `${parentPath}.${key}` : key;
      
      if (prop.type === "void") {
        // Container component (Card, FormLayout, vb.) - içindeki alanları recursive olarak al
        if (prop.properties) {
          fields.push(...extractFieldsFromSchema(prop.properties, fieldPath));
        }
      } else if (prop["x-component"] && prop["x-component"] !== "FormItem") {
        // Normal field
        const normalizedKey = normalizeFieldKey(fieldPath);
        fields.push({
          key: fieldPath, // Orijinal key (backend için)
          normalizedKey: normalizedKey, // Normalize edilmiş key (IntelliSense için)
          label: prop.title || prop.label || normalizedKey,
          type: prop.type || "string",
          component: prop["x-component"],
          required: prop.required || false,
        });
      } else if (prop.properties) {
        // Nested properties
        fields.push(...extractFieldsFromSchema(prop.properties, fieldPath));
      }
    });
    
    return fields;
  };

  // Kullanıcı arama
  const handleSearchByName = async (value) => {
    if (!value || value.trim() === "") {
      setSearchByName(allUsers);
      return;
    }
    
    dispatchBusy({ isBusy: true });
    try {
      const conf = getConfiguration();
      const api = new UserApi(conf);
      const data = await api.apiUserGetAllUsersWithNameGet(value.trim());
      const pureData = data?.data || [];
      setSearchByName(pureData);
    } catch (error) {
      console.error("Kullanıcı arama hatası:", error);
      setSearchByName(allUsers);
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  // Buton görünürlüğünü değiştir
  const handleButtonVisibilityChange = (buttonId, visible) => {
    setButtonSettings(prev => ({
      ...prev,
      [buttonId]: {
        visible,
      },
    }));
  };

  // ===== FORM BAŞLANGIÇ AYARLARI - Helper Fonksiyonlar =====
  
  // InitScript'ten mevcut ayarları parse et
  React.useEffect(() => {
    if (open && initialValues?.initScript) {
      const parsed = parseScriptToSettings(initialValues.initScript);
      setInitRules(parsed.initRules);
      setConditionalRules(parsed.conditionalRules);
      setVisibilitySettings(parsed.visibilitySettings);
      setButtonVisibilitySettings(parsed.buttonVisibilitySettings || {});
    } else if (open) {
      setInitRules([]);
      setConditionalRules([]);
      setVisibilitySettings({});
      setButtonVisibilitySettings({});
    }
  }, [open, initialValues?.initScript]);

  // Form schema'yı yükle (Form Başlangıç Ayarları için)
  React.useEffect(() => {
    const loadFormSchema = async () => {
      const formId = initialValues?.formId || node?.data?.formId || workflowFormId;
      
      if (!formId) {
        return;
      }
      
      try {
        const conf = getConfiguration();
        const api = new FormDataApi(conf);
        const res = await api.apiFormDataIdGet(formId);
        const formData = res?.data;
        
        if (formData?.formDesign) {
          const design = JSON.parse(formData.formDesign);
          const schema = design?.schema;
          
          setFormSchema(schema);
          
          if (schema?.properties && formFields.length > 0) {
            // Varsayılan görünürlük ayarları
            const defaultVisibility = {};
            formFields.forEach(field => {
              defaultVisibility[field.key] = initialValues?.visibilitySettings?.[field.key] ?? "visible";
            });
            setVisibilitySettings(defaultVisibility);
          }
          
          // Form butonlarını yükle (init settings için)
          // Not: formButtons zaten başka bir yerde yükleniyor, ama init settings için buttonVisibilitySettings'i set ediyoruz
          if (formButtons.length > 0) {
            const defaultButtonVisibility = {};
            formButtons.forEach(button => {
              defaultButtonVisibility[button.id] = initialValues?.buttonVisibilitySettings?.[button.id] ?? true;
            });
            setButtonVisibilitySettings(defaultButtonVisibility);
          }
        }
      } catch (error) {
        console.error("❌ Form schema yüklenirken hata:", error);
      }
    };

    if (open && formFields.length > 0) {
      loadFormSchema();
    }
  }, [open, workflowFormId, initialValues, node, formFields]);

  // Script'i parse edip UI ayarlarına çevir
  const parseScriptToSettings = (script) => {
    const result = {
      initRules: [],
      conditionalRules: [],
      visibilitySettings: {},
      buttonVisibilitySettings: {},
    };
    
    const lines = script.split("\n").filter(line => line.trim() && !line.trim().startsWith("//"));
    
    lines.forEach(line => {
      // setButtonVisible parse
      const btnVisMatch = line.match(/setButtonVisible\("([^"]+)",\s*(true|false)\)/);
      if (btnVisMatch) {
        result.buttonVisibilitySettings[btnVisMatch[1]] = btnVisMatch[2] === "true";
        return;
      }
      
      // setFieldVisible parse
      const visMatch = line.match(/setFieldVisible\("([^"]+)",\s*(true|false)\)/);
      if (visMatch) {
        result.visibilitySettings[visMatch[1]] = visMatch[2] === "true" ? "visible" : "hidden";
        return;
      }
      
      // setFieldReadonly parse
      const readonlyMatch = line.match(/setFieldReadonly\("([^"]+)",\s*(true|false)\)/);
      if (readonlyMatch) {
        if (readonlyMatch[2] === "true") {
          result.visibilitySettings[readonlyMatch[1]] = "readonly";
        }
        return;
      }
      
      // setFieldValue parse
      const valMatch = line.match(/setFieldValue\("([^"]+)",\s*(.+)\)/);
      if (valMatch) {
        const fieldName = valMatch[1];
        const valueExpr = valMatch[2].trim().replace(/;$/, "");
        
        let valueType = "static";
        let value = "";
        let expression = "";
        let userProperty = "fullName";
        
        if (valueExpr.includes("new Date()")) {
          valueType = "currentDate";
        } else if (valueExpr.includes("currentUser")) {
          valueType = "currentUser";
          const userPropMatch = valueExpr.match(/currentUser\.(\w+)/);
          if (userPropMatch) {
            userProperty = userPropMatch[1];
          }
        } else if (valueExpr.includes("randomUUID")) {
          valueType = "uuid";
        } else if (valueExpr.match(/^["'].*["']$/)) {
          valueType = "static";
          value = valueExpr.replace(/^["']|["']$/g, "");
        } else if (!isNaN(valueExpr)) {
          valueType = "static";
          value = valueExpr;
        } else {
          valueType = "expression";
          expression = valueExpr;
        }
        
        result.initRules.push({ fieldName, valueType, value, expression, userProperty });
      }
    });
    
    return result;
  };

  // Script generation
  const generateScript = () => {
    let script = "";
    
    // 0. Buton görünürlük ayarları
    const hiddenButtons = Object.entries(buttonVisibilitySettings)
      .filter(([_, visible]) => visible === false)
      .map(([buttonId]) => buttonId);
    
    if (hiddenButtons.length > 0) {
      script += "// 🔘 Gizli butonlar\n";
      hiddenButtons.forEach(buttonId => {
        script += `setButtonVisible("${buttonId}", false);\n`;
      });
      script += "\n";
    }
    
    // 1. Görünürlük ve Readonly ayarları
    const hiddenFields = Object.entries(visibilitySettings)
      .filter(([_, state]) => state === false || state === "hidden")
      .map(([field]) => field);
    
    const readonlyFields = Object.entries(visibilitySettings)
      .filter(([_, state]) => state === "readonly")
      .map(([field]) => field);
    
    if (hiddenFields.length > 0) {
      script += "// 🙈 Gizli alanlar\n";
      hiddenFields.forEach(field => {
        script += `setFieldVisible("${field}", false);\n`;
      });
      script += "\n";
    }
    
    if (readonlyFields.length > 0) {
      script += "// 🔒 Salt okunur (readonly) alanlar\n";
      readonlyFields.forEach(field => {
        script += `setFieldReadonly("${field}", true);\n`;
      });
      script += "\n";
    }
    
    // 2. Değer atama
    if (initRules.length > 0) {
      script += "// 📝 Otomatik değer atama\n";
      initRules
        .filter(rule => rule.fieldName)
        .forEach(rule => {
          switch (rule.valueType) {
            case "currentDate":
              script += `setFieldValue("${rule.fieldName}", new Date().toISOString());\n`;
              break;
            case "currentUser":
              const userProp = rule.userProperty || "fullName";
              script += `setFieldValue("${rule.fieldName}", currentUser.${userProp});\n`;
              break;
            case "uuid":
              script += `setFieldValue("${rule.fieldName}", crypto.randomUUID());\n`;
              break;
            case "expression":
              if (rule.expression) {
                script += `setFieldValue("${rule.fieldName}", ${rule.expression});\n`;
              }
              break;
            case "static":
            default:
              const isNumber = !isNaN(rule.value) && rule.value !== "";
              const valueStr = isNumber ? rule.value : `"${rule.value}"`;
              script += `setFieldValue("${rule.fieldName}", ${valueStr});\n`;
              break;
          }
        });
      script += "\n";
    }
    
    // 3. Koşullu atama
    if (conditionalRules.length > 0) {
      script += "// 🔀 Koşullu değer atama\n";
      conditionalRules
        .filter(rule => rule.condition?.field && rule.thenAction?.fieldName)
        .forEach(rule => {
          const condValue = rule.condition.value || "";
          const valueStr = isNaN(condValue) || condValue === "" ? `"${condValue}"` : condValue;
          
          const thenValue = rule.thenAction.value || "";
          const thenValueStr = isNaN(thenValue) || thenValue === "" ? `"${thenValue}"` : thenValue;
          
          const operator = rule.condition.operator === "includes" 
            ? `.includes(${valueStr})` 
            : ` ${rule.condition.operator} ${valueStr}`;
          
          script += `if (getFieldValue("${rule.condition.field}")${operator}) {\n`;
          script += `  setFieldValue("${rule.thenAction.fieldName}", ${thenValueStr});\n`;
          
          if (rule.elseAction?.enabled && rule.elseAction?.fieldName && rule.elseAction?.value) {
            const elseValue = rule.elseAction.value;
            const elseValueStr = isNaN(elseValue) || elseValue === "" ? `"${elseValue}"` : elseValue;
            script += `} else {\n`;
            script += `  setFieldValue("${rule.elseAction.fieldName}", ${elseValueStr});\n`;
          }
          script += `}\n`;
        });
    }
    
    return script;
  };

  // DEĞER ATAMA - Handler'lar
  const handleAddInitRule = () => {
    setInitRules([
      ...initRules,
      {
        fieldName: "",
        valueType: "static",
        value: "",
        expression: "",
        userProperty: "fullName",
      },
    ]);
  };

  const handleUpdateInitRule = (index, field, value) => {
    const newRules = [...initRules];
    newRules[index][field] = value;
    setInitRules(newRules);
  };

  const handleDeleteInitRule = (index) => {
    setInitRules(initRules.filter((_, i) => i !== index));
  };

  // KOŞULLU ATAMA - Handler'lar
  const handleAddConditionalRule = () => {
    setConditionalRules([
      ...conditionalRules,
      {
        condition: {
          field: "",
          operator: "==",
          value: "",
        },
        thenAction: {
          fieldName: "",
          value: "",
        },
        elseAction: {
          enabled: false,
          fieldName: "",
          value: "",
        },
      },
    ]);
  };

  const handleToggleElseAction = (index) => {
    const newRules = [...conditionalRules];
    newRules[index].elseAction.enabled = !newRules[index].elseAction.enabled;
    setConditionalRules(newRules);
  };

  const handleUpdateConditionalRule = (index, path, value) => {
    const newRules = [...conditionalRules];
    const keys = path.split(".");
    let obj = newRules[index];
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    setConditionalRules(newRules);
  };

  const handleDeleteConditionalRule = (index) => {
    setConditionalRules(conditionalRules.filter((_, i) => i !== index));
  };

  // GÖRÜNÜRLÜK - Handler'lar
  const handleFieldStateChange = (fieldName, newState) => {
    setVisibilitySettings({
      ...visibilitySettings,
      [fieldName]: newState,
    });
  };

  const getFieldState = (fieldName) => {
    const state = visibilitySettings[fieldName];
    if (state === undefined || state === true || state === "visible") return "visible";
    if (state === false || state === "hidden") return "hidden";
    if (state === "readonly") return "readonly";
    return "visible";
  };

  // TEST PREVIEW
  const handleTestPreview = () => {
    if (!formSchema) {
      antdMessage.warning("Form schema yüklenmedi");
      return;
    }
    
    testForm.reset();
    const script = generateScript();
    
    try {
      const setFieldValue = (fieldKey, value) => {
        testForm.setFieldValue(fieldKey, value);
      };
      
      const getFieldValue = (fieldKey) => {
        return testForm.getFieldValue(fieldKey);
      };
      
      const setFieldVisible = (fieldKey, visible) => {
        const field = testForm.query(fieldKey).take();
        if (field) {
          field.setDisplay(visible ? "visible" : "hidden");
        }
      };
      
      const setFieldReadonly = (fieldKey, readonly) => {
        const field = testForm.query(fieldKey).take();
        if (field) {
          field.setPattern(readonly ? "readOnly" : "editable");
        }
      };
      
      const currentUser = { 
        userName: "testuser",
        firstName: "Test",
        lastName: "Kullanıcı",
        name: "Test",
        surname: "Kullanıcı",
        fullName: "Test Kullanıcı",
        email: "test@example.com"
      };
      const crypto = { randomUUID: () => "test-uuid-" + Date.now() };
      
      const scriptFunction = new Function(
        "setFieldValue",
        "getFieldValue",
        "setFieldVisible",
        "setFieldReadonly",
        "currentUser",
        "crypto",
        script
      );
      
      scriptFunction(setFieldValue, getFieldValue, setFieldVisible, setFieldReadonly, currentUser, crypto);
      
      antdMessage.success("Script başarıyla test edildi!");
      setTestPreviewOpen(true);
    } catch (error) {
      console.error("Script test hatası:", error);
      antdMessage.error("Script test edilirken hata: " + error.message);
    }
  };

  const getValueTypeLabel = (type) => {
    const labels = {
      static: "Sabit Değer",
      currentDate: "Şu Anki Tarih",
      currentUser: "Kullanıcı Bilgisi",
      uuid: "Benzersiz ID (UUID)",
      expression: "Formül/İfade",
    };
    return labels[type] || type;
  };

  const operators = [
    { value: "==", label: "Eşittir (==)" },
    { value: "!=", label: "Eşit Değil (!=)" },
    { value: ">", label: "Büyüktür (>)" },
    { value: ">=", label: "Büyük Eşit (>=)" },
    { value: "<", label: "Küçüktür (<)" },
    { value: "<=", label: "Küçük Eşit (<=)" },
    { value: "includes", label: "İçerir" },
  ];

  // Kaydet
  const handleSave = () => {
    const isManualSelection = assignmentType ? assignmentType === "manual" : selectionMode === "manual";
    const hasOrgCriteria = Boolean(selectedOrgUnit || selectedPosition || selectedManager);
    const requiresOrgCriteria = !assignmentType && selectionMode === "organization";
    const requiresOrgUnit = assignmentType === "department_all";

    if (isManualSelection && !selectedUser) {
      alert("Lütfen bir kullanıcı seçin");
      return;
    }

    if (requiresOrgUnit && !selectedOrgUnit) {
      alert("Lütfen bir departman seçin");
      return;
    }

    if (requiresOrgCriteria && !hasOrgCriteria && !selectedUser) {
      alert("Lütfen organizasyon birimi, pozisyon veya yönetici seçin");
      return;
    }

    const visibleFieldsCount = Object.values(fieldSettings).filter(s => s.visible).length;
    const totalFieldsCount = formFields.length;
    
    // Görünür butonları filtrele ve tüm özelliklerini koru
    const visibleButtons = formButtons
      .filter(btn => buttonSettings[btn.id]?.visible !== false)
      .map(btn => ({
        id: btn.id,
        label: btn.label || btn.name || "Buton",
        action: btn.action || "",
        type: btn.type || "default",
        icon: btn.icon || null,
        color: btn.color || "primary",
        ...btn, // Tüm diğer özellikleri de koru
      }));
    const visibleButtonsCount = visibleButtons.length;

    // TÜM butonları kaydet (handle'lar için)
    const allButtons = formButtons.map(btn => ({
      id: btn.id,
      label: btn.label || btn.name || "Buton",
      action: btn.action || "",
      type: btn.type || "default",
      icon: btn.icon || null,
      color: btn.color || "primary",
      ...btn, // Tüm diğer özellikleri de koru
    }));

    // ✅ formId'yi önce node'un mevcut data'sından al, yoksa workflowFormId'yi kullan
    // Bu sayede formId kaybolmaz ve şemada korunur
    const formId = initialValues?.formId || node?.data?.formId || workflowFormId;
    const formName = initialValues?.formName || node?.data?.formName || workflowFormName;

    const selectedUserId = selectedUser?.id || selectedUser?.userAppId || null;
    const selectedUserName = selectedUser?.userName || null;
    const selectedUserFirstName = selectedUser?.firstName || null;
    const selectedUserLastName = selectedUser?.lastName || null;
    const assignedUserName = selectedUser
      ? selectedUser.firstName && selectedUser.lastName
        ? `${selectedUser.firstName} ${selectedUser.lastName}`
        : selectedUser.userAppName || selectedUser.userName
      : null;
    const selectedManagerId = selectedManager?.id || selectedManager?.userAppId || null;
    const selectedManagerName = selectedManager
      ? selectedManager.firstName && selectedManager.lastName
        ? `${selectedManager.firstName} ${selectedManager.lastName}`
        : selectedManager.userAppName || selectedManager.userName
      : null;

    let selectionData = {};

    if (assignmentType) {
      selectionData.assignmentType = assignmentType;
      if (assignmentType === "manual") {
        selectionData = {
          ...selectionData,
          userId: selectedUserId,
          userName: selectedUserName,
          userFirstName: selectedUserFirstName,
          userLastName: selectedUserLastName,
          assignedUserName,
        };
      } else if (assignmentType === "position") {
        selectionData = {
          ...selectionData,
          selectedPosition,
        };
      } else if (assignmentType === "department_manager") {
        selectionData = {
          ...selectionData,
          selectedOrgUnit,
        };
      } else if (assignmentType === "department_all") {
        selectionData = {
          ...selectionData,
          selectedOrgUnit,
        };
      }
    } else {
      selectionData = {
        selectionMode,
        selectedOrgUnit,
        selectedPosition,
        selectedManagerId,
        selectedManagerName,
        userId: selectedUserId,
        userName: selectedUserName,
        userFirstName: selectedUserFirstName,
        userLastName: selectedUserLastName,
        assignedUserName,
      };
    }

    const taskData = {
      name,
      ...selectionData,
      formId: formId, // ✅ Önce mevcut data'dan, yoksa workflowFormId'den al
      formName: formName, // ✅ Önce mevcut data'dan, yoksa workflowFormName'den al
      message,
      fieldSettings,
      buttonSettings,
      fieldScript: fieldScript, // ✅ Form alanları için script
      buttons: visibleButtons, // Görünür butonlar (gösterim için)
      allButtons: allButtons, // TÜM butonlar (handle'lar için)
      visibleFieldsCount,
      totalFieldsCount,
      visibleButtonsCount,
      totalButtonsCount: allButtons.length,
      initScript: generateScript(), // ✅ Form başlangıç scripti
      visibilitySettings: visibilitySettings, // ✅ Form başlangıç görünürlük ayarları
      buttonVisibilitySettings: buttonVisibilitySettings, // ✅ Form başlangıç buton görünürlük ayarları
      formReactions: formReactions, 
    };

    console.log("🔍 FormTaskModal - Kaydet:", {
      allButtons: allButtons.length,
      visibleButtons: visibleButtons.length,
      taskData,
    });

    if (onSave && node) {
      onSave({
        id: node.id,
        data: taskData,
      });
    }
    onClose();
  };

  const legacyContent = () => (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogContent sx={{ p: 0 }}>
        <div className="p-6 lg:p-8">
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/60 border border-slate-200 overflow-hidden">
              <div className="px-6 lg:px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-20">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-inner">
                    <SettingsIcon fontSize="medium" />
                  </div>
                  <div>
                    <h2 className="text-xl lg:text-2xl font-black text-slate-800 tracking-tight">Form Görevi Ayarları</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter italic">
                      Atama ve form davranışı yapılandırması
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shadow-lg shadow-blue-100 active:scale-95 transform"
                  >
                    <SaveIcon fontSize="small" /> Kaydet
                  </button>
                  <IconButton onClick={onClose} size="small" className="text-slate-500">
                    <CloseIcon />
                  </IconButton>
                </div>
              </div>

              <div className="p-6 lg:p-10">
                  <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
                    <section>
                      <div className="flex items-center gap-2 mb-6">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
                          Atama ve Form Konfigürasyonu
                        </h4>
                      </div>
                      <section className="bg-slate-50/50 p-6 lg:p-8 rounded-[2.5rem] border-2 border-slate-100 border-dashed min-h-[260px] relative transition-all hover:border-blue-200">
                        <div className="flex items-center gap-3 mb-6">
                          <LayersIcon fontSize="small" className="text-blue-600" />
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Konfigürasyon Detayı
                          </h4>
                        </div>
                        <Box sx={{ pt: 0 }}>
          {/* Görev Adı */}
          <Box mb={3}>
            <MDInput
              label="Görev Adı"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Kullanıcı Seçimi */}
          <Box mb={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle1" fontWeight={600}>
                <PersonIcon sx={{ verticalAlign: "middle", mr: 1 }} />
                Atanacak Kullanıcı
              </Typography>
              <ToggleButtonGroup
                value={selectionMode}
                exclusive
                onChange={(e, newMode) => {
                  if (newMode !== null) {
                    setSelectionMode(newMode);
                    if (newMode === "manual") {
                      setSelectedUser(null);
                      setSelectedOrgUnit("");
                      setSelectedPosition("");
                      setSelectedManager(null);
                    }
                  }
                }}
                size="small"
                sx={{ height: "32px" }}
              >
                <ToggleButton value="manual">
                  <PersonIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  Manuel
                </ToggleButton>
                <ToggleButton value="organization">
                  <AccountTreeIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  Organizasyon
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {selectionMode === "manual" ? (
              <Autocomplete
                options={searchByName}
                getOptionLabel={(option) => {
                  if (option.firstName && option.lastName) {
                    return `${option.firstName} ${option.lastName}`;
                  }
                  return option.userAppName || option.userName || "";
                }}
                value={selectedUser}
                inputValue={inputValue}
                openOnFocus
                autoHighlight
                noOptionsText="Kullanıcı bulunamadı"
                filterOptions={userFilterOptions}
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
                  if (newValue) {
                    setInputValue(newValue.firstName && newValue.lastName
                      ? `${newValue.firstName} ${newValue.lastName}`
                      : newValue.userAppName || newValue.userName || "");
                  }
                }}
                onInputChange={(event, newInputValue, reason) => {
                  setInputValue(newInputValue);
                  // Kullanıcı yazarken arama yap
                  if (reason === "input" && newInputValue.trim().length > 0) {
                    handleSearchByName(newInputValue);
                  } else if (reason === "clear" || newInputValue.trim().length === 0) {
                    setSearchByName(allUsers);
                  }
                }}
                renderInput={(params) => (
                  <MDInput
                    {...params}
                    label="Kullanıcı ara..."
                    placeholder="Kullanıcı adı veya email ile ara"
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id || option.userAppId}>
                    <Box>
                      <Typography fontWeight={600}>
                        {option.firstName && option.lastName
                          ? `${option.firstName} ${option.lastName}`
                          : option.userAppName || option.userName}
                      </Typography>
                      {option.email && (
                        <Typography variant="caption" color="textSecondary">
                          {option.email}
                        </Typography>
                      )}
                      {option.userName && (
                        <Typography variant="caption" color="textSecondary">
                          @{option.userName}
                        </Typography>
                      )}
                    </Box>
                  </li>
                )}
              />
            ) : (
              <Box>
                <Grid container spacing={2} mb={2}>
                  <Grid item xs={12} md={4}>
                    <Autocomplete
                      options={orgUnits}
                      value={orgUnits.find((orgUnit) => orgUnit.id === selectedOrgUnit) || null}
                      getOptionLabel={(option) => option?.name || ""}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      openOnFocus
                      autoHighlight
                      noOptionsText="Organizasyon birimi bulunamadı"
                      onChange={(event, newValue) => setSelectedOrgUnit(newValue?.id || "")}
                      renderInput={(params) => (
                        <MDInput
                          {...params}
                          label="Organizasyon Birimi"
                          placeholder="Tümü"
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <>
                                <BusinessIcon sx={{ mr: 1, color: "text.secondary" }} />
                                {params.InputProps.startAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Autocomplete
                      options={positions}
                      value={positions.find((position) => position.id === selectedPosition) || null}
                      getOptionLabel={(option) => option?.name || ""}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      openOnFocus
                      autoHighlight
                      noOptionsText="Pozisyon bulunamadı"
                      onChange={(event, newValue) => setSelectedPosition(newValue?.id || "")}
                      renderInput={(params) => (
                        <MDInput
                          {...params}
                          label="Pozisyon"
                          placeholder="Tümü"
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <>
                                <WorkIcon sx={{ mr: 1, color: "text.secondary" }} />
                                {params.InputProps.startAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Autocomplete
                      options={managers}
                      getOptionLabel={(option) => {
                        if (option.firstName && option.lastName) {
                          return `${option.firstName} ${option.lastName}`;
                        }
                        return option.userAppName || option.userName || "";
                      }}
                      value={selectedManager}
                      openOnFocus
                      autoHighlight
                      noOptionsText="Yönetici bulunamadı"
                      filterOptions={userFilterOptions}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      onChange={(event, newValue) => setSelectedManager(newValue)}
                      renderInput={(params) => (
                        <MDInput
                          {...params}
                          label="Yönetici"
                          placeholder="Yönetici seçin..."
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <>
                                <SupervisorAccountIcon sx={{ mr: 1, color: "text.secondary" }} />
                                {params.InputProps.startAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                      renderOption={(props, option) => (
                        <li {...props} key={option.id}>
                          <Box>
                            <Typography fontWeight={600}>
                              {option.firstName && option.lastName
                                ? `${option.firstName} ${option.lastName}`
                                : option.userAppName || option.userName}
                            </Typography>
                            {option.email && (
                              <Typography variant="caption" color="textSecondary">
                                {option.email}
                              </Typography>
                            )}
                          </Box>
                        </li>
                      )}
                    />
                  </Grid>
                </Grid>

                {/* Filtrelenmiş kullanıcılar */}
                {filteredUsersByOrg.length > 0 ? (
                  <Box>
                    <Typography variant="body2" color="textSecondary" mb={1}>
                      Seçilen kriterlere göre {filteredUsersByOrg.length} kullanıcı bulundu:
                    </Typography>
                    <Autocomplete
                      options={filteredUsersByOrg}
                      getOptionLabel={(option) => {
                        if (option.firstName && option.lastName) {
                          return `${option.firstName} ${option.lastName}`;
                        }
                        return option.userAppName || option.userName || "";
                      }}
                      value={selectedUser}
                      openOnFocus
                      autoHighlight
                      noOptionsText="Kullanıcı bulunamadı"
                      filterOptions={userFilterOptions}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      onChange={(event, newValue) => {
                        setSelectedUser(newValue);
                        if (newValue) {
                          setInputValue(newValue.firstName && newValue.lastName
                            ? `${newValue.firstName} ${newValue.lastName}`
                            : newValue.userAppName || newValue.userName || "");
                        }
                      }}
                      renderInput={(params) => (
                        <MDInput
                          {...params}
                          label="Kullanıcı seçin..."
                          placeholder="Listeden kullanıcı seçin"
                        />
                      )}
                      renderOption={(props, option) => (
                        <li {...props} key={option.id}>
                          <Box>
                            <Typography fontWeight={600}>
                              {option.firstName && option.lastName
                                ? `${option.firstName} ${option.lastName}`
                                : option.userAppName || option.userName}
                            </Typography>
                            {option.email && (
                              <Typography variant="caption" color="textSecondary">
                                {option.email}
                              </Typography>
                            )}
                          </Box>
                        </li>
                      )}
                    />
                  </Box>
                ) : (
                  <Paper sx={{ p: 2, textAlign: "center", bgcolor: "grey.50" }}>
                    <Typography variant="body2" color="textSecondary">
                      {selectedOrgUnit || selectedPosition || selectedManager
                        ? "Seçilen kriterlere uygun kullanıcı bulunamadı"
                        : "Lütfen organizasyon birimi, pozisyon veya yönetici seçin"}
                    </Typography>
                  </Paper>
                )}
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Mesaj Alanı */}
          <Box mb={3}>
            <Typography variant="subtitle1" fontWeight={600} mb={1}>
              <MessageIcon sx={{ verticalAlign: "middle", mr: 1 }} />
              Kullanıcıya Gösterilecek Mesaj
            </Typography>
            <TextField
              multiline
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Kullanıcıya gösterilecek mesajı buraya yazın..."
              fullWidth
              helperText="Bu mesaj kullanıcıya form gösterildiğinde görüntülenecektir"
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Form Bilgisi */}
          {workflowFormName && (
            <Box mb={3}>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>
                Form: {workflowFormName}
              </Typography>
            </Box>
          )}

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label="Zamanlama" icon={<AccessTimeIcon />} iconPosition="start" />
              <Tab label="Butonlar" icon={<SettingsIcon />} iconPosition="start" />
              <Tab label="Script" icon={<CodeIcon />} iconPosition="start" />
            </Tabs>
          </Box>

          {/* Zamanlama Tab */}
          {activeTab === 0 && (
          <Box mb={2}>
            <section className="bg-slate-50/50 p-6 lg:p-8 rounded-[2.5rem] border-2 border-slate-100 border-dashed min-h-[220px] relative transition-all hover:border-blue-200">
              <div className="flex items-center gap-3 mb-6">
                <AccessTimeIcon fontSize="small" className="text-blue-600" />
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Zamanlama ve SLA
                </h4>
              </div>
                <Typography variant="body2" color="textSecondary">
                Bu bölüm için SLA ve zamanlama ayarları yakında eklenecek.
                </Typography>
            </section>
          </Box>
          )}

          {/* Buton Görünürlük Kontrolü Tab */}
          {activeTab === 1 && (
          <Box mb={2}>
            <Typography variant="subtitle2" fontWeight={600} mb={2}>
              Form Butonları Kontrolü
            </Typography>
            
            {formButtons.length === 0 ? (
              <Paper sx={{ p: 2, textAlign: "center", bgcolor: "grey.100" }}>
                <Typography variant="body2" color="textSecondary">
                  Bu formda buton bulunmuyor.
                </Typography>
              </Paper>
            ) : (
              <Paper sx={{ p: 2, maxHeight: "400px", overflowY: "auto" }}>
                <FormGroup>
                  {formButtons.map((button) => {
                    const isVisible = buttonSettings[button.id]?.visible !== false;
                    return (
                      <Paper key={button.id} sx={{ p: 1.5, mb: 1.5, bgcolor: isVisible ? "grey.50" : "grey.100" }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box display="flex" alignItems="center" gap={1} flex={1}>
                            <Typography fontWeight={isVisible ? 600 : 400}>{button.label}</Typography>
                            {button.action && (
                              <Chip
                                label={button.action}
                                size="small"
                                color="primary"
                                sx={{ height: "20px", fontSize: "0.7rem" }}
                              />
                            )}
                            {button.type && (
                              <Chip
                                label={button.type}
                                size="small"
                                variant="outlined"
                                sx={{ height: "20px", fontSize: "0.7rem" }}
                              />
                            )}
                          </Box>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={isVisible}
                                onChange={(e) => handleButtonVisibilityChange(button.id, e.target.checked)}
                                icon={<VisibilityOffIcon />}
                                checkedIcon={<VisibilityIcon />}
                                size="small"
                              />
                            }
                            label="Görünür"
                            sx={{ m: 0 }}
                          />
                        </Box>
                      </Paper>
                    );
                  })}
                </FormGroup>
              </Paper>
            )}
            
            {formButtons.length > 0 && (
              <Box mt={2}>
                <Typography variant="caption" color="textSecondary">
                  Görünür: {formButtons.filter(btn => buttonSettings[btn.id]?.visible !== false).length} / {formButtons.length} buton
                </Typography>
                <Typography variant="caption" color="warning.main" display="block" mt={0.5}>
                  ⚠️ Görünür butonlar için çıkış handle&apos;ları oluşturulacaktır
                </Typography>
              </Box>
            )}
          </Box>
          )}

          {/* Script Tab */}
          {activeTab === 2 && (
          <Box mb={2}>
            <Typography variant="subtitle2" fontWeight={600} mb={2}>
              Form Alanları Script Kontrolü
            </Typography>
            
            {/* Script Şablonları ve Hızlı İşlemler */}
            <Box mb={2} display="flex" gap={2} flexWrap="wrap">
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>📝 Script Şablonu</InputLabel>
                <Select
                  value={selectedTemplate}
                  label="📝 Script Şablonu"
                  onChange={(e) => handleTemplateChange(e.target.value)}
                >
                  <MenuItem value="">Özel Script</MenuItem>
                  <MenuItem value="conditional-visibility">Koşullu Görünürlük</MenuItem>
                  <MenuItem value="auto-calculation">Otomatik Hesaplama</MenuItem>
                  <MenuItem value="readonly-condition">Koşullu Readonly</MenuItem>
                  <MenuItem value="form-validation">Form Validasyon</MenuItem>
                  <MenuItem value="date-calculation">Tarih Hesaplama</MenuItem>
                </Select>
              </FormControl>

              <Box display="flex" gap={1} flexWrap="wrap">
                <MDButton
                  size="small"
                  variant="outlined"
                  color="info"
                  onClick={quickActions["hide-all"]}
                  startIcon={<VisibilityOffIcon />}
                >
                  Tümünü Gizle
                </MDButton>
                <MDButton
                  size="small"
                  variant="outlined"
                  color="info"
                  onClick={quickActions["show-all"]}
                  startIcon={<VisibilityIcon />}
                >
                  Tümünü Göster
                </MDButton>
                <MDButton
                  size="small"
                  variant="outlined"
                  color="warning"
                  onClick={quickActions["readonly-all"]}
                  startIcon={<LockIcon />}
                >
                  Tümünü Readonly
                </MDButton>
                <MDButton
                  size="small"
                  variant="outlined"
                  color="success"
                  onClick={quickActions["enable-all"]}
                  startIcon={<LockOpenIcon />}
                >
                  Tümünü Aktif
                </MDButton>
                <MDButton
                  size="small"
                  variant="outlined"
                  color="secondary"
                  onClick={quickActions["debug-template"]}
                  startIcon={<BugReportIcon />}
                >
                  Debug Template
                </MDButton>
              </Box>
            </Box>

            <Paper sx={{ p: 2, mb: 2, bgcolor: "info.light", color: "info.contrastText" }}>
              <Typography variant="body2" fontWeight={600} mb={1}>
                💡 Script Kullanımı - Form Alanlarını Kontrol Etme
              </Typography>
              <Typography variant="caption" component="div">
                Script ile form alanlarını dinamik olarak kontrol edebilirsiniz:
                <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                  <li><strong>setFieldVisible(fieldKey, visible)</strong> - Component&apos;i gizle/göster (true=görünür, false=gizli)</li>
                  <li><strong>setFieldReadonly(fieldKey, readonly)</strong> - Component&apos;i readonly yap (true=readonly, false=düzenlenebilir)</li>
                  <li><strong>setFieldValue(fieldKey, value)</strong> - Component&apos;e değer ata</li>
                  <li><strong>getFieldValue(fieldKey)</strong> - Component&apos;ten değer oku</li>
                  <li><strong>formValues</strong> - Tüm form değerlerine erişim (formValues.alanAdi)</li>
                </ul>
                <Typography variant="caption" component="div" mt={1} sx={{ fontStyle: "italic" }}>
                  💡 İpucu: Alan adlarını yazarken IntelliSense ile otomatik tamamlama yapabilirsiniz. 
                  getFieldValue(&quot; yazdığınızda form alanları otomatik görünecektir.
                </Typography>
              </Typography>
            </Paper>

            <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 1, overflow: "hidden" }}>
              <Editor
                height="400px"
                defaultLanguage="javascript"
                value={fieldScript}
                onChange={(value) => setFieldScript(value || "")}
                theme="vs-light"
                onMount={(editor, monacoInstance) => {
                  setMonacoEditor(editor);
                  setMonacoInstance(monacoInstance);
                  
                  // JavaScript modunda TypeScript tip kontrolünü etkinleştir
                  monacoInstance.languages.typescript.javascriptDefaults.setCompilerOptions({
                    allowNonTsExtensions: true,
                    checkJs: true,
                    noLib: false,
                    target: monacoInstance.languages.typescript.ScriptTarget.ES2020,
                    allowJs: true,
                    lib: ["ES2020"],
                  });

                  // Model URI'sini kontrol et ve ayarla
                  const model = editor.getModel();
                  if (model) {
                    
                    
                    // Model'in URI'sini JavaScript dosyası olarak ayarla (IntelliSense için)
                    // Bu, tip tanımlarının çalışması için önemli
                    const uri = model.uri;
                    if (!uri.path.endsWith('.js') && !uri.path.endsWith('.ts')) {
                      // Model URI'sini JavaScript olarak işaretle
                      
                    }
                  }
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  suggestOnTriggerCharacters: true,
                  quickSuggestions: {
                    other: true,
                    comments: false,
                    strings: true,
                  },
                  suggestSelection: "first",
                  tabSize: 2,
                  autoIndent: "full",
                  formatOnPaste: true,
                  formatOnType: true,
                  acceptSuggestionOnCommitCharacter: true,
                  acceptSuggestionOnEnter: "on",
                  snippetSuggestions: "top",
                }}
              />
            </Box>

            {/* Form Alanları Referans Tablosu */}
            {formFields.length > 0 && (
              <Accordion expanded={showFieldReference} onChange={(e, expanded) => setShowFieldReference(expanded)} sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<TableChartIcon />}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    📋 Form Alanları Referans Tablosu ({formFields.length} alan)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Alan Adı</strong></TableCell>
                          <TableCell><strong>Label</strong></TableCell>
                          <TableCell><strong>Tip</strong></TableCell>
                          <TableCell><strong>Component</strong></TableCell>
                          <TableCell><strong>Zorunlu</strong></TableCell>
                          <TableCell><strong>İşlemler</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {formFields.map((field) => {
                          const normalizedKey = field.normalizedKey || field.key;
                          return (
                            <TableRow key={field.key}>
                              <TableCell>
                                <code style={{ fontSize: "0.75rem", color: "#1976d2" }}>
                                  {normalizedKey}
                                </code>
                              </TableCell>
                              <TableCell>{field.label || "-"}</TableCell>
                              <TableCell>
                                <Chip label={field.type} size="small" variant="outlined" />
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption">{field.component || "-"}</Typography>
                              </TableCell>
                              <TableCell>
                                {field.required ? (
                                  <Chip label="Evet" size="small" color="error" />
                                ) : (
                                  <Chip label="Hayır" size="small" />
                                )}
                              </TableCell>
                              <TableCell>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    const script = `getFieldValue("${normalizedKey}");`;
                                    setFieldScript(fieldScript + "\n" + script);
                                  }}
                                  title="Değer oku"
                                >
                                  <ContentCopyIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            )}

            <Box mt={2}>
              <Typography variant="caption" color="textSecondary" display="block" mb={1} fontWeight={600}>
                💡 Detaylı Kullanım Örnekleri:
              </Typography>
              
              {/* Örnek 1: Component Gizleme */}
              <Paper sx={{ p: 2, mb: 2, bgcolor: "grey.50", fontSize: "0.75rem", fontFamily: "monospace" }}>
                <Typography variant="caption" fontWeight={600} display="block" mb={1} color="primary.main">
                  1️⃣ Component Gizleme/Gösterme:
                </Typography>
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
{`// Örnek: Eğer "musteriTipi" alanı "Bireysel" ise "vergiNo" alanını gizle
if (getFieldValue("musteriTipi") === "Bireysel") {
  setFieldVisible("vergiNo", false);  // Component'i gizle
} else {
  setFieldVisible("vergiNo", true);   // Component'i göster
}

// Örnek: Birden fazla alanı gizle
if (getFieldValue("kategori") === "Diger") {
  setFieldVisible("ozelAlan1", false);
  setFieldVisible("ozelAlan2", false);
}`}
                </pre>
              </Paper>

              {/* Örnek 2: Readonly Yapma */}
              <Paper sx={{ p: 2, mb: 2, bgcolor: "grey.50", fontSize: "0.75rem", fontFamily: "monospace" }}>
                <Typography variant="caption" fontWeight={600} display="block" mb={1} color="primary.main">
                  2️⃣ Component Readonly Yapma:
                </Typography>
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
{`// Örnek: "tutar" alanı 1000'den büyükse "onayGerekli" alanını readonly yap
if (getFieldValue("tutar") > 1000) {
  setFieldReadonly("onayGerekli", true);   // Readonly yap
} else {
  setFieldReadonly("onayGerekli", false);   // Düzenlenebilir yap
}

// Örnek: Belirli bir değer seçildiğinde alanı readonly yap
if (getFieldValue("durum") === "Onaylandi") {
  setFieldReadonly("aciklama", true);
}`}
                </pre>
              </Paper>

              {/* Örnek 3: Değer Atama */}
              <Paper sx={{ p: 2, mb: 2, bgcolor: "grey.50", fontSize: "0.75rem", fontFamily: "monospace" }}>
                <Typography variant="caption" fontWeight={600} display="block" mb={1} color="primary.main">
                  3️⃣ Component&apos;e Değer Atama:
                </Typography>
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
{`// Örnek: "toplamTutar" alanını otomatik hesapla
const tutar1 = getFieldValue("tutar1") || 0;
const tutar2 = getFieldValue("tutar2") || 0;
setFieldValue("toplamTutar", tutar1 + tutar2);

// Örnek: Tarih alanına bugünün tarihini ata
setFieldValue("baslangicTarihi", new Date().toISOString().split('T')[0]);

// Örnek: Varsayılan değer ata
if (!getFieldValue("varsayilanAlan")) {
  setFieldValue("varsayilanAlan", "Varsayılan Değer");
}

// Örnek: Koşullu değer atama
if (getFieldValue("tip") === "Acil") {
  setFieldValue("oncelik", "Yüksek");
} else {
  setFieldValue("oncelik", "Normal");
}`}
                </pre>
              </Paper>

              {/* Örnek 4: Değer Okuma */}
              <Paper sx={{ p: 2, mb: 2, bgcolor: "grey.50", fontSize: "0.75rem", fontFamily: "monospace" }}>
                <Typography variant="caption" fontWeight={600} display="block" mb={1} color="primary.main">
                  4️⃣ Component&apos;ten Değer Okuma:
                </Typography>
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
{`// Örnek: Tek bir alan değerini oku
const musteriAdi = getFieldValue("musteriAdi");


// Örnek: formValues ile tüm form değerlerine erişim (IntelliSense destekler)
const toplam = formValues.tutar1 + formValues.tutar2;
setFieldValue("toplamTutar", toplam);

// Örnek: Birden fazla alanı kontrol et
const ad = getFieldValue("ad");
const soyad = getFieldValue("soyad");
if (ad && soyad) {
  setFieldValue("tamAd", ad + " " + soyad);
}

// Örnek: Değer kontrolü ile işlem yap
const yas = getFieldValue("yas");
if (yas && yas >= 18) {
  setFieldVisible("veliBilgileri", false);
} else {
  setFieldVisible("veliBilgileri", true);
}`}
                </pre>
              </Paper>

              {/* Örnek 5: Karmaşık Senaryo */}
              <Paper sx={{ p: 2, bgcolor: "grey.50", fontSize: "0.75rem", fontFamily: "monospace" }}>
                <Typography variant="caption" fontWeight={600} display="block" mb={1} color="primary.main">
                  5️⃣ Karmaşık Senaryo Örneği:
                </Typography>
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
{`// Örnek: Personel tipine göre alanları kontrol et
const personelTipi = getFieldValue("personelTipi");

if (personelTipi === "Kadrolu") {
  // Kadrolu personel için gerekli alanları göster
  setFieldVisible("sicilNo", true);
  setFieldVisible("maas", true);
  setFieldReadonly("maas", false);
  
  // Geçici personel alanlarını gizle
  setFieldVisible("sozlesmeBaslangic", false);
  setFieldVisible("sozlesmeBitis", false);
} else if (personelTipi === "Sozlesmeli") {
  // Sözleşmeli personel için gerekli alanları göster
  setFieldVisible("sozlesmeBaslangic", true);
  setFieldVisible("sozlesmeBitis", true);
  
  // Kadrolu personel alanlarını gizle
  setFieldVisible("sicilNo", false);
  setFieldVisible("maas", false);
}

// Otomatik hesaplama
const gunSayisi = getFieldValue("gunSayisi");
const gunlukUcret = getFieldValue("gunlukUcret");
if (gunSayisi && gunlukUcret) {
  setFieldValue("toplamUcret", gunSayisi * gunlukUcret);
}`}
                </pre>
              </Paper>
            </Box>
          </Box>
          )}
                        </Box>
                      </section>
                    </section>
                  </div>
                
                <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                  <div className="flex items-center gap-3">
                    <VerifiedUserIcon fontSize="small" className="text-emerald-500" />
                    <span>Güvenli Atama Motoru Aktif</span>
                  </div>
                  <div className="flex items-center gap-2 italic lowercase text-[10px] opacity-60">
                    <InfoOutlinedIcon fontSize="inherit" />
                    <span>v2.1 kurumsal politika standartları</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const assignmentTypes = [
    {
      id: "direct_manager",
      title: "Doğrudan Yönetici",
      icon: SupervisorAccountIcon,
      desc: "İşi başlatan kullanıcının doğrudan yöneticisine atar",
      color: "primary",
    },
    {
      id: "department_manager",
      title: "Departman Müdürü",
      icon: BusinessIcon,
      desc: "Kullanıcının bağlı olduğu departmanın müdürüne atar",
      color: "info",
    },
    {
      id: "department_all",
      title: "Departman (Tüm Kullanıcılar)",
      icon: BusinessIcon,
      desc: "Seçilen departmandaki tüm kullanıcılara atar",
      color: "warning",
    },
    {
      id: "position",
      title: "Pozisyon",
      icon: WorkIcon,
      desc: "Belirli bir pozisyondaki kullanıcılara atar",
      color: "warning",
    },
    {
      id: "manual",
      title: "Manuel Kullanıcı",
      icon: PersonIcon,
      desc: "Belirli bir kullanıcıyı manuel olarak seçin",
      color: "success",
    },
  ];

  const renderAssignmentContent = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {/* Görev Adı */}
      <Box>
        <MDInput
          label="Görev Adı"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
        />
      </Box>

      <Divider />

      {/* Atama Tipi Seçimi */}
      <Box>
        <Typography variant="h6" fontWeight={700} mb={3}>
          Atama Tipi Seçin
        </Typography>
        <Grid container spacing={2}>
          {assignmentTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = assignmentType === type.id;
            return (
                <Grid item xs={12} sm={6} md={3} key={type.id}>
                <Paper
                  onClick={() => {
                    setAssignmentType(type.id);
                    if (type.id === "manual") {
                      setSelectedOrgUnit("");
                      setSelectedPosition("");
                      setSelectedManager(null);
                    }
                    if (type.id === "position") {
                      setSelectedOrgUnit("");
                      setSelectedManager(null);
                      setSelectedUser(null);
                    }
                    if (type.id === "department_manager") {
                      setSelectedPosition("");
                      setSelectedManager(null);
                      setSelectedUser(null);
                    }
                    if (type.id === "department_all") {
                      setSelectedPosition("");
                      setSelectedManager(null);
                      setSelectedUser(null);
                    }
                    if (type.id === "direct_manager") {
                      setSelectedOrgUnit("");
                      setSelectedPosition("");
                      setSelectedManager(null);
                      setSelectedUser(null);
                    }
                  }}
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    border: 1,
                    borderColor: isSelected ? `${type.color}.main` : "grey.300",
                    bgcolor: isSelected ? `${type.color}.light` : "white",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    "&:hover": {
                      borderColor: `${type.color}.main`,
                      transform: "translateY(-1px)",
                      boxShadow: 2,
                    },
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 112,
                  }}
                >
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: 1,
                      bgcolor: isSelected ? `${type.color}.main` : "grey.200",
                      color: isSelected ? "white" : "grey.600",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 0.75,
                    }}
                  >
                    <Icon sx={{ fontSize: 16 }} />
                  </Box>
                  <Typography variant="body2" fontWeight={700} color={isSelected ? `${type.color}.dark` : "text.primary"} mb={0.25}>
                    {type.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.6rem", lineHeight: 1.25 }}>
                    {type.desc}
                  </Typography>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {/* Seçilen Tipe Göre Form Alanları */}
      <Box>
        {assignmentType === "direct_manager" && (
          <Paper sx={{ p: 3, borderRadius: 2, bgcolor: "grey.50", border: 1, borderColor: "divider" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <SupervisorAccountIcon color="primary" />
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Doğrudan Yönetici Ataması
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  İşi başlatan kullanıcının organizasyon şemasındaki doğrudan yöneticisine otomatik olarak atanacaktır.
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 2, bgcolor: "white", borderRadius: 2 }}>
              <Box sx={{ flex: 1, textAlign: "center", p: 1.5, bgcolor: "grey.100", borderRadius: 2 }}>
                <Typography variant="caption" fontWeight={700} textTransform="uppercase" color="text.secondary">
                  Başlatıcı
                </Typography>
              </Box>
              <ChevronRightIcon sx={{ color: "grey.400" }} />
              <Box sx={{ flex: 1, textAlign: "center", p: 1.5, bgcolor: "primary.main", borderRadius: 2, color: "white" }}>
                <Typography variant="caption" fontWeight={700} textTransform="uppercase">
                  Doğrudan Yönetici
                </Typography>
              </Box>
              <ChevronRightIcon sx={{ color: "grey.400" }} />
              <Box sx={{ flex: 1, textAlign: "center", p: 1.5, bgcolor: "success.light", borderRadius: 2, border: 1, borderColor: "success.main" }}>
                <Typography variant="caption" fontWeight={700} textTransform="uppercase" color="success.main">
                  ONAY ADIMI
                </Typography>
              </Box>
            </Box>
          </Paper>
        )}

        {assignmentType === "department_manager" && (
          <Paper sx={{ p: 3, borderRadius: 2, bgcolor: "grey.50", border: 1, borderColor: "divider" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <BusinessIcon color="info" />
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Departman Müdürü Ataması
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  İşi başlatan kullanıcının departmanının müdürüne otomatik olarak atanacaktır.
                </Typography>
              </Box>
            </Box>
            <Autocomplete
              options={orgUnits}
              value={orgUnits.find((orgUnit) => orgUnit.id === selectedOrgUnit) || null}
              getOptionLabel={(option) => option?.name || ""}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              openOnFocus
              autoHighlight
              noOptionsText="Departman bulunamadı"
              onChange={(event, newValue) => setSelectedOrgUnit(newValue?.id || "")}
              renderInput={(params) => (
                <MDInput
                  {...params}
                  label="Departman Seçimi (Opsiyonel)"
                  placeholder="Otomatik (Kullanıcının Departmanı)"
                />
              )}
            />
          </Paper>
        )}

        {assignmentType === "department_all" && (
          <Paper sx={{ p: 3, borderRadius: 2, bgcolor: "grey.50", border: 1, borderColor: "divider" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <BusinessIcon color="warning" />
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Departman (Tüm Kullanıcılar)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Seçilen departmandaki tüm kullanıcılara atanacaktır.
                </Typography>
              </Box>
            </Box>
            <Autocomplete
              options={orgUnits}
              value={orgUnits.find((orgUnit) => orgUnit.id === selectedOrgUnit) || null}
              getOptionLabel={(option) => option?.name || ""}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              openOnFocus
              autoHighlight
              noOptionsText="Departman bulunamadı"
              onChange={(event, newValue) => setSelectedOrgUnit(newValue?.id || "")}
              renderInput={(params) => (
                <MDInput
                  {...params}
                  label="Departman Seçin"
                  placeholder="Departman seçin"
                />
              )}
            />
          </Paper>
        )}

        {assignmentType === "position" && (
          <Paper sx={{ p: 3, borderRadius: 2, bgcolor: "grey.50", border: 1, borderColor: "divider" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <WorkIcon color="warning" />
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Pozisyon Bazlı Atama
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Belirli bir pozisyondaki tüm kullanıcılara atanacaktır.
                </Typography>
              </Box>
            </Box>
            <Autocomplete
              options={positions}
              value={positions.find((position) => position.id === selectedPosition) || null}
              getOptionLabel={(option) => option?.name || ""}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              openOnFocus
              autoHighlight
              noOptionsText="Pozisyon bulunamadı"
              onChange={(event, newValue) => setSelectedPosition(newValue?.id || "")}
              renderInput={(params) => (
                <MDInput
                  {...params}
                  label="Pozisyon Seçin"
                  placeholder="Pozisyon seçin"
                />
              )}
            />
            {selectedPosition && filteredUsersByOrg.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Bu pozisyonda {filteredUsersByOrg.length} kullanıcı bulundu:
                </Typography>
                <Autocomplete
                  options={filteredUsersByOrg}
                  getOptionLabel={(option) => {
                    if (option.firstName && option.lastName) {
                      return `${option.firstName} ${option.lastName}`;
                    }
                    return option.userAppName || option.userName || "";
                  }}
                  value={selectedUser}
                  openOnFocus
                  autoHighlight
                  noOptionsText="Kullanıcı bulunamadı"
                  filterOptions={userFilterOptions}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  onChange={(event, newValue) => {
                    setSelectedUser(newValue);
                    if (newValue) {
                      setInputValue(
                        newValue.firstName && newValue.lastName
                          ? `${newValue.firstName} ${newValue.lastName}`
                          : newValue.userAppName || newValue.userName || ""
                      );
                    }
                  }}
                  renderInput={(params) => (
                    <MDInput
                      {...params}
                      label="Kullanıcı seçin (opsiyonel)"
                      placeholder="Belirli bir kullanıcı seçmek için arayın"
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      <Box>
                        <Typography fontWeight={600}>
                          {option.firstName && option.lastName
                            ? `${option.firstName} ${option.lastName}`
                            : option.userAppName || option.userName}
                        </Typography>
                        {option.email && (
                          <Typography variant="caption" color="text.secondary">
                            {option.email}
                          </Typography>
                        )}
                      </Box>
                    </li>
                  )}
                />
              </Box>
            )}
          </Paper>
        )}

        {assignmentType === "manual" && (
          <Paper sx={{ p: 3, borderRadius: 2, bgcolor: "grey.50", border: 1, borderColor: "divider" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <PersonIcon color="success" />
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Manuel Kullanıcı Seçimi
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Belirli bir kullanıcıyı manuel olarak seçin.
                </Typography>
              </Box>
            </Box>
            <Autocomplete
              options={searchByName}
              getOptionLabel={(option) => {
                if (option.firstName && option.lastName) {
                  return `${option.firstName} ${option.lastName}`;
                }
                return option.userAppName || option.userName || "";
              }}
              value={selectedUser}
              inputValue={inputValue}
              openOnFocus
              autoHighlight
              noOptionsText="Kullanıcı bulunamadı"
              filterOptions={userFilterOptions}
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
                if (newValue) {
                  setInputValue(
                    newValue.firstName && newValue.lastName
                      ? `${newValue.firstName} ${newValue.lastName}`
                      : newValue.userAppName || newValue.userName || ""
                  );
                }
              }}
              onInputChange={(event, newInputValue, reason) => {
                setInputValue(newInputValue);
                if (reason === "input" && newInputValue.trim().length > 0) {
                  handleSearchByName(newInputValue);
                } else if (reason === "clear" || newInputValue.trim().length === 0) {
                  setSearchByName(allUsers);
                }
              }}
              renderInput={(params) => (
                <MDInput
                  {...params}
                  label="Kullanıcı ara..."
                  placeholder="Kullanıcı adı veya email ile ara"
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id || option.userAppId}>
                  <Box>
                    <Typography fontWeight={600}>
                      {option.firstName && option.lastName
                        ? `${option.firstName} ${option.lastName}`
                        : option.userAppName || option.userName}
                    </Typography>
                    {option.email && (
                      <Typography variant="caption" color="text.secondary">
                        {option.email}
                      </Typography>
                    )}
                    {option.userName && (
                      <Typography variant="caption" color="text.secondary">
                        @{option.userName}
                      </Typography>
                    )}
                  </Box>
                </li>
              )}
            />
          </Paper>
        )}
      </Box>

      <Divider />

      {/* Mesaj Alanı */}
      <Box>
        <Typography variant="subtitle1" fontWeight={600} mb={1}>
          <MessageIcon sx={{ verticalAlign: "middle", mr: 1 }} />
          Kullanıcıya Gösterilecek Mesaj
        </Typography>
        <TextField
          multiline
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Kullanıcıya gösterilecek mesajı buraya yazın..."
          fullWidth
          helperText="Bu mesaj kullanıcıya form gösterildiğinde görüntülenecektir"
        />
      </Box>
    </Box>
  );

  const renderTimingContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-3xl">
            <AccessTimeIcon fontSize="medium" />
                      </div>
          <div>
            <h5 className="text-base font-black text-slate-800 tracking-tight">Zamanlama ve SLA</h5>
            <p className="text-xs text-slate-500 font-bold">Bu alan için ayarlar yakında eklenecek.</p>
          </div>
        </div>
      </div>
      <Paper sx={{ p: 3, textAlign: "center", bgcolor: "grey.50" }}>
                      <Typography variant="body2" color="textSecondary">
          Zamanlama ayarları ve SLA kuralları için yapılandırma alanı burada görünecek.
                      </Typography>
      </Paper>
                  </div>
  );

  const renderButtonsContent = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-indigo-600 mb-4 px-2">
        <FormatListBulletedIcon fontSize="small" />
        <h4 className="text-sm font-black tracking-tight uppercase">Buton Görünürlüğü ve Aksiyonlar</h4>
      </div>
      {formButtons.length === 0 ? (
        <Paper sx={{ p: 2, textAlign: "center", bgcolor: "grey.100" }}>
          <Typography variant="body2" color="textSecondary">
            Bu formda buton bulunmuyor.
          </Typography>
        </Paper>
      ) : (
        <>
          <div className="grid gap-4">
            {formButtons.map((button) => {
              const isVisible = buttonSettings[button.id]?.visible !== false;
              return (
                <div
                  key={button.id}
                  className="flex items-center gap-6 p-6 bg-white border border-slate-200 rounded-[2.5rem] hover:shadow-xl transition-all group relative border-l-8 border-l-slate-100 hover:border-l-blue-500"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl ${
                      isVisible ? "bg-indigo-600" : "bg-slate-400"
                    } flex items-center justify-center text-white shadow-xl shadow-slate-100 transition-transform group-hover:scale-105`}
                  >
                    <PlayArrowIcon fontSize="small" />
                  </div>
                  <div className="flex-1">
                    <div className="text-base font-black text-slate-800">
                      {button.label || button.name || "Buton"}
                    </div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 opacity-60">
                      SİSTEM ID: {button.id}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {button.action && (
                        <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full border border-indigo-100">
                          {button.action}
                        </span>
                      )}
                      {button.type && (
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-full border border-slate-200">
                          {button.type}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleButtonVisibilityChange(button.id, !isVisible)}
                    className={`p-4 rounded-[1.5rem] transition-all transform active:scale-90 shadow-md ${
                      isVisible
                        ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                        : "text-slate-400 bg-slate-100 hover:bg-slate-200 opacity-50"
                    }`}
                  >
                    {isVisible ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                  </button>
                </div>
              );
            })}
          </div>
          <Box mt={2}>
            <Typography variant="caption" color="textSecondary">
              Görünür: {formButtons.filter(btn => buttonSettings[btn.id]?.visible !== false).length} / {formButtons.length} buton
            </Typography>
            <Typography variant="caption" color="warning.main" display="block" mt={0.5}>
              ⚠️ Görünür butonlar için çıkış handle&apos;ları oluşturulacaktır
            </Typography>
          </Box>
        </>
      )}
    </div>
  );

  const renderInitSettingsContent = () => (
    <Box>
      <Tabs 
        value={initSettingsTab} 
        onChange={(_, v) => setInitSettingsTab(v)}
        sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
      >
        <Tab 
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              📝 Değer Atama
              {initRules.length > 0 && (
                <Chip label={initRules.length} size="small" color="primary" />
              )}
            </Box>
          } 
          sx={{ textTransform: "none", fontWeight: 600 }} 
        />
        <Tab 
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              🔀 Koşullu Atama
              {conditionalRules.length > 0 && (
                <Chip label={conditionalRules.length} size="small" color="secondary" />
              )}
            </Box>
          } 
          sx={{ textTransform: "none", fontWeight: 600 }} 
        />
        <Tab 
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              👁️ Görünürlük
              {Object.values(visibilitySettings).filter(v => v === "hidden" || v === "readonly").length > 0 && (
                <Chip 
                  label={Object.values(visibilitySettings).filter(v => v === "hidden" || v === "readonly").length} 
                  size="small" 
                  color="warning" 
                />
              )}
            </Box>
          } 
          sx={{ textTransform: "none", fontWeight: 600 }} 
        />
        <Tab 
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              🔘 Butonlar
              {Object.values(buttonVisibilitySettings).filter(v => v === false).length > 0 && (
                <Chip 
                  label={Object.values(buttonVisibilitySettings).filter(v => v === false).length} 
                  size="small" 
                  color="error" 
                />
              )}
            </Box>
          } 
          sx={{ textTransform: "none", fontWeight: 600 }} 
        />
        <Tab 
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              ⚡ Formily Reactions
              {formReactions && (
                <Chip label="✓" size="small" color="success" />
              )}
            </Box>
          } 
          sx={{ textTransform: "none", fontWeight: 600 }} 
        />
      </Tabs>

      {/* TAB 0: DEĞER ATAMA */}
      {initSettingsTab === 0 && (
        <Box>
          <Paper sx={{ mb: 2, p: 2, bgcolor: "info.lighter" }} variant="outlined">
            <Typography variant="body2" fontWeight={600}>
              💡 Form açılırken otomatik değer atanacak alanları seçin
            </Typography>
          </Paper>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f8f9fa" }}>
                  <TableCell width="30%" sx={{ fontWeight: 600 }}>Alan Adı</TableCell>
                  <TableCell width="25%" sx={{ fontWeight: 600 }}>Değer Tipi</TableCell>
                  <TableCell width="40%" sx={{ fontWeight: 600 }}>Değer</TableCell>
                  <TableCell width="5%"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {initRules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4, color: "text.secondary" }}>
                      Henüz kural eklenmedi
                    </TableCell>
                  </TableRow>
                ) : (
                  initRules.map((rule, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Autocomplete
                          size="small"
                          value={formFields.find(f => f.key === rule.fieldName) || null}
                          onChange={(e, newValue) => handleUpdateInitRule(index, "fieldName", newValue?.key || "")}
                          options={formFields}
                          getOptionLabel={(option) => `${option.label} (${option.normalizedKey || option.key})`}
                          renderInput={(params) => (
                            <TextField {...params} placeholder="Alan seçin..." variant="outlined" />
                          )}
                          noOptionsText="Alan bulunamadı"
                        />
                      </TableCell>
                      <TableCell>
                        <Autocomplete
                          size="small"
                          value={(() => {
                            const valueType = rule.valueType || "static";
                            const options = [
                              { value: "static", label: "Sabit Değer", icon: "📝" },
                              { value: "currentDate", label: "Şu Anki Tarih", icon: "📅" },
                              { value: "currentUser", label: "Kullanıcı Bilgisi", icon: "👤" },
                              { value: "uuid", label: "Benzersiz ID", icon: "🔑" },
                              { value: "expression", label: "Formül/İfade", icon: "🧮" },
                            ];
                            return options.find(opt => opt.value === valueType) || options[0];
                          })()}
                          onChange={(e, newValue) => handleUpdateInitRule(index, "valueType", newValue?.value || "static")}
                          options={[
                            { value: "static", label: "Sabit Değer", icon: "📝" },
                            { value: "currentDate", label: "Şu Anki Tarih", icon: "📅" },
                            { value: "currentUser", label: "Kullanıcı Bilgisi", icon: "👤" },
                            { value: "uuid", label: "Benzersiz ID", icon: "🔑" },
                            { value: "expression", label: "Formül/İfade", icon: "🧮" },
                          ]}
                          getOptionLabel={(option) => `${option.icon} ${option.label}`}
                          renderInput={(params) => <TextField {...params} variant="outlined" />}
                          isOptionEqualToValue={(option, value) => option.value === value.value}
                        />
                      </TableCell>
                      <TableCell>
                        {rule.valueType === "static" ? (
                          <TextField
                            fullWidth
                            size="small"
                            value={rule.value}
                            onChange={(e) => handleUpdateInitRule(index, "value", e.target.value)}
                            placeholder="Değer girin..."
                            variant="outlined"
                          />
                        ) : rule.valueType === "expression" ? (
                          <TextField
                            fullWidth
                            size="small"
                            value={rule.expression}
                            onChange={(e) => handleUpdateInitRule(index, "expression", e.target.value)}
                            placeholder='Örn: "TR-" + new Date().getFullYear()'
                            variant="outlined"
                          />
                        ) : rule.valueType === "currentUser" ? (
                          <FormControl fullWidth size="small">
                            <Select
                              value={rule.userProperty || "fullName"}
                              onChange={(e) => handleUpdateInitRule(index, "userProperty", e.target.value)}
                              variant="outlined"
                            >
                              <MenuItem value="fullName">👤 Ad Soyad (fullName)</MenuItem>
                              <MenuItem value="firstName">📝 Ad (firstName)</MenuItem>
                              <MenuItem value="lastName">📝 Soyad (lastName)</MenuItem>
                              <MenuItem value="userName">🔑 Kullanıcı Adı (userName)</MenuItem>
                              <MenuItem value="email">📧 E-posta (email)</MenuItem>
                            </Select>
                          </FormControl>
                        ) : (
                          <Chip
                            label={getValueTypeLabel(rule.valueType)}
                            size="small"
                            color="success"
                            variant="filled"
                          />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteInitRule(index)} 
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <MDButton
            startIcon={<AddIcon />}
            onClick={handleAddInitRule}
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
          >
            ➕ Yeni Kural Ekle
          </MDButton>
        </Box>
      )}

      {/* TAB 1: KOŞULLU ATAMA */}
      {initSettingsTab === 1 && (
        <Box>
          <Paper sx={{ mb: 2, p: 2, bgcolor: "info.lighter" }} variant="outlined">
            <Typography variant="body2" fontWeight={600}>
              🔀 Koşullu değer atama
            </Typography>
            <Typography variant="caption">
              Eğer bir alan belirli bir değerse, başka bir alana otomatik değer ata.
            </Typography>
          </Paper>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {conditionalRules.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
                Henüz koşullu kural eklenmedi.
              </Paper>
            ) : (
              conditionalRules.map((rule, index) => (
                <Paper key={index} sx={{ p: 2, border: "1px solid #e0e0e0" }} elevation={0}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Kural {index + 1}
                    </Typography>
                    <IconButton size="small" onClick={() => handleDeleteConditionalRule(index)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  {/* EĞER */}
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 2 }}>
                    <Typography variant="body2" sx={{ minWidth: 60 }}>Eğer:</Typography>
                    <Autocomplete
                      size="small"
                      sx={{ flex: 1 }}
                      value={formFields.find(f => f.key === rule.condition.field) || null}
                      onChange={(e, newValue) => handleUpdateConditionalRule(index, "condition.field", newValue?.key || "")}
                      options={formFields}
                      getOptionLabel={(option) => option.label}
                      renderInput={(params) => <TextField {...params} placeholder="Alan..." />}
                    />
                    <Select
                      size="small"
                      value={rule.condition.operator}
                      onChange={(e) => handleUpdateConditionalRule(index, "condition.operator", e.target.value)}
                      sx={{ minWidth: 120 }}
                    >
                      {operators.map(op => (
                        <MenuItem key={op.value} value={op.value}>{op.label}</MenuItem>
                      ))}
                    </Select>
                    <TextField
                      size="small"
                      value={rule.condition.value}
                      onChange={(e) => handleUpdateConditionalRule(index, "condition.value", e.target.value)}
                      placeholder="Değer"
                      sx={{ width: 150 }}
                    />
                  </Box>

                  {/* O ZAMAN */}
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 2, ml: 2 }}>
                    <Typography variant="body2" sx={{ minWidth: 60 }} color="success.main">
                      → O zaman:
                    </Typography>
                    <Autocomplete
                      size="small"
                      sx={{ flex: 1 }}
                      value={formFields.find(f => f.key === rule.thenAction.fieldName) || null}
                      onChange={(e, newValue) => handleUpdateConditionalRule(index, "thenAction.fieldName", newValue?.key || "")}
                      options={formFields}
                      getOptionLabel={(option) => option.label}
                      renderInput={(params) => <TextField {...params} placeholder="Alan..." />}
                    />
                    <Typography variant="body2">=</Typography>
                    <TextField
                      size="small"
                      value={rule.thenAction.value}
                      onChange={(e) => handleUpdateConditionalRule(index, "thenAction.value", e.target.value)}
                      placeholder="Değer"
                      sx={{ flex: 1 }}
                    />
                  </Box>

                  {/* DEĞİLSE (Opsiyonel) */}
                  <Divider sx={{ my: 1 }} />
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={rule.elseAction?.enabled === true}
                        onChange={() => handleToggleElseAction(index)}
                        color="warning"
                      />
                    }
                    label={
                      <Typography variant="caption" fontWeight={600}>
                        &quot;Değilse&quot; durumu ekle
                      </Typography>
                    }
                    sx={{ ml: 2 }}
                  />
                  
                  {rule.elseAction?.enabled && (
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center", ml: 2, mt: 1, p: 2, backgroundColor: "#fff3e0", borderRadius: 1 }}>
                      <Typography variant="body2" sx={{ minWidth: 60 }} color="warning.dark" fontWeight={600}>
                        → Değilse:
                      </Typography>
                      <Autocomplete
                        size="small"
                        sx={{ flex: 1 }}
                        value={formFields.find(f => f.key === rule.elseAction.fieldName) || null}
                        onChange={(e, newValue) => handleUpdateConditionalRule(index, "elseAction.fieldName", newValue?.key || "")}
                        options={formFields}
                        getOptionLabel={(option) => option.label}
                        renderInput={(params) => <TextField {...params} placeholder="Alan seçin..." />}
                      />
                      <Typography variant="body2" fontWeight={600}>=</Typography>
                      <TextField
                        size="small"
                        value={rule.elseAction.value}
                        onChange={(e) => handleUpdateConditionalRule(index, "elseAction.value", e.target.value)}
                        placeholder="Değer girin"
                        sx={{ flex: 1 }}
                      />
                    </Box>
                  )}
                </Paper>
              ))
            )}
          </Box>

          <MDButton
            startIcon={<AddIcon />}
            onClick={handleAddConditionalRule}
            variant="contained"
            color="secondary"
            sx={{ mt: 2 }}
          >
            ➕ Yeni Koşul Ekle
          </MDButton>
        </Box>
      )}

      {/* TAB 2: GÖRÜNÜRLÜK */}
      {initSettingsTab === 2 && (
        <Box>
          <Paper sx={{ mb: 2, p: 2, bgcolor: "info.lighter" }} variant="outlined">
            <Typography variant="body2" fontWeight={600}>
              👁️ Form açılırken hangi alanlar görünür/gizli olacak?
            </Typography>
          </Paper>
          
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <MDButton
              size="small"
              variant="outlined"
              color="success"
              startIcon={<EditIcon />}
              onClick={() => {
                const allVisible = {};
                formFields.forEach(f => allVisible[f.key] = "visible");
                setVisibilitySettings(allVisible);
              }}
            >
              Tümü Düzenlenebilir
            </MDButton>
            <MDButton
              size="small"
              variant="outlined"
              color="warning"
              startIcon={<LockIcon />}
              onClick={() => {
                const allReadonly = {};
                formFields.forEach(f => allReadonly[f.key] = "readonly");
                setVisibilitySettings(allReadonly);
              }}
            >
              Tümü Readonly
            </MDButton>
            <MDButton
              size="small"
              variant="outlined"
              color="error"
              startIcon={<VisibilityOffIcon />}
              onClick={() => {
                const allHidden = {};
                formFields.forEach(f => allHidden[f.key] = "hidden");
                setVisibilitySettings(allHidden);
              }}
            >
              Tümü Gizli
            </MDButton>
          </Box>

          <Paper sx={{ p: 2 }} elevation={0}>
            {formFields.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <Typography color="text.secondary">
                  Form alanları yükleniyor...
                </Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ mb: 2, display: "flex", gap: 1 }}>
                  <Chip 
                    icon={<EditIcon />}
                    label={`Düzenlenebilir: ${Object.values(visibilitySettings).filter(v => v === "visible" || v === true || v === undefined).length}`}
                    color="success"
                    size="small"
                  />
                  <Chip 
                    icon={<LockIcon />}
                    label={`Readonly: ${Object.values(visibilitySettings).filter(v => v === "readonly").length}`}
                    color="warning"
                    size="small"
                  />
                  <Chip 
                    icon={<VisibilityOffIcon />}
                    label={`Gizli: ${Object.values(visibilitySettings).filter(v => v === false || v === "hidden").length}`}
                    color="error"
                    size="small"
                  />
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: 2 }}>
                  {formFields.map(field => {
                    const state = getFieldState(field.key);
                    const bgColor = state === "hidden" ? "#ffebee" : state === "readonly" ? "#fff3e0" : "#e8f5e9";
                    const borderColor = state === "hidden" ? "#ef5350" : state === "readonly" ? "#ff9800" : "#66bb6a";
                    
                    return (
                      <Paper
                        key={field.key} 
                        variant="outlined"
                        sx={{ 
                          p: 2,
                          backgroundColor: bgColor,
                          borderColor: borderColor,
                          borderWidth: 2,
                        }}
                      >
                        <Box sx={{ mb: 1.5 }}>
                          <Typography variant="body2" fontWeight={700}>
                            {field.label}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {field.normalizedKey || field.key} • {field.component}
                          </Typography>
                        </Box>
                        
                        <ToggleButtonGroup
                          value={state}
                          exclusive
                          onChange={(e, newState) => {
                            if (newState !== null) {
                              handleFieldStateChange(field.key, newState);
                            }
                          }}
                          size="small"
                          fullWidth
                        >
                          <ToggleButton value="visible">
                            <EditIcon sx={{ fontSize: 16, mr: 0.5 }} />
                            Düzenlenebilir
                          </ToggleButton>
                          <ToggleButton value="readonly">
                            <LockIcon sx={{ fontSize: 16, mr: 0.5 }} />
                            Readonly
                          </ToggleButton>
                          <ToggleButton value="hidden">
                            <VisibilityOffIcon sx={{ fontSize: 16, mr: 0.5 }} />
                            Gizli
                          </ToggleButton>
                        </ToggleButtonGroup>
                      </Paper>
                    );
                  })}
                </Box>
              </>
            )}
          </Paper>
        </Box>
      )}

      {/* TAB 3: BUTONLAR */}
      {initSettingsTab === 3 && (
        <Box>
          <Paper sx={{ mb: 2, p: 2, bgcolor: "info.lighter" }} variant="outlined">
            <Typography variant="body2" fontWeight={600}>
              🔘 Form açılırken hangi butonlar görünür olacak?
            </Typography>
          </Paper>
          
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <MDButton
              size="small"
              variant="outlined"
              color="success"
              startIcon={<VisibilityIcon />}
              onClick={() => {
                const allVisible = {};
                formButtons.forEach(btn => allVisible[btn.id] = true);
                setButtonVisibilitySettings(allVisible);
              }}
            >
              Tümü Görünür
            </MDButton>
            <MDButton
              size="small"
              variant="outlined"
              color="error"
              startIcon={<VisibilityOffIcon />}
              onClick={() => {
                const allHidden = {};
                formButtons.forEach(btn => allHidden[btn.id] = false);
                setButtonVisibilitySettings(allHidden);
              }}
            >
              Tümü Gizli
            </MDButton>
          </Box>

          <Paper sx={{ p: 2 }} elevation={0}>
            {formButtons.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <Typography color="text.secondary">
                  Bu formda buton tanımlanmamış.
                </Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ mb: 2, display: "flex", gap: 1 }}>
                  <Chip 
                    icon={<VisibilityIcon />}
                    label={`Görünür: ${Object.values(buttonVisibilitySettings).filter(v => v === true || v === undefined).length}`}
                    color="success"
                    size="small"
                  />
                  <Chip 
                    icon={<VisibilityOffIcon />}
                    label={`Gizli: ${Object.values(buttonVisibilitySettings).filter(v => v === false).length}`}
                    color="error"
                    size="small"
                  />
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 2 }}>
                  {formButtons.map(button => {
                    const isVisible = buttonVisibilitySettings[button.id] !== false;
                    const bgColor = isVisible ? "#e8f5e9" : "#ffebee";
                    const borderColor = isVisible ? "#66bb6a" : "#ef5350";
                    
                    return (
                      <Paper
                        key={button.id} 
                        variant="outlined"
                        sx={{ 
                          p: 2,
                          backgroundColor: bgColor,
                          borderColor: borderColor,
                          borderWidth: 2,
                        }}
                      >
                        <Box sx={{ mb: 1.5 }}>
                          <Typography variant="body2" fontWeight={700}>
                            {button.label || button.name || "Buton"}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            ID: {button.id}
                          </Typography>
                        </Box>
                        
                        <ToggleButtonGroup
                          value={isVisible ? "visible" : "hidden"}
                          exclusive
                          onChange={(e, newState) => {
                            if (newState !== null) {
                              setButtonVisibilitySettings({
                                ...buttonVisibilitySettings,
                                [button.id]: newState === "visible"
                              });
                            }
                          }}
                          size="small"
                          fullWidth
                        >
                          <ToggleButton value="visible">
                            <VisibilityIcon sx={{ fontSize: 16, mr: 0.5 }} />
                            Görünür
                          </ToggleButton>
                          <ToggleButton value="hidden">
                            <VisibilityOffIcon sx={{ fontSize: 16, mr: 0.5 }} />
                            Gizli
                          </ToggleButton>
                        </ToggleButtonGroup>
                      </Paper>
                    );
                  })}
                </Box>
              </>
            )}
          </Paper>
        </Box>
      )}

      {/* TAB 4: FORMILY REACTIONS (x-reactions) */}
      {initSettingsTab === 4 && (
        <Box className="form-task-reactions-wrapper">
          <Paper
            sx={{
              mb: 2,
              p: 2,
              background: "linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
            }}
            variant="outlined"
          >
            <Typography variant="subtitle2" fontWeight={700} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              ⚡ Formily x-reactions
            </Typography>
            <Typography variant="caption" display="block" mt={0.5} color="text.secondary">
              Form alanlarına bağımlılık (dependency) tanımlayarak visible, disabled, readonly, title vb. özellikleri dinamik yapın.
            </Typography>
          </Paper>

          {formFields.length === 0 ? (
            <Paper
              sx={{
                p: 4,
                textAlign: "center",
                color: "text.secondary",
                borderRadius: 2,
                border: "1px dashed",
                borderColor: "divider",
              }}
            >
              Form alanları yükleniyor veya form tanımlanmamış.
            </Paper>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Paper sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "grey.50" }} variant="outlined">
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Modal içinde Source dropdown tıklama sorunu var. Tam sayfa editörde düzenleyebilirsiniz.
                </Typography>
                <AntdButton
                  type="primary"
                  size="large"
                  block
                  onClick={() => {
                    sessionStorage.setItem(
                      STORAGE_KEY_REACTIONS_PENDING,
                      JSON.stringify({
                        formReactions,
                        formSchema: formSchema || null,
                        nodeId: node?.id,
                        returnTo: location.pathname || "/WorkFlowList/detail",
                      })
                    );
                    navigate("/forms/reactions-editor");
                  }}
                  style={{ height: 48, fontSize: 15, fontWeight: 600 }}
                >
                  ⚡ Formily Reactions Düzenle (Tam Sayfa)
                </AntdButton>
              </Paper>
              {formReactions && (
                <Paper
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "grey.50",
                  }}
                  variant="outlined"
                >
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: "block", mb: 1 }}>
                    📋 Mevcut Reaction (özet)
                  </Typography>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: "background.paper",
                      border: "1px solid",
                      borderColor: "divider",
                      fontFamily: "'Fira Code', 'Monaco', 'Courier New', monospace",
                      fontSize: 11,
                      maxHeight: 140,
                      overflow: "auto",
                    }}
                    component="pre"
                  >
                    {JSON.stringify(formReactions, null, 2)}
                  </Box>
                </Paper>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* SCRIPT ÖNİZLEME */}
      <Divider sx={{ my: 3 }} />
      
      {(initRules.length > 0 || conditionalRules.length > 0 || Object.values(visibilitySettings).some(v => v === "hidden" || v === "readonly") || Object.values(buttonVisibilitySettings).some(v => v === false)) && (
        <Box 
          sx={{ 
            p: 2.5, 
            backgroundColor: "#f8f9fa",
            borderRadius: 2,
            border: "1px solid #e0e0e0",
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
            📝 Oluşturulan Script (Önizleme)
          </Typography>
          <Box
            sx={{
              p: 2,
              backgroundColor: "#ffffff",
              borderRadius: 1,
              border: "1px solid #e0e0e0",
              fontFamily: "'Fira Code', 'Monaco', 'Courier New', monospace",
              fontSize: "12px",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            {generateScript() || "// Henüz kural eklenmedi"}
          </Box>
          
          <MDButton
            startIcon={<PlayArrowIcon />}
            onClick={handleTestPreview}
            variant="contained"
            color="success"
            disabled={!formSchema}
            sx={{ mt: 2 }}
          >
            🧪 Script Test Et
          </MDButton>
        </Box>
      )}

      {/* TEST PREVIEW DIALOG */}
      <Dialog open={testPreviewOpen} onClose={() => setTestPreviewOpen(false)} maxWidth="md" fullWidth>
        <Box 
          sx={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            p: 2.5,
            background: "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)",
            color: "white"
          }}
        >
          <Typography variant="h6" fontWeight={700}>
            🧪 Script Test - Form Önizleme
          </Typography>
          <IconButton 
            onClick={() => setTestPreviewOpen(false)} 
            size="small"
            sx={{ color: "white" }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 3 }}>
          <Paper sx={{ mb: 3, p: 2, bgcolor: "success.lighter" }}>
            <Typography variant="body2" fontWeight={600}>
              ✅ Script başarıyla çalıştırıldı! Aşağıda formun son halini görebilirsiniz.
            </Typography>
          </Paper>
          
          <Paper sx={{ p: 2, mb: 3, backgroundColor: "#f5f5f5" }} variant="outlined">
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              📊 Test Bilgileri:
            </Typography>
            <Typography variant="body2">
              <strong>👤 Kullanıcı:</strong> Test Kullanıcı
            </Typography>
            <Typography variant="body2">
              <strong>📅 Tarih:</strong> {new Date().toLocaleString("tr-TR")}
            </Typography>
          </Paper>

          {formSchema?.schema && (
            <Box sx={{ border: "2px solid #4caf50", borderRadius: 2, p: 3 }}>
              <FormProvider form={testForm}>
                <SchemaField schema={formSchema.schema} />
              </FormProvider>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );

  const renderScriptContent = () => (
    <Box mb={2}>
      <Typography variant="subtitle2" fontWeight={600} mb={2}>
        Form Alanları Script Kontrolü
      </Typography>
      
      <Box mb={2} display="flex" gap={2} flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>📝 Script Şablonu</InputLabel>
          <Select
            value={selectedTemplate}
            label="📝 Script Şablonu"
            onChange={(e) => handleTemplateChange(e.target.value)}
          >
            <MenuItem value="">Özel Script</MenuItem>
            <MenuItem value="conditional-visibility">Koşullu Görünürlük</MenuItem>
            <MenuItem value="auto-calculation">Otomatik Hesaplama</MenuItem>
            <MenuItem value="readonly-condition">Koşullu Readonly</MenuItem>
            <MenuItem value="form-validation">Form Validasyon</MenuItem>
            <MenuItem value="date-calculation">Tarih Hesaplama</MenuItem>
          </Select>
        </FormControl>

        <Box display="flex" gap={1} flexWrap="wrap">
          <MDButton
            size="small"
            variant="outlined"
            color="info"
            onClick={quickActions["hide-all"]}
            startIcon={<VisibilityOffIcon />}
          >
            Tümünü Gizle
          </MDButton>
          <MDButton
            size="small"
            variant="outlined"
            color="info"
            onClick={quickActions["show-all"]}
            startIcon={<VisibilityIcon />}
          >
            Tümünü Göster
          </MDButton>
          <MDButton
            size="small"
            variant="outlined"
            color="warning"
            onClick={quickActions["readonly-all"]}
            startIcon={<LockIcon />}
          >
            Tümünü Readonly
          </MDButton>
          <MDButton
            size="small"
            variant="outlined"
            color="success"
            onClick={quickActions["enable-all"]}
            startIcon={<LockOpenIcon />}
          >
            Tümünü Aktif
          </MDButton>
          <MDButton
            size="small"
            variant="outlined"
            color="secondary"
            onClick={quickActions["debug-template"]}
            startIcon={<BugReportIcon />}
          >
            Debug Template
          </MDButton>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 2, bgcolor: "info.light", color: "info.contrastText" }}>
        <Typography variant="body2" fontWeight={600} mb={1}>
          💡 Script Kullanımı - Form Alanlarını Kontrol Etme
        </Typography>
        <Typography variant="caption" component="div">
          Script ile form alanlarını dinamik olarak kontrol edebilirsiniz.
        </Typography>
      </Paper>

      <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 1, overflow: "hidden" }}>
        <Editor
          height="400px"
          defaultLanguage="javascript"
          value={fieldScript}
          onChange={(value) => setFieldScript(value || "")}
          theme="vs-light"
          onMount={(editor, monacoInstance) => {
            setMonacoEditor(editor);
            setMonacoInstance(monacoInstance);
          }}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            automaticLayout: true,
            scrollBeyondLastLine: false,
          }}
        />
      </Box>

      <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center" gap={1}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Script Çalışma Zamanı</InputLabel>
            <Select
              value={scriptEventType}
              label="Script Çalışma Zamanı"
              onChange={(e) => setScriptEventType(e.target.value)}
            >
              <MenuItem value="onLoad">Form Yüklendiğinde</MenuItem>
              <MenuItem value="onChange">Alan Değiştiğinde</MenuItem>
              <MenuItem value="both">Her İkisi</MenuItem>
            </Select>
          </FormControl>
          <MDButton
            size="small"
            variant="outlined"
            color="info"
            startIcon={<ContentCopyIcon />}
            onClick={() => {
              navigator.clipboard.writeText(fieldScript);
              alert("Script panoya kopyalandı!");
            }}
          >
            Kopyala
          </MDButton>
        </Box>
        <MDButton
          size="small"
          variant="contained"
          color="success"
          startIcon={<PlayArrowIcon />}
          onClick={() => {
            alert("Script test özelliği yakında eklenecek!");
          }}
        >
          Test Et
        </MDButton>
      </Box>

      <Accordion expanded={showFieldReference} onChange={(e, expanded) => setShowFieldReference(expanded)} sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<TableChartIcon />}>
          <Typography variant="subtitle2">📋 Form Alan Referansları</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Alan Adı</strong></TableCell>
                  <TableCell><strong>Tip</strong></TableCell>
                  <TableCell><strong>Label</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formFields.map((field) => (
                  <TableRow key={field.key}>
                    <TableCell>
                      <Typography variant="caption" fontWeight={600}>
                        {field.normalizedKey || field.key}
                      </Typography>
                    </TableCell>
                    <TableCell>{field.type}</TableCell>
                    <TableCell>{field.label}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogContent sx={{ p: 0, display: "flex", flexDirection: "row", height: "80vh", overflow: "hidden" }}>
        {/* Sidebar */}
        <Box
          sx={{
            width: 280,
            bgcolor: "grey.50",
            borderRight: 1,
            borderColor: "divider",
            p: 3,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
          }}
        >
          <Box mb={3}>
            <Box
              sx={{
                width: 48,
                height: 48,
                bgcolor: "primary.main",
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                mb: 2,
              }}
            >
              <SettingsIcon />
            </Box>
            <Typography variant="h6" fontWeight={700}>
              FormTask
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              NEO-BPM
            </Typography>
          </Box>

          <Box sx={{ flex: 1 }}>
            {[
              { id: "assignment", label: "Atama Mantığı", icon: LayersIcon, color: "primary" },
              { id: "timing", label: "Zamanlama", icon: AccessTimeIcon, color: "warning" },
              { id: "initSettings", label: "Form Başlangıç Ayarları", icon: RuleIcon, color: "secondary" },
              { id: "buttons", label: "Buton Ayarları", icon: SettingsIcon, color: "info" },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <Box
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    p: 2,
                    mb: 1,
                    borderRadius: 2,
                    cursor: "pointer",
                    bgcolor: isActive ? `${item.color}.light` : "transparent",
                    color: isActive ? `${item.color}.main` : "text.secondary",
                    "&:hover": {
                      bgcolor: isActive ? `${item.color}.light` : "action.hover",
                    },
                    transition: "all 0.2s",
                  }}
                >
                  <Icon fontSize="small" />
                  <Typography variant="body2" fontWeight={isActive ? 700 : 500}>
                    {item.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          <Box sx={{ pt: 2, borderTop: 1, borderColor: "divider" }}>
            <Paper sx={{ p: 2, bgcolor: "success.light", borderRadius: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <VerifiedUserIcon fontSize="small" color="success" />
                <Typography variant="caption" fontWeight={700}>
                  Güvenli Tasarım
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Uyumlanmış Model
              </Typography>
            </Paper>
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Header */}
          <Box
            sx={{
              px: 3,
              py: 2,
              borderBottom: 1,
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {activeTab === "assignment"
                  ? "Atama Mantığı"
                  : activeTab === "timing"
                  ? "Zamanlama & SLA"
                  : activeTab === "initSettings"
                  ? "Form Başlangıç Ayarları"
                  : "Buton Yönetimi"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Süreç Adımı: {name || "Form Görevi"}
              </Typography>
            </Box>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>
            {activeTab === "assignment" && renderAssignmentContent()}
            {activeTab === "timing" && renderTimingContent()}
            {activeTab === "initSettings" && renderInitSettingsContent()}
            {activeTab === "buttons" && renderButtonsContent()}
          </Box>

          {/* Footer */}
          <Box
            sx={{
              px: 3,
              py: 2,
              borderTop: 1,
              borderColor: "divider",
              bgcolor: "grey.50",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: { xs: "none", lg: "flex" }, alignItems: "center", gap: 1 }}>
              <InfoOutlinedIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                Kaydetmeden önce değişiklikleri kontrol edin.
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 2, ml: "auto" }}>
              <MDButton variant="outlined" color="secondary" onClick={onClose}>
                Vazgeç
              </MDButton>
              <MDButton variant="gradient" color="info" onClick={handleSave} startIcon={<SaveIcon />}>
                Güncelle ve Kaydet
              </MDButton>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default FormTaskModal;

