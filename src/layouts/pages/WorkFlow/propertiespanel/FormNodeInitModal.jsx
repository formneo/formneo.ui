import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
  Select,
  MenuItem,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Chip,
  Autocomplete,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayArrowIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Lock as LockIcon,
  Edit as EditIcon,
  Functions as FunctionsIcon,
  Rule as RuleIcon,
} from "@mui/icons-material";
import MDButton from "components/MDButton";
import { FormDataApi } from "api/generated";
import getConfiguration from "confiuration";
import { createForm } from "@formily/core";
import { FormProvider, createSchemaField } from "@formily/react";
import * as AntdFormily from "@formily/antd";
import { Card as AntdCard, Slider as AntdSlider, Rate as AntdRate, message } from "antd";
import CurrencyInput from "../../FormEditor/custom/CurrencyInput";
import "antd/dist/antd.css";

/**
 * ✅ FormNode Init Modal - Kapsamlı Versiyon
 * 
 * Özellikler:
 * - Değer atama (static, dynamic, expression)
 * - Koşullu atama
 * - Görünürlük ayarları
 * - Test preview
 */

const FormNodeInitModal = ({ open, onClose, initialValues, node, workflowFormId, workflowFormName, onSave }) => {
  const [activeTab, setActiveTab] = useState(0); // 0: Değer Atama, 1: Koşullar, 2: Görünürlük, 3: Butonlar
  const [initRules, setInitRules] = useState([]);
  const [conditionalRules, setConditionalRules] = useState([]);
  const [visibilitySettings, setVisibilitySettings] = useState({}); // { fieldName: "visible" | "readonly" | "hidden" }
  const [formFields, setFormFields] = useState([]);
  const [formSchema, setFormSchema] = useState(null);
  const [testPreviewOpen, setTestPreviewOpen] = useState(false);
  const [formButtons, setFormButtons] = useState([]); // Form butonları
  const [buttonVisibilitySettings, setButtonVisibilitySettings] = useState({}); // { buttonId: true/false }

  // Test form instance
  const testForm = useMemo(() => createForm(), []);
  const SchemaField = useMemo(() => createSchemaField({ 
    components: { 
      ...AntdFormily, 
      CurrencyInput, 
      Card: AntdCard, 
      Slider: AntdSlider, 
      Rate: AntdRate 
    } 
  }), []);

  // Schema'dan alanları çıkar (Formily formatı)
  const extractFieldsFromSchema = (properties, parentPath = "") => {
    const fields = [];
    
    Object.keys(properties).forEach(key => {
      const prop = properties[key];
      const fieldPath = parentPath ? `${parentPath}.${key}` : key;
      
      if (prop.type === "void") {
        if (prop.properties) {
          fields.push(...extractFieldsFromSchema(prop.properties, fieldPath));
        }
      } else if (prop["x-component"] && prop["x-component"] !== "FormItem") {
        fields.push({
          name: fieldPath,
          label: prop.title || prop.label || key,
          type: prop.type || "string",
          component: prop["x-component"],
        });
      } else if (prop.properties) {
        fields.push(...extractFieldsFromSchema(prop.properties, fieldPath));
      }
    });
    
    return fields;
  };

  // InitScript'ten mevcut ayarları parse et
  useEffect(() => {
    console.log("🔍 FormNodeInitModal açıldı:", {
      open,
      initialValues,
      hasInitScript: !!initialValues?.initScript,
    });
    
    if (open && initialValues?.initScript) {
      const parsed = parseScriptToSettings(initialValues.initScript);
      console.log("✅ Script parse edildi:", parsed);
      setInitRules(parsed.initRules);
      setConditionalRules(parsed.conditionalRules);
      setVisibilitySettings(parsed.visibilitySettings);
      setButtonVisibilitySettings(parsed.buttonVisibilitySettings || {});
    } else if (open) {
      console.log("📝 Yeni modal açılıyor (initScript yok)");
      setInitRules([]);
      setConditionalRules([]);
      setVisibilitySettings({});
      setButtonVisibilitySettings({});
    }
  }, [open, initialValues?.initScript]);

  // Form alanlarını ve schema'yı yükle
  useEffect(() => {
    const loadFormFields = async () => {
      const formId = initialValues?.formId || node?.data?.formId || workflowFormId;
      
      if (!formId) {
        console.warn("⚠️ FormId bulunamadı");
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
          
          if (schema?.properties) {
            const fields = extractFieldsFromSchema(schema.properties);
            setFormFields(fields);
            
            // Varsayılan görünürlük ayarları
            const defaultVisibility = {};
            fields.forEach(field => {
              // initialValues'dan gelen değeri kullan, yoksa "visible" (varsayılan)
              defaultVisibility[field.name] = initialValues?.visibilitySettings?.[field.name] ?? "visible";
            });
            setVisibilitySettings(defaultVisibility);
          }
          
          // Form butonlarını yükle
          const buttons = design?.buttonPanel?.buttons || [];
          setFormButtons(buttons);
          
          // Varsayılan buton görünürlük ayarları
          const defaultButtonVisibility = {};
          buttons.forEach(button => {
            defaultButtonVisibility[button.id] = initialValues?.buttonVisibilitySettings?.[button.id] ?? true;
          });
          setButtonVisibilitySettings(defaultButtonVisibility);
        }
      } catch (error) {
        console.error("❌ Form alanları yüklenirken hata:", error);
      }
    };

    if (open) {
      loadFormFields();
    }
  }, [open, workflowFormId, initialValues, node]);

  // ===== DEĞER ATAMA =====
  const handleAddRule = () => {
    setInitRules([
      ...initRules,
      {
        fieldName: "",
        valueType: "static", // static, currentDate, currentUser, uuid, expression
        value: "",
        expression: "",
        userProperty: "fullName", // currentUser için hangi property
      },
    ]);
  };

  const handleUpdateRule = (index, field, value) => {
    const newRules = [...initRules];
    newRules[index][field] = value;
    setInitRules(newRules);
  };

  const handleDeleteRule = (index) => {
    setInitRules(initRules.filter((_, i) => i !== index));
  };

  // ===== KOŞULLU ATAMA =====
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
          enabled: false, // ✅ Else durumu başlangıçta kapalı
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

  // ===== GÖRÜNÜRLÜK & READONLY =====
  const handleFieldStateChange = (fieldName, newState) => {
    setVisibilitySettings({
      ...visibilitySettings,
      [fieldName]: newState, // "visible" | "readonly" | "hidden"
    });
  };

  // Alan durumunu al (visible, readonly, hidden)
  const getFieldState = (fieldName) => {
    const state = visibilitySettings[fieldName];
    // undefined veya true → visible
    if (state === undefined || state === true || state === "visible") return "visible";
    // false → hidden
    if (state === false || state === "hidden") return "hidden";
    // "readonly"
    if (state === "readonly") return "readonly";
    return "visible"; // varsayılan
  };

  // ===== SCRIPT GENERATION =====
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
          
          // ✅ Else action enabled ve dolu ise ekle
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
        // readonly true ise "readonly", false ise "visible" olarak ayarla
        if (readonlyMatch[2] === "true") {
          result.visibilitySettings[readonlyMatch[1]] = "readonly";
        }
        return;
      }
      
      // setFieldValue parse (basit)
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
          // currentUser.fullName gibi ifadeden property'yi çıkar
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

  // ===== TEST PREVIEW =====
  const handleTestPreview = () => {
    if (!formSchema) {
      message.warning("Form schema yüklenmedi");
      return;
    }
    
    // Test form'u sıfırla
    testForm.reset();
    
    // Script'i oluştur ve çalıştır
    const script = generateScript();
    
    try {
      // Mock fonksiyonlar
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
      
      // Mock currentUser ve crypto
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
      
      // Script'i çalıştır
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
      
      message.success("Script başarıyla test edildi!");
      setTestPreviewOpen(true);
    } catch (error) {
      console.error("Script test hatası:", error);
      message.error("Script test edilirken hata: " + error.message);
    }
  };

  // Kaydet
  const handleSave = () => {
    const script = generateScript();
    
    if (onSave && node) {
      onSave({
        id: node.id,
        data: {
          ...initialValues,
          initScript: script,
          visibilitySettings: visibilitySettings,
          buttonVisibilitySettings: buttonVisibilitySettings,
        },
      });
    }
    
    message.success("Form başlangıç ayarları kaydedildi!");
    onClose();
  };

  // Değer tipi etiketleri
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

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <Box 
          sx={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            p: 2.5, 
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white"
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
              📋 Form Başlangıç Ayarları
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {workflowFormName || "Form"}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: "white", "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" } }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Tabs 
          value={activeTab} 
          onChange={(_, v) => {
            console.log("📑 Tab değiştirildi:", v);
            setActiveTab(v);
          }}
          sx={{ borderBottom: 1, borderColor: "divider", backgroundColor: "#fafafa" }}
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
                {Object.values(visibilitySettings).filter(v => v === false).length > 0 && (
                  <Chip 
                    label={Object.values(visibilitySettings).filter(v => v === false).length} 
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
                🔘 Butonlar
                {Object.values(buttonVisibilitySettings).filter(v => v === false).length > 0 && (
                  <Chip 
                    label={Object.values(buttonVisibilitySettings).filter(v => v === false).length} 
                    size="small" 
                    color="warning" 
                  />
                )}
              </Box>
            } 
            sx={{ textTransform: "none", fontWeight: 600 }} 
          />
        </Tabs>

        <DialogContent sx={{ p: 3, height: "600px", maxHeight: "70vh", overflowY: "auto" }}>
          
          {/* TAB 0: DEĞER ATAMA */}
          {activeTab === 0 && (
            <Box sx={{ minHeight: "500px" }}>
              <Alert severity="info" sx={{ mb: 3 }} icon={false}>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  💡 Form açılırken otomatik değer atanacak alanları seçin
                </Typography>

              </Alert>

              <TableContainer component={Paper} variant="outlined" sx={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#f8f9fa" }}>
                      <TableCell width="30%" sx={{ fontWeight: 600, color: "#344767" }}>Alan Adı</TableCell>
                      <TableCell width="25%" sx={{ fontWeight: 600, color: "#344767" }}>Değer Tipi</TableCell>
                      <TableCell width="40%" sx={{ fontWeight: 600, color: "#344767" }}>Değer</TableCell>
                      <TableCell width="5%"></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {initRules.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 4, color: "text.secondary" }}>
                          Henüz kural eklenmedi. &quot;Yeni Kural Ekle&quot; butonuna tıklayın.
                        </TableCell>
                      </TableRow>
                    ) : (
                      initRules.map((rule, index) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            <Autocomplete
                              size="small"
                              value={formFields.find(f => f.name === rule.fieldName) || null}
                              onChange={(e, newValue) => handleUpdateRule(index, "fieldName", newValue?.name || "")}
                              options={formFields}
                              getOptionLabel={(option) => `${option.label} (${option.name})`}
                              renderInput={(params) => (
                                <TextField {...params} placeholder="Alan seçin..." variant="outlined" />
                              )}
                              renderOption={(props, option) => (
                                <li {...props} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "8px 16px" }}>
                                  <Typography variant="body2" fontWeight={600}>{option.label}</Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    {option.name} • {option.component || option.type}
                                  </Typography>
                                </li>
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
                              onChange={(e, newValue) => handleUpdateRule(index, "valueType", newValue?.value || "static")}
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
                                onChange={(e) => handleUpdateRule(index, "value", e.target.value)}
                                placeholder="Değer girin..."
                                variant="outlined"
                              />
                            ) : rule.valueType === "expression" ? (
                              <TextField
                                fullWidth
                                size="small"
                                value={rule.expression}
                                onChange={(e) => handleUpdateRule(index, "expression", e.target.value)}
                                placeholder='Örn: "TR-" + new Date().getFullYear()'
                                variant="outlined"
                              />
                            ) : rule.valueType === "currentUser" ? (
                              <FormControl fullWidth size="small">
                                <Select
                                  value={rule.userProperty || "fullName"}
                                  onChange={(e) => handleUpdateRule(index, "userProperty", e.target.value)}
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
                                sx={{ fontWeight: 500, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
                              />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteRule(index)} 
                              sx={{ color: "#ef5350", "&:hover": { backgroundColor: "#ffebee", color: "#d32f2f" } }}
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

              <Button
                startIcon={<AddIcon />}
                onClick={handleAddRule}
                variant="contained"
                color="primary"
                sx={{ 
                  mt: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "14px",
                  boxShadow: "0 2px 8px rgba(25, 118, 210, 0.3)",
                  "&:hover": { boxShadow: "0 4px 12px rgba(25, 118, 210, 0.4)" }
                }}
              >
                ➕ Yeni Kural Ekle
              </Button>
            </Box>
          )}

          {/* TAB 1: KOŞULLU ATAMA */}
          {activeTab === 1 && (
            <Box sx={{ minHeight: "500px" }}>
              <Alert severity="info" sx={{ mb: 3 }} icon={false}>
                <Typography variant="body2" fontWeight={600}>
                  🔀 Koşullu değer atama
                </Typography>
                <Typography variant="caption">
                  Eğer bir alan belirli bir değerse, başka bir alana otomatik değer ata.
                </Typography>
              </Alert>

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
                          value={formFields.find(f => f.name === rule.condition.field) || null}
                          onChange={(e, newValue) => handleUpdateConditionalRule(index, "condition.field", newValue?.name || "")}
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
                          value={formFields.find(f => f.name === rule.thenAction.fieldName) || null}
                          onChange={(e, newValue) => handleUpdateConditionalRule(index, "thenAction.fieldName", newValue?.name || "")}
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
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center", ml: 2, mt: 1, p: 2, backgroundColor: "#fff3e0", borderRadius: 1, border: "1px solid #ffe0b2" }}>
                          <Typography variant="body2" sx={{ minWidth: 60 }} color="warning.dark" fontWeight={600}>
                            → Değilse:
                          </Typography>
                          <Autocomplete
                            size="small"
                            sx={{ flex: 1 }}
                            value={formFields.find(f => f.name === rule.elseAction.fieldName) || null}
                            onChange={(e, newValue) => handleUpdateConditionalRule(index, "elseAction.fieldName", newValue?.name || "")}
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

              <Button
                startIcon={<AddIcon />}
                onClick={handleAddConditionalRule}
                variant="contained"
                color="secondary"
                sx={{ 
                  mt: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "14px",
                  boxShadow: "0 2px 8px rgba(156, 39, 176, 0.3)",
                  "&:hover": {
                    boxShadow: "0 4px 12px rgba(156, 39, 176, 0.4)"
                  }
                }}
              >
                ➕ Yeni Koşul Ekle
              </Button>
            </Box>
          )}

          {/* TAB 2: GÖRÜNÜRLÜK */}
          {activeTab === 2 && (
            <Box sx={{ minHeight: "500px" }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                👁️ Form açılırken hangi alanlar görünür/gizli olacak?
              </Alert>
              
              <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  startIcon={<EditIcon />}
                  onClick={() => {
                    const allVisible = {};
                    formFields.forEach(f => allVisible[f.name] = "visible");
                    setVisibilitySettings(allVisible);
                  }}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Tümü Düzenlenebilir
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  startIcon={<LockIcon />}
                  onClick={() => {
                    const allReadonly = {};
                    formFields.forEach(f => allReadonly[f.name] = "readonly");
                    setVisibilitySettings(allReadonly);
                  }}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Tümü Readonly
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<VisibilityOffIcon />}
                  onClick={() => {
                    const allHidden = {};
                    formFields.forEach(f => allHidden[f.name] = "hidden");
                    setVisibilitySettings(allHidden);
                  }}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Tümü Gizli
                </Button>
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
                        sx={{ fontWeight: 600 }}
                      />
                      <Chip 
                        icon={<LockIcon />}
                        label={`Readonly: ${Object.values(visibilitySettings).filter(v => v === "readonly").length}`}
                        color="warning"
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                      <Chip 
                        icon={<VisibilityOffIcon />}
                        label={`Gizli: ${Object.values(visibilitySettings).filter(v => v === false || v === "hidden").length}`}
                        color="error"
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: 2 }}>
                      {formFields.map(field => {
                        const state = getFieldState(field.name);
                        const bgColor = state === "hidden" ? "#ffebee" : state === "readonly" ? "#fff3e0" : "#e8f5e9";
                        const borderColor = state === "hidden" ? "#ef5350" : state === "readonly" ? "#ff9800" : "#66bb6a";
                        
                        return (
                          <Card 
                            key={field.name} 
                            variant="outlined"
                            sx={{ 
                              p: 2,
                              backgroundColor: bgColor,
                              borderColor: borderColor,
                              borderWidth: 2,
                              transition: "all 0.2s",
                              "&:hover": {
                                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                transform: "translateY(-2px)"
                              }
                            }}
                          >
                            <Box sx={{ mb: 1.5 }}>
                              <Typography variant="body2" fontWeight={700} sx={{ color: "#2c3e50" }}>
                                {field.label}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {field.name} • {field.component}
                              </Typography>
                            </Box>
                            
                            <ToggleButtonGroup
                              value={state}
                              exclusive
                              onChange={(e, newState) => {
                                if (newState !== null) {
                                  handleFieldStateChange(field.name, newState);
                                }
                              }}
                              size="small"
                              fullWidth
                            >
                              <ToggleButton 
                                value="visible" 
                                sx={{ 
                                  textTransform: "none",
                                  fontWeight: 600,
                                  fontSize: "11px",
                                  "&.Mui-selected": {
                                    backgroundColor: "#66bb6a",
                                    color: "white",
                                    "&:hover": {
                                      backgroundColor: "#57a55a"
                                    }
                                  }
                                }}
                              >
                                <EditIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                Düzenlenebilir
                              </ToggleButton>
                              <ToggleButton 
                                value="readonly"
                                sx={{ 
                                  textTransform: "none",
                                  fontWeight: 600,
                                  fontSize: "11px",
                                  "&.Mui-selected": {
                                    backgroundColor: "#ff9800",
                                    color: "white",
                                    "&:hover": {
                                      backgroundColor: "#f57c00"
                                    }
                                  }
                                }}
                              >
                                <LockIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                Readonly
                              </ToggleButton>
                              <ToggleButton 
                                value="hidden"
                                sx={{ 
                                  textTransform: "none",
                                  fontWeight: 600,
                                  fontSize: "11px",
                                  "&.Mui-selected": {
                                    backgroundColor: "#ef5350",
                                    color: "white",
                                    "&:hover": {
                                      backgroundColor: "#e53935"
                                    }
                                  }
                                }}
                              >
                                <VisibilityOffIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                Gizli
                              </ToggleButton>
                            </ToggleButtonGroup>
                          </Card>
                        );
                      })}
                    </Box>
                  </>
                )}
              </Paper>
            </Box>
          )}

          {/* TAB 3: BUTONLAR */}
          {activeTab === 3 && (
            <Box sx={{ minHeight: "500px" }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                🔘 Form açılırken hangi butonlar görünür olacak?
              </Alert>
              
              <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  startIcon={<VisibilityIcon />}
                  onClick={() => {
                    const allVisible = {};
                    formButtons.forEach(btn => allVisible[btn.id] = true);
                    setButtonVisibilitySettings(allVisible);
                  }}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Tümü Görünür
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<VisibilityOffIcon />}
                  onClick={() => {
                    const allHidden = {};
                    formButtons.forEach(btn => allHidden[btn.id] = false);
                    setButtonVisibilitySettings(allHidden);
                  }}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Tümü Gizli
                </Button>
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
                        sx={{ fontWeight: 600 }}
                      />
                      <Chip 
                        icon={<VisibilityOffIcon />}
                        label={`Gizli: ${Object.values(buttonVisibilitySettings).filter(v => v === false).length}`}
                        color="error"
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 2 }}>
                      {formButtons.map(button => {
                        const isVisible = buttonVisibilitySettings[button.id] !== false;
                        const bgColor = isVisible ? "#e8f5e9" : "#ffebee";
                        const borderColor = isVisible ? "#66bb6a" : "#ef5350";
                        
                        return (
                          <Card 
                            key={button.id} 
                            variant="outlined"
                            sx={{ 
                              p: 2,
                              backgroundColor: bgColor,
                              borderColor: borderColor,
                              borderWidth: 2,
                              transition: "all 0.2s",
                              "&:hover": {
                                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                transform: "translateY(-2px)"
                              }
                            }}
                          >
                            <Box sx={{ mb: 1.5 }}>
                              <Typography variant="body2" fontWeight={700} sx={{ color: "#2c3e50" }}>
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
                              <ToggleButton 
                                value="visible" 
                                sx={{ 
                                  textTransform: "none",
                                  fontWeight: 600,
                                  fontSize: "11px",
                                  "&.Mui-selected": {
                                    backgroundColor: "#66bb6a",
                                    color: "white",
                                    "&:hover": {
                                      backgroundColor: "#57a55a"
                                    }
                                  }
                                }}
                              >
                                <VisibilityIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                Görünür
                              </ToggleButton>
                              <ToggleButton 
                                value="hidden"
                                sx={{ 
                                  textTransform: "none",
                                  fontWeight: 600,
                                  fontSize: "11px",
                                  "&.Mui-selected": {
                                    backgroundColor: "#ef5350",
                                    color: "white",
                                    "&:hover": {
                                      backgroundColor: "#e53935"
                                    }
                                  }
                                }}
                              >
                                <VisibilityOffIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                Gizli
                              </ToggleButton>
                            </ToggleButtonGroup>
                          </Card>
                        );
                      })}
                    </Box>
                  </>
                )}
              </Paper>
            </Box>
          )}

          {/* SCRIPT ÖNİZLEME & TEST (Her tab'de) */}
          <Divider sx={{ my: 3 }} />
          
          {(initRules.length > 0 || conditionalRules.length > 0 || Object.values(visibilitySettings).some(v => v === "hidden" || v === "readonly" || v === false) || Object.values(buttonVisibilitySettings).some(v => v === false)) ? (
            <Box 
              sx={{ 
                mt: 3, 
                p: 2.5, 
                backgroundColor: "#f8f9fa",
                borderRadius: 2,
                border: "1px solid #e0e0e0",
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)"
              }}
            >
              <Typography variant="subtitle2" sx={{ color: "#344767", fontWeight: 600, mb: 1.5 }}>
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
                  color: "#2c3e50",
                  maxHeight: "200px",
                  overflowY: "auto",
                }}
              >
                {generateScript() || "// Henüz kural eklenmedi"}
              </Box>
            </Box>
          ) : (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                Script oluşturmak için yukarıdaki tab&apos;lerden kural ekleyin.
              </Typography>
              <Button
                variant="outlined"
                size="small"
                sx={{ mt: 2, textTransform: "none" }}
                onClick={() => {
                  if (activeTab === 0) handleAddRule();
                  else if (activeTab === 1) handleAddConditionalRule();
                }}
              >
                {activeTab === 0 ? "Değer Atama Kuralı Ekle" : "Koşullu Kural Ekle"}
              </Button>
            </Box>
          )}
        </DialogContent>

        <Box 
          sx={{ 
            p: 2.5, 
            borderTop: "1px solid #e0e0e0", 
            display: "flex", 
            gap: 1.5, 
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#fafafa"
          }}
        >
          {/* Sol: Test Et */}
          <Button
            startIcon={<PlayArrowIcon />}
            onClick={handleTestPreview}
            variant="contained"
            color="success"
            disabled={!formSchema || (initRules.length === 0 && conditionalRules.length === 0 && Object.values(visibilitySettings).every(v => v === "visible" || v === true || v === undefined))}
            sx={{ 
              textTransform: "none", 
              fontWeight: 700,
              fontSize: "15px",
              py: 1,
              minWidth: 140,
              boxShadow: "0 2px 8px rgba(76, 175, 80, 0.3)",
              "&:hover": {
                boxShadow: "0 4px 12px rgba(76, 175, 80, 0.4)"
              },
              "&:disabled": {
                backgroundColor: "#e0e0e0",
                color: "#999"
              }
            }}
          >
            🧪 Script Test Et
          </Button>
          
          {/* Sağ: İptal & Kaydet */}
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{ 
                textTransform: "none", 
                fontWeight: 600, 
                minWidth: 120,
                fontSize: "15px",
                py: 1,
                color: "#666",
                borderColor: "#ccc",
                "&:hover": {
                  borderColor: "#999",
                  backgroundColor: "#f5f5f5"
                }
              }}
            >
              ❌ İptal
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              sx={{ 
                textTransform: "none",
                fontWeight: 700,
                minWidth: 120,
                fontSize: "15px",
                py: 1,
              }}
            >
              💾 Kaydet
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* TEST PREVIEW MODAL */}
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
            sx={{ color: "white", "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" } }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 3 }}>
          <Alert severity="success" sx={{ mb: 3 }} icon={false}>
            <Typography variant="body2" fontWeight={600}>
              ✅ Script başarıyla çalıştırıldı! Aşağıda formun son halini görebilirsiniz.
            </Typography>
          </Alert>
          
          <Paper sx={{ p: 2, mb: 3, backgroundColor: "#f5f5f5" }} variant="outlined">
            <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ color: "#344767" }}>
              📊 Test Bilgileri:
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Typography variant="body2">
                <strong>👤 Kullanıcı:</strong> Test Kullanıcı
              </Typography>
              <Typography variant="body2">
                <strong>📅 Tarih:</strong> {new Date().toLocaleString("tr-TR")}
              </Typography>
              <Typography variant="body2">
                <strong>🔑 UUID:</strong> test-uuid-{Date.now()}
              </Typography>
            </Box>
          </Paper>

          {formSchema && (
            <Box sx={{ border: "2px solid #4caf50", borderRadius: 2, p: 3, backgroundColor: "#ffffff" }}>
              <FormProvider form={testForm}>
                <SchemaField schema={formSchema} />
              </FormProvider>
            </Box>
          )}
        </DialogContent>
        <Box sx={{ p: 2.5, borderTop: "1px solid #e0e0e0", display: "flex", justifyContent: "flex-end", backgroundColor: "#fafafa" }}>
          <Button 
            variant="contained" 
            color="success"
            onClick={() => setTestPreviewOpen(false)}
            sx={{ 
              textTransform: "none", 
              fontWeight: 600,
              minWidth: 120,
              fontSize: "15px"
            }}
          >
            ✅ Tamam
          </Button>
        </Box>
      </Dialog>
    </>
  );
};

export default FormNodeInitModal;
