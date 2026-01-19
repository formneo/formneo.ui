import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  InputAdornment,
  Tooltip,
  ButtonGroup,
  Card,
  CardContent,
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
} from "@mui/material";
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Message as MessageIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  SelectAll as SelectAllIcon,
  Deselect as DeselectIcon,
  Code as CodeIcon,
  ContentCopy as ContentCopyIcon,
  PlayArrow as PlayArrowIcon,
  BugReport as BugReportIcon,
  TableChart as TableChartIcon,
  FormatListBulleted as FormatListBulletedIcon,
} from "@mui/icons-material";
import { Editor } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";
import { UserApi, FormDataApi } from "api/generated";
import getConfiguration from "confiuration";
import { useBusy } from "layouts/pages/hooks/useBusy";

/**
 * ✅ FormTask Modal Component
 * 
 * Özellikler:
 * - Kullanıcı atama (Autocomplete ile arama)
 * - Form alanlarını listeleme ve görünürlük kontrolü
 * - Workflow'dan seçili formu kullanır
 */

const FormTaskModal = ({ open, onClose, initialValues, node, onSave, workflowFormId, workflowFormName }) => {
  const [name, setName] = useState(initialValues?.name || "Form Görevi");
  const [searchByName, setSearchByName] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formFields, setFormFields] = useState([]);
  const [formButtons, setFormButtons] = useState([]);
  const [fieldSettings, setFieldSettings] = useState({});
  const [buttonSettings, setButtonSettings] = useState({});
  const [message, setMessage] = useState(initialValues?.message || "");
  const [activeTab, setActiveTab] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [fieldScript, setFieldScript] = useState(initialValues?.fieldScript || "");
  const [scriptEventType, setScriptEventType] = useState(initialValues?.scriptEventType || "onLoad"); // "onLoad" | "onChange" | "both"
  const [monacoEditor, setMonacoEditor] = useState(null);
  const [monacoInstance, setMonacoInstance] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [showFieldReference, setShowFieldReference] = useState(false);
  const dispatchBusy = useBusy();

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
console.log("=== Form Değerleri ===");
${formFields.map(field => {
  const key = field.normalizedKey || field.key;
  return `console.log("${key}:", getFieldValue("${key}"));`;
}).join("\n")}
console.log("=== Tüm Form Values ===");
console.log(formValues);`;
      setFieldScript(script);
    },
  };

  // Monaco Editor için IntelliSense tip tanımlarını oluştur ve güncelle
  useEffect(() => {
    if (!monacoInstance || activeTab !== 2) return;

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

      console.log("✅ Tip tanımları eklendi:", formFields.length > 0 ? `${formFields.length} alan` : "temel fonksiyonlar");

      // IntelliSense'i tetikle
      if (monacoEditor) {
        const model = monacoEditor.getModel();
        if (model) {
          // Model URI'sini kontrol et
          console.log("Model URI:", model.uri.toString());
          
          // Model'i yeniden yükle (IntelliSense'i güncellemek için)
          setTimeout(() => {
            // IntelliSense'i manuel olarak tetikle
            try {
              monacoEditor.getAction("editor.action.triggerSuggest")?.run();
              console.log("✅ IntelliSense tetiklendi");
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
        // Boş string veya "*" ile tüm kullanıcıları getirmeyi dene
        const data = await api.apiUserGetAllUsersWithNameNameGet("*");
        const pureData = data?.data || [];
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
    }
  }, [open, dispatchBusy]);

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
          const schema = design?.schema;
          
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
      setSearchByName([]);
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
      setSearchByName([]);
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  // Alan görünürlüğünü değiştir
  const handleFieldVisibilityChange = (fieldKey, visible) => {
    setFieldSettings(prev => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        visible,
      },
    }));
  };

  // Alan read-only durumunu değiştir
  const handleFieldReadonlyChange = (fieldKey, readonly) => {
    setFieldSettings(prev => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        readonly,
      },
    }));
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

  // Toplu işlemler - Tüm alanları görünür/gizli yap
  const handleSelectAllFields = () => {
    const newSettings = {};
    formFields.forEach(field => {
      newSettings[field.key] = {
        ...fieldSettings[field.key],
        visible: true,
      };
    });
    setFieldSettings(newSettings);
  };

  const handleDeselectAllFields = () => {
    const newSettings = {};
    formFields.forEach(field => {
      newSettings[field.key] = {
        ...fieldSettings[field.key],
        visible: false,
      };
    });
    setFieldSettings(newSettings);
  };

  // Filtrelenmiş alanlar
  const filteredFields = formFields.filter(field => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      field.label.toLowerCase().includes(query) ||
      field.key.toLowerCase().includes(query) ||
      field.component.toLowerCase().includes(query)
    );
  });

  // Kaydet
  const handleSave = () => {
    if (!selectedUser) {
      alert("Lütfen bir kullanıcı seçin");
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

    const taskData = {
      name,
      userId: selectedUser.id || selectedUser.userAppId,
      userName: selectedUser.userName,
      userFirstName: selectedUser.firstName,
      userLastName: selectedUser.lastName,
      assignedUserName: selectedUser.firstName && selectedUser.lastName
        ? `${selectedUser.firstName} ${selectedUser.lastName}`
        : selectedUser.userAppName || selectedUser.userName,
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Form Görevi Ayarları</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 2 }}>
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
            <Typography variant="subtitle1" fontWeight={600} mb={1}>
              <PersonIcon sx={{ verticalAlign: "middle", mr: 1 }} />
              Atanacak Kullanıcı
            </Typography>
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
                  setSearchByName([]);
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
              <Tab label="Alanlar" icon={<VisibilityIcon />} iconPosition="start" />
              <Tab label="Butonlar" icon={<SettingsIcon />} iconPosition="start" />
              <Tab label="Script" icon={<CodeIcon />} iconPosition="start" />
            </Tabs>
          </Box>

          {/* Alan Görünürlük Kontrolü Tab */}
          {activeTab === 0 && (
          <Box mb={2}>
            {/* Başlık ve Toplu İşlemler */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle2" fontWeight={600}>
                Form Alanları Kontrolü ({formFields.length} alan)
              </Typography>
              {formFields.length > 0 && (
                <ButtonGroup size="small" variant="outlined">
                  <Tooltip title="Tümünü Görünür Yap">
                    <MDButton
                      size="small"
                      variant="outlined"
                      color="info"
                      onClick={handleSelectAllFields}
                      startIcon={<SelectAllIcon />}
                    >
                      Tümü
                    </MDButton>
                  </Tooltip>
                  <Tooltip title="Tümünü Gizle">
                    <MDButton
                      size="small"
                      variant="outlined"
                      color="secondary"
                      onClick={handleDeselectAllFields}
                      startIcon={<DeselectIcon />}
                    >
                      Hiçbiri
                    </MDButton>
                  </Tooltip>
                </ButtonGroup>
              )}
            </Box>

            {/* Arama Kutusu */}
            {formFields.length > 0 && (
              <TextField
                fullWidth
                size="small"
                placeholder="Alan ara... (isim, tip, vb.)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setSearchQuery("")}
                        edge="end"
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
            )}
            
            {formFields.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: "center", bgcolor: "grey.100" }}>
                <Typography variant="body2" color="textSecondary">
                  Form alanları bulunamadı veya form seçilmemiş.
                </Typography>
              </Paper>
            ) : filteredFields.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: "center", bgcolor: "grey.100" }}>
                <Typography variant="body2" color="textSecondary">
                  &quot;{searchQuery}&quot; için sonuç bulunamadı.
                </Typography>
              </Paper>
            ) : (
              <Box sx={{ maxHeight: "500px", overflowY: "auto", pr: 1 }}>
                <Grid container spacing={1.5}>
                  {filteredFields.map((field) => {
                    const isVisible = fieldSettings[field.key]?.visible !== false;
                    const isReadonly = fieldSettings[field.key]?.readonly === true;
                    return (
                      <Grid item xs={12} sm={6} key={field.key}>
                        <Card
                          sx={{
                            border: `2px solid ${isVisible ? (isReadonly ? "#ff9800" : "#4caf50") : "#e0e0e0"}`,
                            bgcolor: isVisible ? (isReadonly ? "#fff3e0" : "#f1f8f4") : "#f5f5f5",
                            transition: "all 0.2s",
                            "&:hover": {
                              boxShadow: 3,
                              transform: "translateY(-2px)",
                            },
                          }}
                        >
                          <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                            {/* Alan Başlığı ve Chips */}
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                              <Box flex={1}>
                                <Typography
                                  variant="body2"
                                  fontWeight={isVisible ? 600 : 400}
                                  sx={{
                                    mb: 0.5,
                                    color: isVisible ? "text.primary" : "text.secondary",
                                    textDecoration: isVisible ? "none" : "line-through",
                                  }}
                                >
                                  {field.label}
                                </Typography>
                                <Box display="flex" gap={0.5} flexWrap="wrap">
                                  <Chip
                                    label={field.component}
                                    size="small"
                                    variant="outlined"
                                    sx={{ height: "18px", fontSize: "0.65rem" }}
                                  />
                                  {field.required && (
                                    <Chip
                                      label="Zorunlu"
                                      size="small"
                                      color="error"
                                      sx={{ height: "18px", fontSize: "0.65rem" }}
                                    />
                                  )}
                                  {isReadonly && (
                                    <Chip
                                      label="Read-Only"
                                      size="small"
                                      color="warning"
                                      sx={{ height: "18px", fontSize: "0.65rem" }}
                                    />
                                  )}
                                </Box>
                              </Box>
                            </Box>

                            {/* Kontroller */}
                            <Box display="flex" gap={1} flexWrap="wrap">
                              <Tooltip title={isVisible ? "Görünür" : "Gizli"}>
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={isVisible}
                                      onChange={(e) => handleFieldVisibilityChange(field.key, e.target.checked)}
                                      icon={<VisibilityOffIcon fontSize="small" />}
                                      checkedIcon={<VisibilityIcon fontSize="small" color="success" />}
                                      size="small"
                                    />
                                  }
                                  label={
                                    <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
                                      Görünür
                                    </Typography>
                                  }
                                  sx={{ m: 0 }}
                                />
                              </Tooltip>
                              {isVisible && (
                                <Tooltip title={isReadonly ? "Read-Only" : "Düzenlenebilir"}>
                                  <FormControlLabel
                                    control={
                                      <Checkbox
                                        checked={isReadonly}
                                        onChange={(e) => handleFieldReadonlyChange(field.key, e.target.checked)}
                                        icon={<LockOpenIcon fontSize="small" />}
                                        checkedIcon={<LockIcon fontSize="small" color="warning" />}
                                        size="small"
                                      />
                                    }
                                    label={
                                      <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
                                        Read-Only
                                      </Typography>
                                    }
                                    sx={{ m: 0 }}
                                  />
                                </Tooltip>
                              )}
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            )}
            
            {/* İstatistikler */}
            {formFields.length > 0 && (
              <Box mt={2} p={1.5} bgcolor="grey.50" borderRadius={1}>
                <Box display="flex" gap={2} flexWrap="wrap">
                  <Typography variant="caption" fontWeight={600}>
                    📊 İstatistikler:
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    ✅ Görünür: {Object.values(fieldSettings).filter(s => s.visible).length} / {formFields.length}
                  </Typography>
                  <Typography variant="caption" color="warning.main">
                    🔒 Read-Only: {Object.values(fieldSettings).filter(s => s.visible && s.readonly).length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    🔍 Filtrelenmiş: {filteredFields.length} / {formFields.length}
                  </Typography>
                </Box>
              </Box>
            )}
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
                    console.log("Monaco Editor model URI:", model.uri.toString());
                    
                    // Model'in URI'sini JavaScript dosyası olarak ayarla (IntelliSense için)
                    // Bu, tip tanımlarının çalışması için önemli
                    const uri = model.uri;
                    if (!uri.path.endsWith('.js') && !uri.path.endsWith('.ts')) {
                      // Model URI'sini JavaScript olarak işaretle
                      console.log("Model URI ayarlandı:", uri.toString());
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
console.log("Müşteri Adı:", musteriAdi);

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
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
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

export default FormTaskModal;

