import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { FormDataApi, WorkFlowApi, UserApi, WorkFlowStartApiDto, AlertNodeInfo } from "api/generated";
import getConfiguration from "confiuration";
import { showWorkflowAlert } from "./utils/workflowAlert";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { Button, Card, CardContent, Typography, Box } from "@mui/material";

// Formily render
import "antd/dist/antd.css";
import { createForm } from "@formily/core";
import { FormProvider, createSchemaField } from "@formily/react";
import * as AntdFormily from "@formily/antd";
import { Button as AntButton, message, Card as AntdCard, Slider as AntdSlider, Rate as AntdRate } from "antd";
import * as Icons from "@ant-design/icons";
import { WorkFlowContiuneApiDto } from "api/generated";
import CurrencyInput from "../FormEditor/custom/CurrencyInput";


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
  const [currentUser, setCurrentUser] = useState<string>("");
  const scriptExecutedRef = useRef<boolean>(false); // Script'in çalıştırılıp çalıştırılmadığını takip et

  // Workflow instance bilgisi (location.state'den gelir)
  const workflowInstance = location.state?.workflowInstance;
  const isNewInstance = location.state?.isNewInstance || false;
  const taskDetail = location.state?.taskDetail;

  const form = useMemo(() => createForm(), []);
  const SchemaField = useMemo(() => createSchemaField({ components: { ...(AntdFormily as any), CurrencyInput, Card: AntdCard, Slider: AntdSlider, Rate: AntdRate } }), []);

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

      const setFieldValue = (_fieldKey: string, _value: any) => {
        // Schema modifikasyonunda değer atama yapmıyoruz
      };

      const getFieldValue = (fieldKey: string): any => {
        // Form values'dan değer oku
        return formValues[fieldKey];
      };

      // Script'i çalıştır ve visibility/readonly map'lerini doldur
      const scriptFunction = new Function(
        "setFieldVisible",
        "setFieldReadonly",
        "setFieldValue",
        "getFieldValue",
        "formValues",
        script
      );

      scriptFunction(
        setFieldVisible,
        setFieldReadonly,
        setFieldValue,
        getFieldValue,
        formValues
      );

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

      console.log("✅ Schema fieldScript'e göre modifiye edildi");
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
      return;
    }

    try {
      // Formily form instance'ından helper fonksiyonları oluştur
      const setFieldVisible = (fieldKey: string, visible: boolean) => {
        try {
          const field = formInstance.query(fieldKey).take();
          if (field) {
            // Formily'de display property'si ile görünürlük kontrol edilir
            if (visible) {
              field.setDisplay("visible");
            } else {
              field.setDisplay("hidden");
            }
          } else {
            console.warn(`⚠️ Field bulunamadı: ${fieldKey}`);
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
            } else {
              field.setPattern("editable");
            }
          } else {
            console.warn(`⚠️ Field bulunamadı: ${fieldKey}`);
          }
        } catch (error) {
          console.warn(`⚠️ setFieldReadonly hatası (${fieldKey}):`, error);
        }
      };

      const setFieldValue = (fieldKey: string, value: any) => {
        try {
          formInstance.setFieldValue(fieldKey, value);
        } catch (error) {
          console.warn(`⚠️ setFieldValue hatası (${fieldKey}):`, error);
        }
      };

      const getFieldValue = (fieldKey: string): any => {
        try {
          return formInstance.getFieldValue(fieldKey);
        } catch (error) {
          console.warn(`⚠️ getFieldValue hatası (${fieldKey}):`, error);
          return undefined;
        }
      };

      // Form values'ı global değişken olarak erişilebilir yap
      const formValues = formInstance.values || {};

      // Script'i güvenli bir şekilde çalıştır
      // Function constructor kullanarak script'i çalıştırıyoruz
      const scriptFunction = new Function(
        "setFieldVisible",
        "setFieldReadonly",
        "setFieldValue",
        "getFieldValue",
        "formValues",
        script
      );

      console.log("🚀 FieldScript çalıştırılıyor...");
      scriptFunction(
        setFieldVisible,
        setFieldReadonly,
        setFieldValue,
        getFieldValue,
        formValues
      );
      console.log("✅ FieldScript başarıyla çalıştırıldı");
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
        setCurrentUser(userResponse.data?.userName || "");
      } catch (err) {
        // Kullanıcı bilgisi yüklenemedi - sessizce devam et
      }
    };
    loadUser();
  }, []);

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

        // ✅ FieldScript varsa schema'yı modifiye et (flash önleme)
        // Script'i schema yüklenirken çalıştırıp schema'yı modifiye ediyoruz
        // Böylece alanlar render edilmeden önce gizli olur
        const fieldScript = taskDetail?.fieldScript;
        if (fieldScript && fieldScript.trim()) {
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
            finalSchema = applyScriptToSchema(fieldScript, finalSchema, initialFormValues);
            console.log("✅ Schema fieldScript'e göre modifiye edildi (flash önlendi)");
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
  }, [workflowInstance?.formId, taskDetail?.fieldScript]);

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

  // ✅ FieldScript'i çalıştır - FormData yüklendikten sonra (değer atamaları için)
  // Not: Visibility kontrolleri schema yüklenirken yapıldı (flash önleme)
  // Burada sadece değer atamaları ve dinamik kontroller yapılır
  useEffect(() => {
    // Yeni bir taskDetail geldiğinde ref'i sıfırla
    if (taskDetail?.fieldScript) {
      scriptExecutedRef.current = false;
    }

    // Script zaten çalıştırıldıysa tekrar çalıştırma
    if (scriptExecutedRef.current) {
      return;
    }

    // fieldScript'i taskDetail'den al
    const fieldScript = taskDetail?.fieldScript;
    
    // Script yoksa veya form/schema hazır değilse çık
    if (!fieldScript || !fieldScript.trim() || !form || !schema || loading) {
      return;
    }

    // FormData yüklenene kadar bekle (form.values hazır olmalı)
    // formData state'i set edildikten sonra script'i çalıştır
    const timeout = setTimeout(() => {
      const formValues = form.values;
      // FormData yüklenmişse script'i çalıştır (değer atamaları için)
      // Visibility zaten schema'da ayarlandı, burada sadece dinamik kontroller yapılır
      if (formValues && Object.keys(formValues).length > 0) {
        console.log("📝 FieldScript çalıştırılıyor (değer atamaları için), form values:", formValues);
        executeFieldScript(fieldScript, form);
        scriptExecutedRef.current = true; // Script çalıştırıldı olarak işaretle
      } else {
        // FormData henüz yüklenmemiş, tekrar dene
        console.log("⏳ FormData henüz yüklenmedi, script çalıştırma erteleniyor...");
      }
    }, 100); // FormData yüklendikten sonra kısa bir bekleme (visibility zaten schema'da)

    return () => clearTimeout(timeout);
  }, [taskDetail?.fieldScript, form, schema, loading, formData]);

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
          userName: currentUser || undefined,
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
          userName: currentUser || undefined,
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
          margin-bottom: 24px !important;
          padding: 0;
        }

        .ant-form-item-label {
          padding-bottom: 8px !important;
        }

        .ant-form-item-label > label {
          font-size: 14px !important;
          font-weight: 600 !important;
          color: #1a202c !important;
          line-height: 1.5 !important;
        }

        .ant-form-item-label > label.ant-form-item-required:not(.ant-form-item-required-mark-optional)::before {
          color: #ef4444 !important;
          margin-right: 4px !important;
        }

        /* Input, Select, TextArea Stilleri */
        .ant-input,
        .ant-input-number,
        .ant-input-password,
        .ant-picker,
        .ant-select-selector,
        .ant-input-number-input,
        textarea.ant-input {
          border-radius: 8px !important;
          border: 1px solid #e2e8f0 !important;
          padding: 10px 14px !important;
          font-size: 14px !important;
          line-height: 1.5 !important;
          transition: all 0.2s ease !important;
          background-color: #ffffff !important;
          color: #1a202c !important;
        }

        .ant-input:hover,
        .ant-input-number:hover,
        .ant-input-password:hover,
        .ant-picker:hover,
        .ant-select-selector:hover,
        textarea.ant-input:hover {
          border-color: #667eea !important;
        }

        .ant-input:focus,
        .ant-input-number:focus,
        .ant-input-password:focus,
        .ant-picker-focused,
        .ant-select-focused .ant-select-selector,
        textarea.ant-input:focus {
          border-color: #667eea !important;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
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
          color: #1a202c !important;
          margin-bottom: 8px !important;
        }

        .ant-checkbox-checked .ant-checkbox-inner,
        .ant-radio-checked .ant-radio-inner {
          background-color: #667eea !important;
          border-color: #667eea !important;
        }

        /* Upload Stilleri */
        .ant-upload {
          width: 100% !important;
        }

        .ant-upload.ant-upload-drag {
          border-radius: 8px !important;
          border: 2px dashed #e2e8f0 !important;
          background-color: #f8f9fa !important;
          transition: all 0.2s ease !important;
        }

        .ant-upload.ant-upload-drag:hover {
          border-color: #667eea !important;
          background-color: #f0f4ff !important;
        }

        /* Rate Component Stilleri */
        .ant-rate {
          font-size: 20px !important;
        }

        .ant-rate-star {
          color: #fbbf24 !important;
        }

        /* Slider Stilleri */
        .ant-slider {
          margin: 16px 0 !important;
        }

        .ant-slider-rail {
          background-color: #e2e8f0 !important;
        }

        .ant-slider-track {
          background-color: #667eea !important;
        }

        .ant-slider-handle {
          border-color: #667eea !important;
        }

        /* Card Component Stilleri */
        .ant-card {
          border-radius: 12px !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
          margin-bottom: 16px !important;
        }

        .ant-card-head {
          border-bottom: 1px solid #e2e8f0 !important;
          padding: 16px 20px !important;
        }

        .ant-card-head-title {
          font-size: 16px !important;
          font-weight: 600 !important;
          color: #1a202c !important;
        }

        .ant-card-body {
          padding: 20px !important;
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

        /* Form Layout Responsive */
        @media (max-width: 768px) {
          .ant-form-item-label {
            text-align: left !important;
          }
          
          .ant-form-item-label > label {
            font-size: 13px !important;
          }
        }

        /* Form Grid Layout */
        .ant-row {
          margin-left: -8px !important;
          margin-right: -8px !important;
        }

        .ant-col {
          padding-left: 8px !important;
          padding-right: 8px !important;
        }

        /* Button Group Stilleri */
        .ant-btn-group {
          display: flex !important;
          gap: 8px !important;
        }

        /* Switch Stilleri */
        .ant-switch-checked {
          background-color: #667eea !important;
        }

        /* TimePicker Stilleri */
        .ant-picker-time-panel-column > li.ant-picker-time-panel-cell-selected {
          background-color: #667eea !important;
        }

        /* Cascader Stilleri */
        .ant-cascader-picker {
          width: 100% !important;
        }

        .ant-cascader-menu-item-active {
          background-color: #f0f4ff !important;
        }

        /* Transfer Stilleri */
        .ant-transfer-list {
          border-radius: 8px !important;
          border: 1px solid #e2e8f0 !important;
        }

        /* TreeSelect Stilleri */
        .ant-select-tree {
          border-radius: 8px !important;
        }

        .ant-select-tree-node-selected {
          background-color: #f0f4ff !important;
        }

        /* Form Item Spacing */
        .ant-form-horizontal .ant-form-item-label {
          flex: 0 0 25% !important;
          max-width: 25% !important;
        }

        .ant-form-horizontal .ant-form-item-control {
          flex: 0 0 75% !important;
          max-width: 75% !important;
        }

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

        /* Focus Ring */
        .ant-input:focus-visible,
        .ant-select-focused .ant-select-selector,
        .ant-picker-focused {
          outline: 2px solid #667eea !important;
          outline-offset: 2px !important;
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
            pt={1}
            sx={{ 
              paddingBottom: formButtons.length > 0 ? "100px" : "20px",
              overflowY: "auto",
              overflowX: "hidden",
              flex: 1,
              width: "100%",
              maxHeight: "calc(100vh - 100px)",
            }}
          >
            <Box sx={{ mb: 1.5, px: 2 }}>
              <MDTypography variant="h4" fontWeight={600} gutterBottom sx={{ mb: 0.5 }}>
                {formName}
              </MDTypography>
              {workflowInstance?.workflowName && (
                <MDTypography variant="body2" color="textSecondary" sx={{ mb: 0 }}>
                  Workflow: {workflowInstance.workflowName}
                </MDTypography>
              )}
            </Box>

            <MDBox 
              p={3}
              sx={{ 
                backgroundColor: "#fff", 
                borderRadius: 3, 
                boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                border: "1px solid #e2e8f0",
                maxWidth: "1200px",
                margin: "0 auto",
                mx: 2,
              }}
            >
              <FormProvider form={form}>
                <AntdFormily.Form>
                  <AntdFormily.FormLayout 
                    layout="horizontal" 
                    labelAlign="left" 
                    labelCol={6} 
                    wrapperCol={18} 
                    size="large"
                    colon={true}
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
              backgroundColor: "#ffffff",
              borderTop: "2px solid #e0e0e0",
              padding: "20px 24px",
              boxShadow: "0 -4px 16px rgba(0,0,0,0.2)",
              zIndex: 1300,
              display: "flex",
              gap: 2,
              justifyContent: "center",
              alignItems: "center",
              minHeight: "80px",
              overflowX: "hidden",
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
                  style={{ margin: "0 8px" }}
                  loading={submitting}
                  disabled={buttonDisabled}
                  title={hasAction ? `Action: ${button.action}` : "Action Code tanımlanmamış!"}
                >
                  {submitting ? "Gönderiliyor..." : button.label}
                  {hasAction && (
                    <span style={{ fontSize: "0.7em", marginLeft: "4px", opacity: 0.7 }}>
                      ({button.action})
                    </span>
                  )}
                </AntButton>
              );
            })}
          </Box>
        )}
      </Box>
    </>
  );
}
