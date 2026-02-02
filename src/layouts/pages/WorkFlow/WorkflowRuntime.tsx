import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { FormDataApi, WorkFlowApi, UserApi, WorkFlowStartApiDto, AlertNodeInfo, WorkFlowItemApi, WorkFlowItemDtoWithApproveItems } from "api/generated";
import getConfiguration from "confiuration";
import { showWorkflowAlert } from "./utils/workflowAlert";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { Button, Card, CardContent, Typography, Box, Drawer, IconButton, Chip, Avatar, Divider, Tooltip } from "@mui/material";
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot, TimelineOppositeContent } from "@mui/lab";
import { History as HistoryIcon, Close as CloseIcon, CheckCircle, Cancel, HourglassEmpty, Description, Person, CalendarToday } from "@mui/icons-material";

// Formily render
import "antd/dist/antd.css";
import { createForm } from "@formily/core";
import { FormProvider, createSchemaField } from "@formily/react";
import * as AntdFormily from "@formily/antd";
import { Button as AntButton, message, Card as AntdCard, Slider as AntdSlider, Rate as AntdRate } from "antd";
import * as Icons from "@ant-design/icons";
import { WorkFlowContiuneApiDto } from "api/generated";
import CurrencyInput from "../FormEditor/custom/CurrencyInput";

// Custom combobox components
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
} from "../FormEditor/custom/StandardComboboxes";


interface FormButton {
  id: string;
  label: string;
  type?: "primary" | "default" | "dashed" | "link" | "text";
  icon?: string;
  action?: string;
}

/**
 * ✅ Workflow Runtime Sayfası
 * 
 * Bu sayfa workflow instance'ını çalıştırır ve formu gösterir.
 * Form butonlarına göre workflow ilerletilir.
 */
export default function WorkflowRuntime(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schema, setSchema] = useState<any>(null);
  const [formName, setFormName] = useState<string>("");
  const [formButtons, setFormButtons] = useState<FormButton[]>([]);
  const [formData, setFormData] = useState<any>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null); // Tüm kullanıcı bilgisini sakla
  const scriptExecutedRef = useRef<boolean>(false); // Script'in çalıştırılıp çalıştırılmadığını takip et
  const [revision, setRevision] = useState<number | undefined>(undefined);
  const [publicationStatus, setPublicationStatus] = useState<number>(1);

  // Timeline state
  const [timelineOpen, setTimelineOpen] = useState<boolean>(false);
  const [historyData, setHistoryData] = useState<WorkFlowItemDtoWithApproveItems[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Workflow instance bilgisi (location.state'den gelir)
  const workflowInstance = location.state?.workflowInstance;
  const isNewInstance = location.state?.isNewInstance || false;
  const taskDetail = location.state?.taskDetail;

  const form = useMemo(() => createForm(), []);
  const SchemaField = useMemo(
    () => createSchemaField({ 
      components: { 
        ...(AntdFormily as any), 
        CurrencyInput, 
        Card: AntdCard, 
        Slider: AntdSlider, 
        Rate: AntdRate,
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
      } 
    }),
    []
  );

  /**
   * ✅ Schema'yı fieldScript'e göre modifiye et
   * Script'teki setFieldVisible çağrılarını analiz edip schema'yı modifiye eder
   * Bu sayede alanlar render edilmeden önce gizli olur (flash olmaz)
   */
  const applyScriptToSchema = (script: string, schema: any, formValues: any = {}): any => {
    if (!script || !script.trim() || !schema) {
      return schema;
    }

    try {
      // Script'teki setFieldVisible çağrılarını yakalamak için mock fonksiyonlar
      const visibilityMap: Record<string, boolean> = {};
      const readonlyMap: Record<string, boolean> = {};

      const setFieldVisible = (fieldKey: string, visible: boolean) => {
        visibilityMap[fieldKey] = visible;
      };

      const setFieldReadonly = (fieldKey: string, readonly: boolean) => {
        readonlyMap[fieldKey] = readonly;
      };

      const setFieldValue = (fieldKey: string, value: any) => {
        // Schema modifikasyonunda değer atama yapmıyoruz
        // Sadece script'in hata vermemesi için mock fonksiyon
        console.log(`🔧 applyScriptToSchema - setFieldValue çağrıldı: ${fieldKey} =`, value);
      };

      const getFieldValue = (fieldKey: string): any => {
        // Form values'dan değer oku
        return formValues[fieldKey];
      };

      // ✅ currentUser ve crypto mock'ları
      const currentUserObj = currentUser || { 
        userName: "Mock User",
        name: "Mock",
        surname: "User",
        firstName: "Mock",
        lastName: "User",
        fullName: "Mock User",
        email: ""
      };
      const cryptoObj = {
        randomUUID: () => {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        }
      };

      // Script'i çalıştır ve visibility/readonly map'lerini doldur
      const scriptFunction = new Function(
        "setFieldVisible",
        "setFieldReadonly",
        "setFieldValue",
        "getFieldValue",
        "formValues",
        "currentUser",
        "crypto",
        script
      );

      console.log("🚀 applyScriptToSchema - Script çalıştırılıyor...", {
        scriptPreview: script.substring(0, 150),
        formValuesKeys: Object.keys(formValues),
      });

      scriptFunction(
        setFieldVisible,
        setFieldReadonly,
        setFieldValue,
        getFieldValue,
        formValues,
        currentUserObj,
        cryptoObj
      );

      console.log("✅ applyScriptToSchema - Script çalıştırıldı, map'ler dolduruldu:", {
        visibilityMapSize: Object.keys(visibilityMap).length,
        readonlyMapSize: Object.keys(readonlyMap).length,
        visibilityMap,
        readonlyMap,
      });

      // Schema'yı modifiye et
      const modifiedSchema = JSON.parse(JSON.stringify(schema)); // Deep copy

      const applyToProperties = (properties: any, path: string = "") => {
        if (!properties) return;

        Object.keys(properties).forEach(key => {
          const prop = properties[key];
          const fieldPath = path ? `${path}.${key}` : key;

          // Visibility kontrolü
          if (visibilityMap.hasOwnProperty(fieldPath) || visibilityMap.hasOwnProperty(key)) {
            const visible = visibilityMap[fieldPath] ?? visibilityMap[key];
            if (!visible) {
              prop["x-display"] = "hidden";
            } else {
              prop["x-display"] = "visible";
            }
          }

          // Readonly kontrolü
          if (readonlyMap.hasOwnProperty(fieldPath) || readonlyMap.hasOwnProperty(key)) {
            const readonly = readonlyMap[fieldPath] ?? readonlyMap[key];
            if (readonly) {
              prop["x-pattern"] = "readOnly";
            } else {
              prop["x-pattern"] = "editable";
            }
          }

          // Nested properties varsa recursive olarak işle
          if (prop.properties) {
            applyToProperties(prop.properties, fieldPath);
          }
        });
      };

      if (modifiedSchema.properties) {
        applyToProperties(modifiedSchema.properties);
      }

      console.log("✅ Schema fieldScript'e göre modifiye edildi (applyScriptToSchema)", {
        visibilityMap,
        readonlyMap,
        modifiedSchemaKeys: Object.keys(modifiedSchema.properties || {}),
      });
      return modifiedSchema;
    } catch (error) {
      console.error("❌ Schema modifikasyonu sırasında hata:", error);
      return schema; // Hata durumunda orijinal schema'yı döndür
    }
  };

  /**
   * ✅ FieldScript'i çalıştır
   * FormTaskNode'dan gelen fieldScript'i çalıştırır ve form alanlarını kontrol eder
   */
  const executeFieldScript = (script: string, formInstance: any) => {
    if (!script || !script.trim() || !formInstance) {
      console.log("⚠️ FieldScript çalıştırılamıyor:", {
        hasScript: !!script,
        scriptTrimmed: script?.trim().length || 0,
        hasFormInstance: !!formInstance,
      });
      return;
    }

    console.log("▶️ executeFieldScript başladı:", {
      scriptPreview: script.substring(0, 100) + "...",
      scriptLength: script.length,
      formInstanceMounted: formInstance.mounted,
      formInstanceFields: formInstance.fields ? Object.keys(formInstance.fields) : [],
      formInstanceValuesKeys: formInstance.values ? Object.keys(formInstance.values) : [],
    });

    try {
      // Formily form instance'ından helper fonksiyonları oluştur
      const setFieldVisible = (fieldKey: string, visible: boolean) => {
        try {
          const field = formInstance.query(fieldKey).take();
          if (field) {
            // Formily'de display property'si ile görünürlük kontrol edilir
            if (visible) {
              field.setDisplay("visible");
              console.log(`✅ setFieldVisible: ${fieldKey} = visible`, field);
            } else {
              field.setDisplay("hidden");
              console.log(`✅ setFieldVisible: ${fieldKey} = hidden`, field);
            }
          } else {
            console.warn(`⚠️ setFieldVisible - Field bulunamadı: ${fieldKey}`);
          }
        } catch (error) {
          console.warn(`⚠️ setFieldVisible hatası (${fieldKey}):`, error);
        }
      };

      const setFieldReadonly = (fieldKey: string, readonly: boolean) => {
        try {
          const field = formInstance.query(fieldKey).take();
          if (field) {
            if (readonly) {
              field.setPattern("readOnly");
              console.log(`✅ setFieldReadonly: ${fieldKey} = readOnly`, field);
            } else {
              field.setPattern("editable");
              console.log(`✅ setFieldReadonly: ${fieldKey} = editable`, field);
            }
          } else {
            console.warn(`⚠️ setFieldReadonly - Field bulunamadı: ${fieldKey}`);
          }
        } catch (error) {
          console.warn(`⚠️ setFieldReadonly hatası (${fieldKey}):`, error);
        }
      };

      const setFieldValue = (fieldKey: string, value: any) => {
        try {
          console.log(`🔧 setFieldValue çağrıldı: ${fieldKey} =`, value, `(type: ${typeof value})`);
          
          // Önce field'ı bul
          let field = formInstance.query(fieldKey).take();
          
          if (field) {
            // Field bulunduysa, hem initialValue hem de value'yu set et
            field.setInitialValue(value);
            field.setValue(value);
            
            // Radio button için bazen UI update olmaz, onInput ile trigger et
            const componentName = field.component?.[0] || field.componentType || '';
            if (componentName.includes('Radio') || componentName === 'Radio.Group') {
              field.onInput(value);
              console.log(`🔘 Radio component için onInput tetiklendi: ${fieldKey} (${componentName})`);
            }
            
            console.log(`✅ setFieldValue (field.setValue): ${fieldKey} =`, value, {
              fieldType: field.component?.[0] || field.componentType,
              fieldDisplay: field.display,
              fieldPattern: field.pattern,
              currentValue: field.value,
              initialValue: field.initialValue,
            });
          } else {
            // Field bulunamadıysa, hem initialValues hem values'ı set et
            console.warn(`⚠️ setFieldValue - Field query ile bulunamadı: ${fieldKey}`);
            console.log(`Mevcut field'lar:`, Object.keys(formInstance.fields || {}));
            
            // Hem initial hem current value'yu set et
            const updates = { [fieldKey]: value };
            formInstance.setInitialValues(updates);
            formInstance.setValues(updates);
            console.log(`✅ setFieldValue (formInstance.setInitialValues + setValues): ${fieldKey} =`, value);
            
            // Radio button'lar için biraz bekleyip field mount olduktan sonra tekrar dene
            setTimeout(() => {
              const delayedField = formInstance.query(fieldKey).take();
              if (delayedField) {
                delayedField.setInitialValue(value);
                delayedField.setValue(value);
                
                // Radio button için onInput tetikle
                const componentName = delayedField.component?.[0] || delayedField.componentType || '';
                if (componentName.includes('Radio') || componentName === 'Radio.Group') {
                  delayedField.onInput(value);
                  console.log(`🔘 Radio component için onInput tetiklendi (delayed): ${fieldKey} (${componentName})`);
                }
                
                console.log(`✅ setFieldValue (delayed field.setValue): ${fieldKey} =`, value, {
                  fieldType: delayedField.component?.[0],
                  currentValue: delayedField.value,
                });
              } else {
                console.warn(`⚠️ Field hala mount olmadı: ${fieldKey}`);
              }
            }, 100);
          }
        } catch (error) {
          console.error(`❌ setFieldValue hatası (${fieldKey}):`, error);
          console.error("Hata detayı:", {
            fieldKey,
            value,
            valueType: typeof value,
            formInstanceFields: formInstance.fields ? Object.keys(formInstance.fields) : "yok",
            formValues: formInstance.values,
          });
        }
      };

      const getFieldValue = (fieldKey: string): any => {
        try {
          const value = formInstance.getFieldValue(fieldKey);
          console.log(`📖 getFieldValue: ${fieldKey} =`, value);
          return value;
        } catch (error) {
          console.warn(`⚠️ getFieldValue hatası (${fieldKey}):`, error);
          return undefined;
        }
      };

      // Form values'ı global değişken olarak erişilebilir yap
      const formValues = formInstance.values || {};

      // ✅ currentUser ve crypto (initScript için gerekli)
      const currentUserObj = currentUser || { 
        userName: "Kullanıcı",
        name: "Kullanıcı",
        surname: "",
        firstName: "Kullanıcı",
        lastName: "",
        fullName: "Kullanıcı",
        email: ""
      };
      
      console.log("👤 Script'te kullanılan currentUser:", {
        hasRealUser: !!currentUser,
        currentUserObj,
      });
      const cryptoObj = {
        randomUUID: () => {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        }
      };

      // Script'i güvenli bir şekilde çalıştır
      // Function constructor kullanarak script'i çalıştırıyoruz
      const scriptFunction = new Function(
        "setFieldVisible",
        "setFieldReadonly",
        "setFieldValue",
        "getFieldValue",
        "formValues",
        "currentUser",
        "crypto",
        script
      );

      console.log("🚀 Script çalıştırılıyor...");
      scriptFunction(
        setFieldVisible,
        setFieldReadonly,
        setFieldValue,
        getFieldValue,
        formValues,
        currentUserObj,
        cryptoObj
      );
      console.log("✅ Script başarıyla çalıştırıldı");
      
      // Script çalıştıktan sonra form durumunu kontrol et
      setTimeout(() => {
        console.log("📊 Script sonrası form durumu:", {
          formValues: formInstance.values,
          formFields: formInstance.fields ? Object.keys(formInstance.fields).map(key => ({
            key,
            value: formInstance.fields[key].value,
            initialValue: formInstance.fields[key].initialValue,
            component: formInstance.fields[key].component?.[0],
          })) : [],
        });
      }, 150);
    } catch (error) {
      console.error("❌ FieldScript çalıştırılırken hata:", error);
      console.error("❌ Script içeriği:", script);
    }
  };

  // Kullanıcı bilgisini yükle
  useEffect(() => {
    const loadUser = async () => {
      try {
        const conf = getConfiguration();
        const userApi = new UserApi(conf);
        const userResponse = await userApi.apiUserGetLoginUserDetailGet();
        
        // Tüm kullanıcı bilgisini sakla
        const userData = userResponse.data;
        const fullName = `${userData?.firstName || ""} ${userData?.lastName || ""}`.trim();
        
        setCurrentUser({
          userName: userData?.userName || "",
          name: userData?.firstName || "",
          surname: userData?.lastName || "",
          firstName: userData?.firstName || "",
          lastName: userData?.lastName || "",
          fullName: fullName || userData?.userName || "",
          email: userData?.email || "",
          // Diğer tüm alanları da sakla
          ...userData,
        });
        
        console.log("👤 Kullanıcı bilgisi yüklendi:", {
          userName: userData?.userName,
          firstName: userData?.firstName,
          lastName: userData?.lastName,
          fullName: fullName,
          email: userData?.email,
        });
      } catch (err) {
        console.warn("⚠️ Kullanıcı bilgisi yüklenemedi:", err);
        // Kullanıcı bilgisi yüklenemedi - boş obje set et
        setCurrentUser({ userName: "", name: "", surname: "", fullName: "", email: "" });
      }
    };
    loadUser();
  }, []);

  // Workflow history'yi yükle
  const loadWorkflowHistory = async () => {
    const workflowHeadId = workflowInstance?.id || id;
    if (!workflowHeadId || workflowHeadId === "new") {
      return;
    }

    setLoadingHistory(true);
    try {
      const conf = getConfiguration();
      const workflowItemApi = new WorkFlowItemApi(conf);
      const response = await workflowItemApi.apiWorkFlowItemGetApproveItemsWorkFlowHeadIdGet(workflowHeadId);

      // Tarihe göre sırala (en yeni en üstte)
      const sortedData = (response.data || []).sort((a, b) => {
        const dateA = a.approveItems?.[0]?.createdDate ? new Date(a.approveItems[0].createdDate).getTime() : 0;
        const dateB = b.approveItems?.[0]?.createdDate ? new Date(b.approveItems[0].createdDate).getTime() : 0;
        return dateB - dateA;
      });

      setHistoryData(sortedData);
    } catch (error) {
      console.error("History yüklenirken hata:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Timeline açıldığında history'yi yükle
  useEffect(() => {
    if (timelineOpen) {
      loadWorkflowHistory();
    }
  }, [timelineOpen]);

  useEffect(() => {
    const load = async () => {
      if (!workflowInstance?.formId) {
        setError("Workflow instance bilgisi bulunamadı");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const conf = getConfiguration();
        const formApi = new FormDataApi(conf);

        // Form bilgisini çek
        const response = await formApi.apiFormDataIdGet(workflowInstance.formId);
        const form = response.data;

        if (!form?.formDesign) {
          setError("Form tasarımı bulunamadı");
          setLoading(false);
          return;
        }

        setFormName(form.formName || "İsimsiz Form");
        if (typeof form.revision === "number") setRevision(form.revision);
        if (typeof form.publicationStatus === "number") setPublicationStatus(form.publicationStatus);

        // Form design'ı parse et
        const parsed = typeof form.formDesign === "string"
          ? JSON.parse(form.formDesign)
          : form.formDesign;


        // Schema'yı oluştur
        let finalSchema = parsed.schema;
        if (!finalSchema) {
          // Eski format için schema oluştur
          finalSchema = {
            type: "object",
            properties: {},
          };
        }



        // ✅ Script'i belirle (initScript veya fieldScript)
        // Yeni workflow ise initScript (FormNode), devam eden ise fieldScript (FormTaskNode)

        console.log("🔍 WorkflowInstance kontrolü:", {
          isNewInstance,
          hasWorkflowInstance: !!workflowInstance,
          workflowInstanceKeys: workflowInstance ? Object.keys(workflowInstance) : [],
          initScript: (workflowInstance as any)?.initScript?.substring(0, 100),
        });

        const initScript = isNewInstance ? (workflowInstance as any)?.initScript : null;
        const fieldScript = !isNewInstance ? taskDetail?.nodeScript : null;
        const activeScript = initScript || fieldScript;


        alert(activeScript);

        console.log("🔍 Script kontrolü:", {
          isNewInstance,
          hasInitScript: !!initScript,
          hasFieldScript: !!fieldScript,
          usingScript: initScript ? "initScript (FormNode)" : fieldScript ? "fieldScript (FormTaskNode)" : "none",
          scriptLength: activeScript?.length || 0,
        });

        if (activeScript && activeScript.trim()) {
          // FormData henüz yüklenmemiş olabilir, ama varsa kullan
          // workflowInstance veya taskDetail'den formData'yı al
          let initialFormValues: any = {};
          try {
            const incomingFormData = workflowInstance?.formData || taskDetail?.formData;
            if (incomingFormData) {
              const parsed = typeof incomingFormData === "string"
                ? JSON.parse(incomingFormData)
                : incomingFormData;
              if (parsed && typeof parsed === "object") {
                initialFormValues = parsed.formData && typeof parsed.formData === "object"
                  ? parsed.formData
                  : parsed.formData && typeof parsed.formData === "string"
                    ? JSON.parse(parsed.formData)
                    : parsed;
              }
            }
          } catch (e) {
            // FormData parse edilemezse boş obje kullan
            console.warn("⚠️ FormData parse edilemedi, boş obje kullanılıyor");
          }

          try {
            console.log("🔧 Script schema'ya uygulanıyor...", {
              scriptType: initScript ? "initScript" : "fieldScript",
              scriptLength: activeScript.length,
              scriptPreview: activeScript.substring(0, 200),
              hasInitialFormValues: Object.keys(initialFormValues).length > 0,
              initialFormValues,
            });
            finalSchema = applyScriptToSchema(activeScript, finalSchema, initialFormValues);
            console.log("✅ Schema script'e göre modifiye edildi (flash önlendi)", {
              scriptType: initScript ? "initScript" : "fieldScript",
            });
          } catch (error) {
            console.warn("⚠️ Schema modifikasyonu sırasında hata, orijinal schema kullanılıyor:", error);
          }
        }

        setSchema(finalSchema);

        // Button panel'i yükle
        if (parsed.buttonPanel?.buttons && Array.isArray(parsed.buttonPanel.buttons)) {
          setFormButtons(parsed.buttonPanel.buttons);
        }

      } catch (err: any) {
        let errorMsg = "Form yüklenirken bir hata oluştu";

        if (err.response) {
          errorMsg = err.response.data?.message || err.response.data || errorMsg;
        } else if (err.message) {
          errorMsg = err.message;
        }

        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [workflowInstance?.formId, isNewInstance, (workflowInstance as any)?.initScript, taskDetail?.fieldScript]);

  // ✅ FormData'yı location.state'den al ve form'a initial values olarak ver
  // Schema yüklendikten SONRA formData'yı set et (Formily için önemli)
  useEffect(() => {
    // FormData kaynakları: workflowInstance.formData veya taskDetail.formData
    const incomingFormData = workflowInstance?.formData || taskDetail?.formData;

    console.log("🔍 FormData kontrolü:", {
      hasIncomingFormData: !!incomingFormData,
      hasForm: !!form,
      hasSchema: !!schema,
      loading,
      incomingFormData,
    });

    // Schema yüklenmiş ve formData varsa form'a yükle
    if (incomingFormData && form && schema && !loading) {
      try {
        // Eğer formData string ise parse et, değilse direkt kullan
        const parsedFormData = typeof incomingFormData === "string"
          ? JSON.parse(incomingFormData)
          : incomingFormData;

        console.log("📦 Parsed FormData:", parsedFormData);

        if (parsedFormData && typeof parsedFormData === "object") {
          // ✅ FormData nested yapıda olabilir (formData.formData içinde asıl veriler)
          // Eğer formData içinde formData property'si varsa, onu kullan
          let actualFormData = parsedFormData;

          if (parsedFormData.formData && typeof parsedFormData.formData === "object") {
            // Nested yapı: formData.formData içindeki verileri kullan
            actualFormData = parsedFormData.formData;
            console.log("📦 Nested FormData bulundu, içindeki veriler kullanılıyor:", actualFormData);
          } else if (parsedFormData.formData && typeof parsedFormData.formData === "string") {
            // Eğer formData.formData string ise parse et
            try {
              actualFormData = JSON.parse(parsedFormData.formData);
              console.log("📦 FormData.formData string parse edildi:", actualFormData);
            } catch (e) {
              console.warn("⚠️ FormData.formData parse edilemedi, orijinal kullanılıyor");
            }
          }

          // Formily form'una initial values olarak set et
          // Formily'de form values'ları set etmek için setValues kullanılır
          if (actualFormData && typeof actualFormData === "object") {
            form.setInitialValues(actualFormData);
            form.setValues(actualFormData);

            setFormData(actualFormData);
            console.log("✅ FormData form'a yüklendi:", actualFormData);
            console.log("✅ Form values kontrolü:", form.values);
            console.log("✅ Form initialValues kontrolü:", form.initialValues);

            // Form'un güncellendiğinden emin olmak için bir sonraki render'da kontrol et
            setTimeout(() => {
              console.log("⏰ 100ms sonra form values:", form.values);
              console.log("⏰ Form'un tüm field'ları:", Object.keys(form.values || {}));
            }, 100);
          } else {
            console.warn("⚠️ ActualFormData geçerli bir obje değil:", actualFormData);
          }
        } else {
          console.warn("⚠️ FormData geçerli bir obje değil:", parsedFormData);
        }
      } catch (error) {
        console.error("❌ FormData parse edilirken hata:", error);
        console.error("❌ FormData içeriği:", incomingFormData);
      }
    } else if (incomingFormData && (!schema || loading)) {
      console.log("⏳ FormData var ama schema henüz yüklenmedi, bekleniyor...");
    }
  }, [workflowInstance?.formData, taskDetail?.formData, form, schema, loading]);

  // ✅ Script'i çalıştır - FormData yüklendikten sonra (değer atamaları için)
  // Not: Visibility kontrolleri schema yüklenirken yapıldı (flash önleme)
  // Burada sadece değer atamaları ve dinamik kontroller yapılır
  useEffect(() => {
    // Script'i belirle (initScript veya fieldScript)
    const initScript = isNewInstance ? (workflowInstance as any)?.initScript : null;
    const fieldScript = !isNewInstance ? taskDetail?.fieldScript : null;
    const activeScript = initScript || fieldScript;

    // Yeni bir script geldiğinde ref'i sıfırla
    if (activeScript) {
      scriptExecutedRef.current = false;
    }

    // Script zaten çalıştırıldıysa tekrar çalıştırma
    if (scriptExecutedRef.current) {
      return;
    }

    // Script yoksa veya form/schema hazır değilse çık
    if (!activeScript || !activeScript.trim() || !form || !schema || loading) {
      return;
    }

    // ✅ currentUser yüklenene kadar bekle (API'den geliyor)
    if (!currentUser) {
      console.log("⏳ currentUser henüz yüklenmedi, script bekliyor...");
      return;
    }

    // FormData yüklenene kadar bekle (form.values hazır olmalı)
    // formData state'i set edildikten sonra script'i çalıştır
    const timeout = setTimeout(() => {
      const formValues = form.values;
      const formFields = form.fields;
      const formMounted = form.mounted;
      
      console.log("⏰ Script çalıştırma kontrolü:", {
        formMounted,
        hasFormValues: !!formValues,
        formValuesLength: formValues ? Object.keys(formValues).length : 0,
        hasFormFields: !!formFields,
        formFieldsLength: formFields ? Object.keys(formFields).length : 0,
        hasCurrentUser: !!currentUser,
        currentUserName: currentUser?.fullName,
        isNewInstance,
      });
      
      // Form mount olmamışsa biraz daha bekle
      if (!formMounted) {
        console.log("⏳ Form henüz mount olmadı, 300ms daha bekleniyor...");
        setTimeout(() => {
          console.log("🔧 Form mount kontrolü (delayed):", {
            formMounted: form.mounted,
            formFieldsLength: form.fields ? Object.keys(form.fields).length : 0,
          });
          if (form.mounted) {
            executeFieldScript(activeScript, form);
            scriptExecutedRef.current = true;
            console.log("✅ Script başarıyla çalıştırıldı (delayed)!");
          } else {
            // Hala mount olmamışsa son bir deneme daha
            console.log("⏳ Form hala mount olmadı, 300ms daha bekleniyor (son deneme)...");
            setTimeout(() => {
              executeFieldScript(activeScript, form);
              scriptExecutedRef.current = true;
              console.log("✅ Script başarıyla çalıştırıldı (final attempt)!");
            }, 300);
          }
        }, 300);
        return;
      }
      
      // FormData yüklenmişse script'i çalıştır (değer atamaları için)
      // Visibility zaten schema'da ayarlandı, burada sadece dinamik kontroller yapılır

      // Yeni workflow için form boş başlayabilir, beklemeden çalıştır
      const shouldExecute = isNewInstance || (formValues && Object.keys(formValues).length > 0);

      if (shouldExecute) {
        console.log("🔧 Script çalıştırılıyor (runtime)...", {
          scriptType: initScript ? "initScript (FormNode)" : "fieldScript (FormTaskNode)",
          scriptLength: activeScript.length,
          scriptPreview: activeScript.substring(0, 200),
          formValuesKeys: formValues ? Object.keys(formValues) : [],
          formFieldsKeys: formFields ? Object.keys(formFields) : [],
          isNewInstance,
        });
        executeFieldScript(activeScript, form);
        scriptExecutedRef.current = true; // Script çalıştırıldı olarak işaretle
        console.log("✅ Script başarıyla çalıştırıldı!");
      } else {
        // FormData henüz yüklenmemiş, tekrar dene
        console.log("⏳ FormData henüz yüklenmedi, script çalıştırma erteleniyor...", {
          formValuesLength: formValues ? Object.keys(formValues).length : 0,
          hasFormValues: !!formValues,
        });
      }
    }, 500); // Form mount olması için daha fazla bekleme (radio button'lar geç render olabilir)

    return () => clearTimeout(timeout);
  }, [isNewInstance, (workflowInstance as any)?.initScript, taskDetail?.fieldScript, form, schema, loading, formData, currentUser]);

  /**
   * ✅ Form butonuna tıklandığında - Backend'e workflow başlatma isteği gönder
   * BMP Modülü için: Hangi butondan tıklandıysa o butonun action kodu gönderilir
   * 
   * Eğer instance ID varsa (devam eden workflow), continue eder
   * Eğer instance ID yoksa (yeni workflow), start eder
   */
  const handleButtonClick = async (button: FormButton) => {
    if (submitting) {
      return; // Çift tıklamayı önle
    }

    // ✅ Action kod kontrolü - BMP modülü için zorunlu
    if (!button.action || !button.action.trim()) {
      message.error("Bu buton için Action Code tanımlanmamış! Lütfen form tasarımcısında Action Code ekleyin.", 5);
      return;
    }

    try {
      setSubmitting(true);

      // Form validasyonu
      await form.validate();
      const formValues = form.values;

      // ✅ Workflow ID kontrolü
      if (!workflowInstance?.workflowId) {
        throw new Error("Workflow ID bulunamadı");
      }

      const conf = getConfiguration();
      const workflowApi = new WorkFlowApi(conf);

      // ✅ BMP Modülü için: Action kodunu normalize et (büyük harf, underscore ile ayır)
      const normalizedAction = button.action.trim().toUpperCase().replace(/\s+/g, "_");

      // ✅ WorkFlowInfo oluştur (defination dahil)
      const workFlowInfo = JSON.stringify({
        formData: formValues,
        buttonAction: normalizedAction, // ✅ BMP modülü için normalize edilmiş action kodu
        buttonLabel: button.label,
        formId: workflowInstance.formId,
        defination: workflowInstance.defination || null, // ✅ Defination'ı da gönder
        timestamp: new Date().toISOString(),
      });

      // ✅ Instance ID kontrolü - Varsa continue, yoksa start
      const instanceId = id && id !== "new" ? id : workflowInstance?.id;

      if (instanceId && instanceId !== "new") {
        // ✅ Mevcut instance varsa - Workflow devam ettir
        const continueDto: WorkFlowContiuneApiDto = {
          workFlowItemId: instanceId,
          userName: currentUser?.userName || undefined,
          formData: workFlowInfo, // ✅ input yerine formData kullanılıyor
          action: normalizedAction, // ✅ action property'sine eklendi
          note: normalizedAction,
        };

        const response = await workflowApi.apiWorkFlowContiunePost(continueDto);

        if (!response || !response.data) {
          throw new Error("Backend'den geçersiz yanıt alındı");
        }

        const result = response.data;

        // ✅ Response'dan gelen alertInfo varsa göster ve formu kapatma (uyarı mesajı)
        if (result.alertInfo) {
          const alertInfo: AlertNodeInfo = result.alertInfo;
          showWorkflowAlert({
            title: alertInfo.title || "Bildirim",
            message: alertInfo.message || "Mesaj yok",
            type: (alertInfo.type as any) || "info",
          });
          // ✅ alertInfo geldiğinde formu kapatma, kullanıcı mesajı görsün ve form açık kalsın
          setSubmitting(false);
          return;
        } else {
          // Alert yoksa normal başarı mesajı göster
          message.success(
            `${button.label} butonuna tıklandı (Action: ${normalizedAction}). Workflow devam ediyor.`,
            3
          );
        }
      } else {
        // ✅ Yeni instance - Workflow başlat
        const startDto: WorkFlowStartApiDto = {
          definationId: workflowInstance.workflowId,
          userName: currentUser?.userName || undefined,
          workFlowInfo: workFlowInfo,
          action: normalizedAction, // ✅ BMP modülü için action kodu (doğrudan alan olarak)
          formData: JSON.stringify(formValues) || "{}", // ✅ Form verileri (null olmaması için boş obje)
        };

        const response = await workflowApi.apiWorkFlowStartPost(startDto);

        if (!response || !response.data) {
          throw new Error("Backend'den geçersiz yanıt alındı");
        }

        const result = response.data;

        // ✅ Response'dan gelen alertInfo varsa göster ve formu kapatma (uyarı mesajı)
        if (result.alertInfo) {
          const alertInfo: AlertNodeInfo = result.alertInfo;
          showWorkflowAlert({
            title: alertInfo.title || "Bildirim",
            message: alertInfo.message || "Mesaj yok",
            type: (alertInfo.type as any) || "info",
          });
          // ✅ alertInfo geldiğinde formu kapatma, kullanıcı mesajı görsün ve form açık kalsın
          setSubmitting(false);
          return;
        } else {
          // Alert yoksa normal başarı mesajı göster
          message.success(
            `${button.label} butonuna tıklandı (Action: ${normalizedAction}). Workflow başlatıldı.`,
            3
          );
        }

        // ✅ Response'dan gelen diğer bilgileri logla (gerekirse)
        // result.workFlowStatus - Workflow durumu
        // result.pendingNodeId - Bekleyen node ID
        // result.formNodeCompleted - Form node tamamlandı mı
        // result.completedFormNodeId - Tamamlanan form node ID

        // Yeni instance ID ile görevlerim sayfasına yönlendir
        setTimeout(() => {
          navigate("/workflows/my-tasks", {
            state: {
              newInstanceId: result.id,
              buttonAction: normalizedAction,
              workflowStatus: result.workFlowStatus,
              pendingNodeId: result.pendingNodeId,
            },
          });
        }, 1500);
        return;
      }

      // Görevlerim sayfasına yönlendir (continue durumu için)
      setTimeout(() => {
        navigate("/workflows/my-tasks", {
          state: {
            buttonAction: normalizedAction,
          },
        });
      }, 1500);
    } catch (error: any) {
      // ✅ Detaylı hata mesajı oluştur
      let errorMessage = "Workflow başlatılırken bir hata oluştu";

      if (error.response) {
        // Backend'den gelen hata
        const responseData = error.response.data;

        if (responseData?.message) {
          errorMessage = responseData.message;
        } else if (typeof responseData === "string") {
          errorMessage = responseData;
        } else if (responseData?.errors && Array.isArray(responseData.errors)) {
          errorMessage = `Validasyon hataları: ${responseData.errors.join(", ")}`;
        } else if (responseData?.title) {
          errorMessage = responseData.title;
        }

        // HTTP status koduna göre ek bilgi
        const status = error.response.status;
        if (status === 400) {
          errorMessage = `Geçersiz istek: ${errorMessage}`;
        } else if (status === 401) {
          errorMessage = "Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.";
        } else if (status === 403) {
          errorMessage = "Bu işlem için yetkiniz bulunmuyor.";
        } else if (status === 404) {
          errorMessage = "Workflow tanımı bulunamadı.";
        } else if (status === 500) {
          errorMessage = `Sunucu hatası: ${errorMessage}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Kullanıcıya detaylı hata mesajı göster
      message.error(
        `❌ ${errorMessage}\n\nButon: ${button.label}\nAction: ${button.action || "Tanımlı değil"}`,
        8
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox my={3}>
          <Card>
            <CardContent sx={{ textAlign: "center", py: 4 }}>
              <Typography>Form yükleniyor...</Typography>
            </CardContent>
          </Card>
        </MDBox>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox my={3}>
          <Card>
            <CardContent sx={{ textAlign: "center", py: 4 }}>
              <Typography color="error">{error}</Typography>
              <Button onClick={() => navigate("/workflows/my-tasks")} sx={{ mt: 2 }}>
                Geri Dön
              </Button>
            </CardContent>
          </Card>
        </MDBox>
      </DashboardLayout>
    );
  }

  return (
    <>
      {/* Footer'ı gizle ve scroll bar sorununu çöz */}
      {/* Formily Form CSS Stilleri */}
      <style>{`
        footer,
        [class*="Footer"],
        [id*="footer"] {
          display: none !important;
        }
        body {
          overflow-x: hidden !important;
        }
        html {
          overflow-x: hidden !important;
        }

        /* Formily Form Container Stilleri */
        .ant-form {
          width: 100%;
          max-width: 100%;
        }

        .ant-form-item {
          margin-bottom: 16px !important;
        }

        .ant-form-item-label {
          padding-bottom: 4px !important;
        }

        .ant-form-item-label > label {
          font-size: 14px !important;
          font-weight: 600 !important;
        }

        /* Input, Select, TextArea Stilleri */
        .ant-input,
        .ant-input-number,
        .ant-input-password,
        .ant-picker,
        .ant-select-selector,
        .ant-input-number-input,
        textarea.ant-input {
          border-radius: 4px !important;
          padding: 8px 12px !important;
          font-size: 14px !important;
        }

        .ant-input:focus,
        .ant-input-number:focus,
        .ant-input-password:focus,
        .ant-picker-focused,
        .ant-select-focused .ant-select-selector,
        textarea.ant-input:focus {
          outline: none !important;
        }

        /* Select Dropdown Stilleri */
        .ant-select {
          width: 100% !important;
        }

        .ant-select-selector {
          min-height: 42px !important;
          display: flex !important;
          align-items: center !important;
        }

        .ant-select-selection-item {
          line-height: 40px !important;
        }

        /* TextArea Stilleri */
        textarea.ant-input {
          min-height: 100px !important;
          resize: vertical !important;
        }

        /* DatePicker Stilleri */
        .ant-picker {
          width: 100% !important;
          height: 42px !important;
        }

        /* InputNumber Stilleri */
        .ant-input-number {
          width: 100% !important;
        }

        .ant-input-number-input {
          height: 100% !important;
        }

        /* Checkbox ve Radio Stilleri */
        .ant-checkbox-wrapper,
        .ant-radio-wrapper {
          font-size: 14px !important;
          margin-bottom: 4px !important;
        }

        /* Upload Stilleri */
        .ant-upload {
          width: 100% !important;
        }

        .ant-upload.ant-upload-drag {
          border-radius: 4px !important;
        }

        /* Rate Component Stilleri */
        .ant-rate {
          font-size: 20px !important;
        }

        /* Slider Stilleri */
        .ant-slider {
          margin: 16px 0 !important;
        }

        /* Card Component Stilleri */
        .ant-card {
          border-radius: 4px !important;
          margin-bottom: 16px !important;
        }

        .ant-card-head {
          padding: 12px 16px !important;
        }

        .ant-card-head-title {
          font-size: 16px !important;
          font-weight: 600 !important;
        }

        .ant-card-body {
          padding: 16px !important;
        }

        /* Form Item Help Text */
        .ant-form-item-explain-error {
          color: #ef4444 !important;
          font-size: 12px !important;
          margin-top: 4px !important;
        }

        .ant-form-item-explain-success {
          color: #10b981 !important;
          font-size: 12px !important;
          margin-top: 4px !important;
        }

        /* Form Grid Layout */
        .ant-row {
          margin-left: -4px !important;
          margin-right: -4px !important;
        }

        .ant-col {
          padding-left: 4px !important;
          padding-right: 4px !important;
        }

        /* Button Group Stilleri */
        .ant-btn-group {
          display: flex !important;
          gap: 4px !important;
        }

        /* Switch Stilleri - default */

        /* Cascader Stilleri */
        .ant-cascader-picker {
          width: 100% !important;
        }

        /* Form Item Spacing - Vertical Layout */

        /* Readonly ve Disabled State */
        .ant-input[disabled],
        .ant-input-number[disabled],
        .ant-select-disabled .ant-select-selector,
        .ant-picker-disabled {
          background-color: #f7fafc !important;
          color: #718096 !important;
          cursor: not-allowed !important;
        }

        /* Placeholder Stilleri */
        .ant-input::placeholder,
        textarea.ant-input::placeholder {
          color: #a0aec0 !important;
          opacity: 1 !important;
        }

      `}</style>

      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <DashboardLayout>
          <DashboardNavbar />
          <MDBox
            my={0.5}
            pt={0.5}
            sx={{
              paddingBottom: formButtons.length > 0 ? "80px" : "20px",
              overflowY: "auto",
              overflowX: "hidden",
              flex: 1,
              width: "100%",
              maxHeight: "calc(100vh - 80px)",
            }}
          >
            {/* Header */}
            <Box sx={{ mb: 1, px: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1, flexWrap: "wrap" }}>
                <MDTypography variant="h6" fontWeight={600} sx={{ mb: 0 }}>
                  {formName}
                </MDTypography>
                {typeof revision === "number" && (
                  <Chip 
                    label={`Rev #${revision}`} 
                    size="small" 
                    color="primary"
                    sx={{ height: "22px", fontSize: "11px" }}
                  />
                )}
                {publicationStatus === 2 ? (
                  <Chip 
                    label="Yayınlanmış" 
                    size="small" 
                    color="success"
                    sx={{ height: "22px", fontSize: "11px" }}
                  />
                ) : publicationStatus === 3 ? (
                  <Chip 
                    label="Arşivlenmiş" 
                    size="small"
                    sx={{ height: "22px", fontSize: "11px" }}
                  />
                ) : (
                  <Chip 
                    label="Taslak" 
                    size="small" 
                    color="default"
                    sx={{ height: "22px", fontSize: "11px" }}
                  />
                )}
                {workflowInstance?.workflowName && (
                  <Typography variant="caption" color="textSecondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Description sx={{ fontSize: "12px" }} />
                    {workflowInstance.workflowName}
                  </Typography>
                )}
                {currentUser?.userName && (
                  <Typography variant="caption" color="textSecondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Person sx={{ fontSize: "12px" }} />
                    {currentUser.fullName || currentUser.userName}
                  </Typography>
                )}
              </Box>

              {/* Timeline Button */}
              {!isNewInstance && (
                <Button
                  variant="text"
                  size="small"
                  startIcon={<HistoryIcon sx={{ fontSize: "16px !important" }} />}
                  onClick={() => setTimelineOpen(true)}
                  sx={{ textTransform: "none", fontSize: "13px" }}
                >
                  Geçmiş
                </Button>
              )}
            </Box>

            {/* Form Container */}
            <MDBox
              p={2}
              sx={{
                backgroundColor: "#fff",
                borderRadius: 1,
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                border: "1px solid #e0e0e0",
                mx: 2,
              }}
            >
              <FormProvider form={form}>
                <AntdFormily.Form>
                  <AntdFormily.FormLayout
                    layout="vertical"
                    size="large"
                    colon={false}
                  >
                    <SchemaField schema={schema} />
                  </AntdFormily.FormLayout>
                </AntdFormily.Form>
              </FormProvider>
            </MDBox>
          </MDBox>
        </DashboardLayout>

        {/* Button Panel - En altta sabit */}
        {formButtons.length > 0 && (
          <Box
            sx={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              width: "100%",
              background: "#ffffff",
              borderTop: "1px solid #e0e0e0",
              padding: "16px 24px",
              boxShadow: "0 -2px 8px rgba(0,0,0,0.1)",
              zIndex: 1300,
              display: "flex",
              gap: 2,
              justifyContent: "center",
              alignItems: "center",
              minHeight: "70px",
            }}
          >
            {formButtons.map((button) => {
              const IconComponent = button.icon
                ? (Icons as any)[button.icon] || Icons.CheckOutlined
                : null;

              // ✅ Action kod kontrolü - BMP modülü için
              const hasAction = button.action && button.action.trim();
              const buttonDisabled = submitting || !hasAction;

              return (
                <AntButton
                  key={button.id}
                  type={button.type || "primary"}
                  icon={IconComponent ? <IconComponent /> : null}
                  onClick={() => handleButtonClick(button)}
                  size="large"
                  loading={submitting}
                  disabled={buttonDisabled}
                  title={hasAction ? `Action: ${button.action}` : "Action Code tanımlanmamış!"}
                >
                  {submitting ? "Gönderiliyor..." : button.label}
                </AntButton>
              );
            })}
          </Box>
        )}

        {/* Timeline Drawer - Sağdan açılan modern timeline */}
        <Drawer
          anchor="right"
          open={timelineOpen}
          onClose={() => setTimelineOpen(false)}
          PaperProps={{
            sx: {
              width: { xs: "100%", sm: "500px", md: "600px" },
            },
          }}
        >
          <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <Box
              sx={{
                p: 2,
                borderBottom: "1px solid #e0e0e0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography variant="h6" fontWeight={600} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <HistoryIcon />
                  Süreç Geçmişi
                </Typography>
                {workflowInstance?.workflowName && (
                  <Typography variant="caption" color="textSecondary">
                    {workflowInstance.workflowName}
                  </Typography>
                )}
              </Box>
              <IconButton
                onClick={() => setTimelineOpen(false)}
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Timeline Content */}
            <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
              {loadingHistory ? (
                <Box sx={{ textAlign: "center", py: 3 }}>
                  <Typography variant="body2">Yükleniyor...</Typography>
                </Box>
              ) : historyData.length === 0 ? (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 6,
                    px: 2,
                  }}
                >
                  <HistoryIcon sx={{ fontSize: "48px", color: "#ccc", mb: 2 }} />
                  <Typography variant="body2" color="textSecondary">
                    Henüz geçmiş kaydı yok
                  </Typography>
                </Box>
              ) : (
                <Timeline position="right">
                  {historyData.map((item, index) => {
                    const isFirst = index === 0;
                    const isLast = index === historyData.length - 1;

                    // Status'e göre renk ve ikon belirle
                    let dotColor: "success" | "error" | "warning" | "primary" = "primary";
                    let StatusIcon = HourglassEmpty;

                    if (item.workFlowNodeStatus === 2) { // Completed
                      dotColor = "success";
                      StatusIcon = CheckCircle;
                    } else if (item.workFlowNodeStatus === 3) { // Rejected/Cancelled
                      dotColor = "error";
                      StatusIcon = Cancel;
                    } else if (item.workFlowNodeStatus === 1) { // In Progress
                      dotColor = "warning";
                      StatusIcon = HourglassEmpty;
                    }

                    // Approve ve Form items'ları birleştir
                    const allItems = [
                      ...(item.approveItems || []).map(ai => ({ ...ai, type: "approve" })),
                      ...(item.formItems || []).map(fi => ({ ...fi, type: "form" })),
                    ].sort((a, b) => {
                      const dateA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
                      const dateB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
                      return dateB - dateA;
                    });

                    return (
                      <TimelineItem key={index}>
                        <TimelineOppositeContent
                          sx={{
                            flex: 0.2,
                            py: 1,
                            display: { xs: "none", sm: "block" },
                          }}
                        >
                          <Typography variant="caption" color="textSecondary">
                            {item.nodeName || "N/A"}
                          </Typography>
                        </TimelineOppositeContent>
                        <TimelineSeparator>
                          <TimelineDot
                            color={dotColor}
                            sx={{
                              width: 32,
                              height: 32,
                            }}
                          >
                            <StatusIcon sx={{ fontSize: isFirst ? "24px" : "20px" }} />
                          </TimelineDot>
                          {!isLast && <TimelineConnector sx={{ minHeight: 40 }} />}
                        </TimelineSeparator>
                        <TimelineContent sx={{ py: 1, px: 1.5 }}>
                          <Card
                            sx={{
                              p: 2,
                              mb: 1.5,
                              backgroundColor: isFirst ? "#f8f9fa" : "#fff",
                              border: "1px solid #e0e0e0",
                              borderRadius: 1,
                              boxShadow: "none",
                            }}
                          >
                            {/* Node Bilgisi */}
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ display: { xs: "block", sm: "none" } }}>
                              {item.nodeName || "Node"}
                            </Typography>

                            {item.nodeDescription && (
                              <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: "block" }}>
                                {item.nodeDescription}
                              </Typography>
                            )}

                            <Divider sx={{ my: 1 }} />

                            {/* Approve ve Form Items */}
                            {allItems.map((subItem: any, subIndex) => (
                              <Box key={subIndex} sx={{ mb: subIndex < allItems.length - 1 ? 2 : 0 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                  <Avatar
                                    sx={{
                                      width: 28,
                                      height: 28,
                                      fontSize: "12px",
                                    }}
                                  >
                                    {subItem.approveUser?.charAt(0) || subItem.formUser?.charAt(0) || "?"}
                                  </Avatar>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2" fontWeight={600}>
                                      {subItem.approveUserNameSurname || subItem.formUserNameSurname || "Kullanıcı"}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      {subItem.type === "approve" ? "Onay" : "Form"} • {subItem.createdDate ? new Date(subItem.createdDate).toLocaleString("tr-TR") : "Tarih yok"}
                                    </Typography>
                                  </Box>
                                  {subItem.approverStatus !== undefined && (
                                    <Chip
                                      label={
                                        subItem.approverStatus === 1 ? "Onaylandı" :
                                          subItem.approverStatus === 2 ? "Reddedildi" :
                                            "Bekliyor"
                                      }
                                      size="small"
                                      color={
                                        subItem.approverStatus === 1 ? "success" :
                                          subItem.approverStatus === 2 ? "error" :
                                            "warning"
                                      }
                                      sx={{ fontWeight: 600, fontSize: "11px" }}
                                    />
                                  )}
                                </Box>

                                {subItem.note && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      mt: 0.5,
                                      p: 1,
                                      backgroundColor: "#f8f9fa",
                                      borderRadius: 1,
                                      borderLeft: "2px solid #dee2e6",
                                      fontStyle: "italic",
                                      display: "block",
                                    }}
                                  >
                                    &ldquo;{subItem.note}&rdquo;
                                  </Typography>
                                )}
                              </Box>
                            ))}
                          </Card>
                        </TimelineContent>
                      </TimelineItem>
                    );
                  })}
                </Timeline>
              )}
            </Box>
          </Box>
        </Drawer>
      </Box>
    </>
  );
}
