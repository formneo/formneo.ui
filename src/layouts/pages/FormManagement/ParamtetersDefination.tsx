/**
=========================================================
* Material Dashboard 2 PRO React TS - v1.0.2
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-2-pro-react-ts
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// react-router components
import {
  Button,
  CheckBox,
  Input,
  Select,
  Option,
  ComboBox,
  ComboBoxItem,
} from "@ui5/webcomponents-react";
import { Components, Form, FormBuilder, Formio, form } from "@formio/react";

import { useEffect, useRef, useState } from "react";

import "./style/Builder.css";

import { ErrorMessage, Field, Formik, FormikProvider, useFormik } from "formik";
import * as Yup from "yup";
// import { setLoading, useMaterialUIController } from "context";

import React from "react";
import { Splitter, SplitterPanel } from "primereact/splitter";

import { Accordion, AccordionTab } from "primereact/accordion";
import components from "./Custom";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Box } from "@mui/system";
import { Tab } from "@mui/material";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import {
  FormDataApi,
  FormCategory,
  FormPriority,
  FormType,
  WorkFlowDefinationApi,
  WorkFlowDefinationListDto,
} from "api/generated";
import getConfiguration from "confiuration";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { Editor } from "@monaco-editor/react";
import { Dialog } from "primereact/dialog";

interface FormProps {
  id?: string;
  formName?: string;
  formDescription?: string;
  formDesign?: string;
  revision?: number;
  isActive?: number;
  showInMenu?: number;
  formType: number;
  formTypeText: string;
  formCategory: number;
  formCategoryText: string;
  formPriority: number;
  propPriorityText: string;
  workflowId: string;
  workFlowName: string;
}

interface formCategory {
  id: FormCategory;
  name: string;
  description: string;
}

interface formType {
  id: FormType;
  name: string;
  description: string;
}

interface formPriority {
  id: FormPriority;
  name: string;
  description: string;
}

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
interface JsonObject {
  [key: string]: JsonValue;
}
interface JsonArray extends Array<JsonValue> {}

const ParamtetersDefination = (): JSX.Element => {
  const { id } = useParams();

  // const [controller, dispatch] = useMaterialUIController();
  const [searchParams] = useSearchParams();
  // const urlParams = new URLSearchParams(location.search);
  const [value, setValue] = React.useState("1");
  // const configuration = ConfigurationConfig;
  const navigate = useNavigate();

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };
  const testData = [
    { id: 0, kolon1: "Veri 1111-1", kolon2: "Veri 1-2", kolon3: "Veri 1-3" },
    { id: 1, kolon1: "Veri 2-1", kolon2: "Veri 2-2", kolon3: "Veri 2-3" },
    { id: 2, kolon1: "Veri 3-1", kolon2: "Veri 3-2", kolon3: "Veri 3-3" },
    { id: 3, kolon1: "Veri 4-1", kolon2: "Veri 4-2", kolon3: "Veri 4-3" },
    { id: 4, kolon1: "Veri 5-1", kolon2: "Veri 5-2", kolon3: "Veri 5-3" },
    { id: 5, kolon1: "Veri 6-1", kolon2: "Veri 6-2", kolon3: "Veri 6-3" },
    { id: 6, kolon1: "Veri 7-1", kolon2: "Veri 7-2", kolon3: "Veri 7-3" },
    { id: 7, kolon1: "Veri 8-1", kolon2: "Veri 8-2", kolon3: "Veri 8-3" },
  ];

  // Validasyon şemasını önce tanımla, sonra kullan
  const validationSchema = Yup.object().shape({
    formName: Yup.string().required("Bu alan boş bırakılamaz"),
    workflowId: Yup.string().when("formType", {
      is: "workflow",
      then: () => Yup.string().required("İş akışı formu için iş akışı seçimi zorunludur"),
    }),
    formType: Yup.string().required("Form tipi seçimi zorunludur"),
    formCategory: Yup.string().required("Form kategorisi seçimi zorunludur"),
    formPriority: Yup.string().required("Form önceliği seçimi zorunludur"),
  });

  let initialValues = {
    formName: "",
    formDescription: "",
    Revision: "1",
    formid: "",
    isActive: 0,
    showInMenu: 0,
    workflowId: "",
    workFlowName: "",
    formType: 0,
    formTypeText: "",
    formCategory: 0,
    formCategoryText: "",
    formPriority: 0,
    formPriortyText: "",
  };
  const [myFormPriorities, setMyFormPriorities] = useState<formPriority[]>([]);
  const [myFormCategories, setMyFormCategories] = useState<formCategory[]>([]);
  const [myFormTypes, setMyFormTypes] = useState<formType[]>([]);
  const [myWorkFlowDefinations, setMyWorkFlowDefinations] = useState<any>([]);

  const [prevFormDataJson, setPrevFormDataJson] = useState("");

  const myData = async () => {
    var conf = getConfiguration();
    const workflowdefination = new WorkFlowDefinationApi(conf);
    const formProperty = new FormDataApi(conf);
    const dataPriorities = await formProperty.apiFormDataGetFormPrioritiesEnumGet();
    const dataCategories = await formProperty.apiFormDataGetFormCategoriesEnumGet();
    const dataTypes = await formProperty.apiFormDataGetFormTypesEnumGet();
    const workFlowDefinationData =
      await workflowdefination.apiWorkFlowDefinationGetWorkFlowListByMenuGet();
    
    
    
    
    setMyFormPriorities(dataPriorities.data as any);
    setMyFormCategories(dataCategories.data as any);
    setMyFormTypes(dataTypes.data as any);
    setMyWorkFlowDefinations(workFlowDefinationData.data as any);
  };

  const [jsonSchema, setSchema] = useState({ components: [] });
  const [jsEditorValue, setJsEditorValue] = useState("");

  function removeKeysFromJson<T extends JsonValue>(data: T, keysToRemove: string[] = ["id"]): T {
    if (Array.isArray(data)) {
      return data.map((item) => removeKeysFromJson(item, keysToRemove)) as T;
    } else if (data !== null && typeof data === "object") {
      const result: JsonObject = {};
      for (const key in data) {
        if (!keysToRemove.includes(key)) {
          result[key] = removeKeysFromJson((data as JsonObject)[key], keysToRemove);
        }
      }
      return result as T;
    }
    return data;
  }

  const saveForm = async (values: any) => {
    try {
      
      var conf = getConfiguration();
      const formRepo = new FormDataApi(conf);
      values.formDesign = JSON.stringify(jsonSchema);
      values.javaScriptCode = jsEditorValue;
      

      if (id) {
        
        const json1 = JSON.parse(prevFormDataJson);
        const json2 = JSON.parse(values.formDesign);
        const cleaned1 = removeKeysFromJson(json1);
        const cleaned2 = removeKeysFromJson(json2);
        const areEqual = JSON.stringify(cleaned1) === JSON.stringify(cleaned2);
        



        
      } else {
        
        await formRepo.apiFormDataPost({
          formName: values.formName,
          canEdit: true,
          formDescription: values.formDescription,
          formDesign: values.formDesign,
          revision: values.Revision,
          isActive: values.isActive,
          showInMenu: values.showInMenu == 1 ? true : false,
          javaScriptCode: values.javaScriptCode,
          formCategory: values.formCategory,
          formPriority: values.formPriority,
          formType: values.formType,
          workFlowDefinationId: values.workflowId == "" ? null : values.workflowId,
        });
        
      }
      
      navigate("/parameters", { replace: true });
    } catch (error) {
      console.error("Form gönderme hatası:", error);
      alert("Form kaydedilirken bir hata oluştu!");
    }
  };

  const formikProps = useFormik({
    initialValues: initialValues,
    validationSchema: validationSchema,
    onSubmit: saveForm,
  });

  useEffect(() => {
    Components.setComponents(components);

    Formio.setBaseUrl("https://api.cfapps.us21.hana.ondemand.com/api");

    // Alternatif olarak, projenin URL'ini değiştirmek için
    Formio.setProjectUrl("https://api.cfapps.us21.hana.ondemand.com/api");
  }, []);

  const [formEditActive, setformEditActive] = useState(false);

  const [detailForm, setDetailForm] = useState<FormProps>();
  const [jsonEditorValue, setJsonEditorValue] = useState("");
  const editorRef = useRef(null);

  const [selectedFormPiority, setSelectedFormPiority] = useState("");
  const fetchTest = async () => {
    try {
      if (id) {
        var confg = getConfiguration();
        const formRepo = new FormDataApi(confg);
        var data = await formRepo.apiFormDataIdGet(id);
        
        formikProps.setFieldValue("formName", data.data.formName);
        formikProps.setFieldValue("parentFormId", data.data.parentFormId);
        formikProps.setFieldValue("formDescription", data.data.formDescription);
        formikProps.setFieldValue("formid", data.data.id);
        formikProps.setFieldValue("Revision", data.data.revision);
        formikProps.setFieldValue("isActive", data.data.isActive);
        formikProps.setFieldValue("showInMenu", data.data.showInMenu);
        formikProps.setFieldValue("formType", data.data.formType);
        formikProps.setFieldValue("formCategory", data.data.formCategory);
        formikProps.setFieldValue("formPriority", data.data.formPriority);
        formikProps.setFieldValue("workflowId", data.data.workFlowDefinationId);
        formikProps.setFieldValue("formTypeText", data.data.formTypeText);
        formikProps.setFieldValue("formCategoryText", data.data.formCategoryText);
        formikProps.setFieldValue("formPriortyText", data.data.formPriorityText);
        formikProps.setFieldValue("workFlowName", data.data.workFlowName);
        if (data.data.workFlowDefinationId != null) {
          formikProps.values.formType = 2;
        }
        
        setSelectedFormPiority(data.data.formPriorityText);
        // JavaScript kodunu state'e kaydet
        setJsEditorValue(
          data.data.javaScriptCode || generateJavaScript(JSON.parse(data.data.formDesign))
        );

        setSchema(JSON.parse(data.data.formDesign));
        setDetailForm(data.data as any);

        setPrevFormDataJson(data.data.formDesign);
      }
    } catch (error) {
      console.error("Error fetching form data:", error);
    }
  };

  useEffect(() => {
    myData();
    fetchTest();
  }, []);

  const handleJsonChange = (value: string | undefined) => {
    try {
      if (value) {
        const parsedJson = JSON.parse(value);
        setSchema(parsedJson);
        setJsonEditorValue(value);
      }
    } catch (error) {
      console.error("JSON parse hatası:", error);
    }
  };

  const onFormChange = (schema: any) => {
    setSchema({ ...schema, components: [...schema.components] });
    setJsonEditorValue(JSON.stringify(schema, null, 2));
  };

  async function getFormId(id: any) {
    // setLoading(dispatch, true);
    // let formApi = new FormDataApi(configuration);
    // var formDetail = await formApi.apiFormDataIdGet(id);
    // // 
    // formikProps.setFieldValue("formName", formDetail.data.formName);
    // formikProps.setFieldValue("formDescription", formDetail.data.formDescription);
    // formikProps.setFieldValue("formid", formDetail.data.id);
    // formikProps.setFieldValue("isActive", formDetail.data.isActive);
    // setDetailForm(formDetail.data);
    // setformEditActive(true);
    // setSchema(JSON.parse(formDetail.data.formDesign));
    // setLoading(dispatch, false);
  }

  const options = {
    // Premium bileşenleri gizler
    builder: {
      // // basic: true, // Varsayılan "Basic" bileşenlerini gizler
      // advanced: false, // Varsayılan "Advanced" bileşenlerini gizler
      // layout: false, // Varsayılan "Layout" bileşenlerini gizler
      // data: false, // Varsayılan "Data" bileşenlerini gizler
      premium: false,
      custom: {
        title: "Formneo Design System",
        Key: "dscomponents",
        weight: 10,
        components: {
          dsinput: {
            title: "DS Inbox",
            key: "dsinput",
            icon: "dsinput",
            schema: {
              label: "dsinput",
              type: "dsinput",
              key: "dsinput",
            },
          },
          dsselect: {
            title: "DS Select",
            key: "dsselect",
            icon: "dsselect",
            schema: {
              label: "dsselect",
              type: "dsselect",
              key: "dsselect",
            },
          },
          dscheckbox: {
            title: "DS CheckBox",
            key: "dscheckbox",
            icon: "dscheckbox",
            schema: {
              label: "dscheckbox",
              type: "dscheckbox",
              key: "dscheckbox",
            },
          },
          dsselectboxes: {
            title: "DS Selectboxes",
            key: "dsselectboxes",
            icon: "dsselectboxes",
            schema: {
              label: "dsselectboxes",
              type: "dsselectboxes",
              key: "dsselectboxes",
            },
          },
          dsradio: {
            title: "DS Radio",
            key: "dsradio",
            icon: "dsradio",
            schema: {
              label: "dsradio",
              type: "dsradio",
              key: "dsradio",
            },
          },
          dsnumber: {
            title: "DS Number",
            key: "dsnumber",
            icon: "dsnumber",
            schema: {
              label: "dsnumber",
              type: "dsnumber",
              key: "dsnumber",
            },
          },
          dspassword: {
            title: "DS Password",
            key: "dspassword",
            icon: "dspassword",
            schema: {
              label: "dspassword",
              type: "dspassword",
              key: "dspassword",
            },
          },
          dsbutton: {
            title: "DS Button",
            key: "dsbutton",
            icon: "dsbutton",
            schema: {
              label: "dsbutton",
              type: "dsbutton",
              key: "dsbutton",
            },
          },
          dsemail: {
            title: "DS Email",
            key: "dsemail",
            icon: "dsemail",
            schema: {
              label: "dsemail",
              type: "dsemail",
              key: "dsemail",
            },
          },
          dsphone: {
            title: "DS Phone",
            key: "dsphone",
            icon: "dsphone",
            schema: {
              label: "dsphone",
              type: "dsphone",
              key: "dsphone",
            },
          },
          dsdatetime: {
            title: "DS DateTime",
            key: "dsdatetime",
            icon: "dsdatetime",
            schema: {
              label: "dsdatetime",
              type: "dsdatetime",
              key: "dsdatetime",
            },
          },
          dsday: {
            title: "DS Day",
            key: "dsday",
            icon: "dsday",
            schema: {
              label: "dsday",
              type: "dsday",
              key: "dsday",
            },
          },
          dstime: {
            title: "DS Time",
            key: "dstime",
            icon: "dstime",
            schema: {
              label: "dstime",
              type: "dstime",
              key: "dstime",
            },
          },
          dscurrency: {
            title: "DS Currency",
            key: "dscurrency",
            icon: "dscurrency",
            schema: {
              label: "dscurrency",
              type: "dscurrency",
              key: "dscurrency",
            },
          },
          dssurvey: {
            title: "DS Survey",
            key: "dssurvey",
            icon: "dssurvey",
            schema: {
              label: "dssurvey",
              type: "dssurvey",
              key: "dssurvey",
            },
          },
          dssignature: {
            title: "DS Signature",
            key: "dssignature",
            icon: "dssignature",
            schema: {
              label: "dssignature",
              type: "dssignature",
              key: "dssignature",
            },
          },
          dstable: {
            title: "DS Table",
            key: "dstable",
            icon: "dstable",
            schema: {
              label: "dstable",
              type: "dstable",
              key: "dstable",
            },
          },
          dsusername: {
            title: "DS Username",
            key: "dsusername",
            icon: "dsusername",
            schema: {
              label: "dsusername",
              type: "dsusername",
              key: "dsusername",
            },
          },
          dshtmlelement: {
            title: "DS HTML",
            key: "dshtmlelement",
            icon: "dshtmlelement",
            schema: {
              label: "dshtmlelement",
              type: "dshtmlelement",
              key: "dshtmlelement",
            },
          },
          dstextarea: {
            title: "DS Text Area",
            key: "dstextarea",
            icon: "dstextarea",
            schema: {
              label: "dstextarea",
              type: "dstextarea",
              key: "dstextarea",
            },
          },
          dsapproval: {
            title: "DS Approval",
            key: "dsapproval",
            icon: "dsapproval",
            schema: {
              label: "dsapproval",
              type: "dsapproval",
              key: "dsapproval",
            },
          },
        },
      },
    },
  };

  const [activeTab, setActiveTab] = useState("form"); // "form" | "typescript"

  const generateTypeScript = (formSchema: any) => {
    const interfaceNames = new Set<string>();
    const interfaces: string[] = [];

    // Form alanları için interface oluştur
    const generateFieldInterface = (components: any[]) => {
      let fields = "";
      components.forEach((component) => {
        if (component.key) {
          switch (component.type) {
            case "textfield":
              fields += `  ${component.key}: string;\n`;
              break;
            case "number":
              fields += `  ${component.key}: number;\n`;
              break;
            case "checkbox":
              fields += `  ${component.key}: boolean;\n`;
              break;
            case "select":
              const enumName = `${component.key}Options`;
              interfaceNames.add(enumName);
              interfaces.push(`export enum ${enumName} {
  ${component.data.values.map((v: any) => `${v.label} = "${v.value}"`).join(",\n  ")}
}\n`);
              fields += `  ${component.key}: ${enumName};\n`;
              break;
            default:
              fields += `  ${component.key}: any;\n`;
          }
        }
      });
      return fields;
    };

    // Event handler'lar için interface oluştur
    const generateEventHandlers = (components: any[]) => {
      let handlers = "";
      components.forEach((component) => {
        if (component.key) {
          switch (component.type) {
            case "button":
              handlers += `  on${component.key}Click?: () => void;\n`;
              break;
            case "textfield":
            case "number":
            case "select":
              handlers += `  on${component.key}Change?: (value: any) => void;\n`;
              break;
          }
        }
      });
      return handlers;
    };

    const formName = formikProps.values.formName || "DefaultForm";
    const typescriptCode = `// ${formName} için otomatik oluşturulan TypeScript tanımlamaları
import { FormEvent } from 'react';

${interfaces.join("\n")}

export interface I${formName}Data {
${generateFieldInterface(formSchema.components)}
}

export interface I${formName}Events {
${generateEventHandlers(formSchema.components)}
  onSubmit?: (data: I${formName}Data) => void;
  onValidationError?: (errors: any) => void;
}

export interface I${formName}Props extends I${formName}Events {
  initialData?: Partial<I${formName}Data>;
  isLoading?: boolean;
  isReadOnly?: boolean;
}

export class ${formName}Handler {
  private formData: I${formName}Data;
  private events: I${formName}Events;

  constructor(events?: I${formName}Events) {
    this.formData = {} as I${formName}Data;
    this.events = events || {};
  }

  public handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      // Form doğrulama
      
      const validationResult = await this.validateForm();
      if (validationResult.isValid) {
        this.events.onSubmit?.(this.formData);
      } else {
        this.events.onValidationError?.(validationResult.errors);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  private validateForm = async () => {
    // Form doğrulama mantığı burada implement edilecek
    return { isValid: true, errors: null };
  };

${formSchema.components
  .map((component: any) => {
    if (component.key) {
      switch (component.type) {
        case "button":
          return `  public handle${component.key}Click = () => {
    this.events.on${component.key}Click?.();
  };\n`;
        case "textfield":
        case "number":
        case "select":
          return `  public handle${component.key}Change = (value: any) => {
    this.formData.${component.key} = value;
    this.events.on${component.key}Change?.(value);
  };\n`;
        default:
          return "";
      }
    }
    return "";
  })
  .join("\n")}
}

// Kullanım örneği:
/*
const ${formName}Instance = new ${formName}Handler({
  onSubmit: (data) => {
    
  },
  onValidationError: (errors) => {
    console.error('Validation errors:', errors);
  }
});
*/
`;
    return typescriptCode;
  };

  const [tsCode, setTsCode] = useState("");

  useEffect(() => {
    setTsCode(generateTypeScript(jsonSchema));
  }, [jsonSchema]);

  const handleTsCodeChange = (value: string | undefined) => {
    if (value) {
      setTsCode(value);
    }
  };

  const saveTypeScriptCode = async () => {
    try {
      // TypeScript dosyasını kaydet
      const fileName = `${formikProps.values.formName || "DefaultForm"}.ts`;
      const blob = new Blob([tsCode], { type: "text/typescript" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("TypeScript dosyası kaydedilirken hata:", error);
    }
  };

  const generateJavaScript = (formSchema: any) => {
    const formName = formikProps.values.formName || "DefaultForm";

    const javascriptCode = `// ${formName} için Form.io event handlers
document.addEventListener('DOMContentLoaded', function() {
  // Form oluştur
  Formio.createForm(document.getElementById('formio'), ${JSON.stringify(
    formSchema
  )}).then(function(form) {
    

    // Form submit olayı
    form.on('submit', (submission) => {
      alert('Form başarıyla gönderildi!');
      
    });

    // Her component için event listener'ları ekle
    ${formSchema.components
      .map((comp: any) => {
        if (comp.key) {
          switch (comp.type) {
            case "button":
              return `
    // ${comp.key} butonu için click event
    const ${comp.key}Btn = form.getComponent('${comp.key}');
    if (${comp.key}Btn) {
      ${comp.key}Btn.on('click', () => {
        
      });
    }`;
            case "textfield":
              return `
    // ${comp.key} text alanı için change event
    const ${comp.key}Field = form.getComponent('${comp.key}');
    if (${comp.key}Field) {
      ${comp.key}Field.on('change', (e) => {
        
      });
    }`;
            case "number":
              return `
    // ${comp.key} sayı alanı için change event
    const ${comp.key}Field = form.getComponent('${comp.key}');
    if (${comp.key}Field) {
      ${comp.key}Field.on('change', (e) => {
        
      });
    }`;
            case "select":
              return `
    // ${comp.key} seçim alanı için change event
    const ${comp.key}Select = form.getComponent('${comp.key}');
    if (${comp.key}Select) {
      ${comp.key}Select.on('change', (e) => {
        
      });
    }`;
            default:
              return `
    // ${comp.key} componenti için change event
    const ${comp.key}Comp = form.getComponent('${comp.key}');
    if (${comp.key}Comp) {
      ${comp.key}Comp.on('change', (e) => {
        
      });
    }`;
          }
        }
        return "";
      })
      .join("\n")}

    // Form hazır olduğunda
    form.on('ready', () => {
      
    });

    // Form validation hatası olduğunda
    form.on('error', (errors) => {
      console.error('Form hataları:', errors);
      alert('Form gönderilirken hata oluştu!');
    });
  });
});`;

    return javascriptCode;
  };

  const loadFormScript = () => {
    // Önceki script'i temizle
    const oldScript = document.getElementById("form-handler-script");
    if (oldScript) {
      oldScript.remove();
      // Global değişkeni temizle
      const formName = formikProps.values.formName || "DefaultForm";
      delete (window as any)[formName];
    }

    // Yeni script'i ekle
    const script = document.createElement("script");
    script.id = "form-handler-script";
    script.textContent = generateJavaScript(jsonSchema);
    document.body.appendChild(script);
  };

  useEffect(() => {
    if (value === "3") {
      // Önizleme tabı seçildiğinde
      setTimeout(loadFormScript, 100); // Form yüklendikten sonra script'i yükle
    }
    return () => {
      // Component unmount olduğunda script'i temizle
      const script = document.getElementById("form-handler-script");
      if (script) {
        script.remove();
      }
    };
  }, [value, jsonSchema]);

  const [showPreviewModal, setShowPreviewModal] = useState(false);

  return (
    <>
      <DashboardLayout>
        <DashboardNavbar />
        <TabContext value={value}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <TabList onChange={handleChange} aria-label="lab API tabs example">
              <Tab label="Form Tasarımı" value="1" />
              <Tab label="JavaScript Kod" value="2" />
              <Tab label="Önizleme" value="3" />
              <Tab label="Form JSON" value="4" />
            </TabList>
          </Box>
          <TabPanel value="1">
            <Splitter style={{ height: "100%" }}>
              <SplitterPanel
                className="flex align-items-center justify-content-center"
                size={100}
                minSize={10}
              >
                <FormBuilder options={options} form={jsonSchema} onChange={onFormChange} />
              </SplitterPanel>
              <SplitterPanel className="flex align-items-center justify-content-center" size={15}>
                <Accordion
                  style={{ width: "300px", height: "100%", backgroundColor: "#f8f9fa" }}
                  activeIndex={0}
                >
                  <AccordionTab
                    header={
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <i className="pi pi-file" style={{ color: "#666" }}></i>
                        <span style={{ fontWeight: 500 }}>Form Özellikleri</span>
                      </div>
                    }
                  >
                    <form style={{ padding: "10px" }}>
                      <Accordion style={{ width: "100%", border: "none" }} multiple>
                        <AccordionTab
                          header={
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <i className="pi pi-info-circle" style={{ color: "#2196F3" }}></i>
                              <span style={{ fontWeight: 500 }}>Temel Bilgiler</span>
                            </div>
                          }
                        >
                          <div className="form-group" style={{ marginBottom: "15px" }}>
                            <label
                              style={{ display: "block", marginBottom: "5px", color: "#666" }}
                              htmlFor="formName"
                            >
                              Form Adı
                            </label>
                            <Input
                              disabled={formEditActive}
                              style={{ width: "100%" }}
                              value={formikProps.values.formName}
                              onChange={formikProps.handleChange}
                              onBlur={formikProps.handleBlur}
                              name="formName"
                            />
                            {formikProps.errors.formName && formikProps.touched.formName && (
                              <div style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
                                {formikProps.errors.formName}
                              </div>
                            )}
                          </div>

                          <div className="form-group" style={{ marginBottom: "15px" }}>
                            <label
                              style={{ display: "block", marginBottom: "5px", color: "#666" }}
                              htmlFor="formDescription"
                            >
                              Form Açıklama
                            </label>
                            <Input
                              style={{ width: "100%" }}
                              value={formikProps.values.formDescription}
                              onChange={formikProps.handleChange}
                              onBlur={formikProps.handleBlur}
                              name="formDescription"
                            />
                          </div>

                          <div className="form-group" style={{ marginBottom: "15px" }}>
                            <label
                              style={{ display: "block", marginBottom: "5px", color: "#666" }}
                              htmlFor="Revision"
                            >
                              Revizyon
                            </label>
                            <Input
                              style={{ width: "100%" }}
                              value={formikProps.values.Revision}
                              onChange={formikProps.handleChange}
                              onBlur={formikProps.handleBlur}
                              name="Revision"
                              disabled={true}
                            />
                          </div>
                        </AccordionTab>

                        <AccordionTab
                          header={
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <i className="pi pi-cog" style={{ color: "#4CAF50" }}></i>
                              <span style={{ fontWeight: 500 }}>Form Yapılandırması</span>
                            </div>
                          }
                        >
                          <div className="form-group" style={{ marginBottom: "15px" }}>
                            <label
                              style={{ display: "block", marginBottom: "5px", color: "#666" }}
                              htmlFor="formType"
                            >
                              Form Tipi
                            </label>
                            {/* <Select
                              style={{ width: "100%" }}
                              value={formikProps.values.formTypeText}
                              onChange={(e) => {
                                if (e.target.value == "2") formikProps.setFieldValue('formType', parseInt(e.target.value));

                                if (e.target.value !== '2') {
                                  formikProps.setFieldValue('workflowId', "");
                                  formikProps.setFieldValue('formType', parseInt(e.target.value));
                                }
                              }}
                              name="formType"
                            >
                              <Option value="">Seçiniz</Option>
                              {myFormTypes.map((types) => (
                                <Option key={types.id} value={String(types.id)}>
                                  {types.description}
                                </Option>
                              ))}
                            </Select> */}
                            <ComboBox
                              style={{ width: "100%" }}
                              onChange={(e) => {
                                
                                let formTypeId = myFormTypes.find(
                                  (x) => x.description == e.target.value
                                ).id;
                                
                                if (e.target.value == "2") {
                                  formikProps.setFieldValue("formType", formTypeId);
                                }

                                if (e.target.value !== "2") {
                                  
                                  formikProps.setFieldValue("workflowId", "");
                                  formikProps.setFieldValue("formType", formTypeId);
                                }
                              }}
                              name="formType"
                              placeholder="Seçiniz"
                              value={formikProps.values.formTypeText}
                            >
                              {myFormTypes.map((type) => (
                                <ComboBoxItem
                                  key={type.id}
                                  data-id={type.id}
                                  text={type.description!}
                                />
                              ))}
                            </ComboBox>

                            {formikProps.errors.formType && formikProps.touched.formType && (
                              <div style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
                                {formikProps.errors.formType}
                              </div>
                            )}
                          </div>

                          {formikProps.values.formType === 2 && (
                            <div className="form-group" style={{ marginBottom: "15px" }}>
                              <label
                                style={{ display: "block", marginBottom: "5px", color: "#666" }}
                                htmlFor="workflowId"
                              >
                                İş Akışı
                              </label>
                              {/* <Select
                                style={{ width: "100%" }}
                                value={formikProps.values.workFlowName || null}
                                onChange={(e) => {
                                  
                                  formikProps.setFieldValue('workflowId', e.target.value || null);
                                }}
                                name="workflowId"
                              >
                                <Option value="">Seçiniz</Option>
                                {myWorkFlowDefinations?.data?.map((type: any) => (
                                  <Option key={type.id} value={type.id}>
                                    {type.workflowName}
                                  </Option>
                                ))}
                              </Select> */}

                              <ComboBox
                                style={{ width: "100%" }}
                                onChange={(e) => {
                                  const selectedWorkflow = myWorkFlowDefinations?.data?.find(
                                    (workflow: any) => workflow.workflowName === e.target.value
                                  );

                                  
                                  formikProps.setFieldValue(
                                    "workflowId",
                                    selectedWorkflow?.id || null
                                  );
                                }}
                                name="workflowId"
                                placeholder="Seçiniz"
                                value={formikProps.values.workFlowName ?? ""}
                              >
                                {myWorkFlowDefinations?.data?.map((workflow: any) => (
                                  <ComboBoxItem
                                    key={workflow.id}
                                    data-id={workflow.id}
                                    text={workflow.workflowName}
                                  />
                                ))}
                              </ComboBox>
                              {formikProps.errors.workflowId && formikProps.touched.workflowId && (
                                <div style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
                                  {formikProps.errors.workflowId}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="form-group" style={{ marginBottom: "15px" }}>
                            <label
                              style={{ display: "block", marginBottom: "5px", color: "#666" }}
                              htmlFor="formCategory"
                            >
                              Form Kategorisi
                            </label>
                            {/* <Select
                              style={{ width: "100%" }}
                              value={formikProps.values.formCategoryText}
                              onChange={(e) => formikProps.setFieldValue("formCategory", parseInt(e.target.value))}
                              name="formCategory"
                            >
                              <Option value="">Seçiniz</Option>
                              {myFormCategories.map((category) => (
                                <Option key={category.id} value={String(category.id)}>
                                  {category.description}
                                </Option>
                              ))}
                            </Select> */}
                            <ComboBox
                              style={{ width: "100%" }}
                              onSelectionChange={(e) => {
                                let categoryId = myFormCategories.find(
                                  (x) => x.description == e.target.value
                                ).id;
                                
                                formikProps.setFieldValue("formCategory", categoryId);
                              }}
                              name="formCategory"
                              placeholder="Seçiniz"
                              value={formikProps.values.formCategoryText}
                            >
                              {myFormCategories.map((category) => (
                                <ComboBoxItem
                                  key={category.id}
                                  data-id={category.id}
                                  text={category.description!}
                                />
                              ))}
                            </ComboBox>
                            {formikProps.errors.formCategory &&
                              formikProps.touched.formCategory && (
                                <div style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
                                  {formikProps.errors.formCategory}
                                </div>
                              )}
                          </div>
                        </AccordionTab>

                        <AccordionTab
                          header={
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <i className="pi pi-sliders-h" style={{ color: "#FF9800" }}></i>
                              <span style={{ fontWeight: 500 }}>Diğer Ayarlar</span>
                            </div>
                          }
                        >
                          <div className="form-group" style={{ marginBottom: "15px" }}>
                            <label
                              style={{ display: "block", marginBottom: "5px", color: "#666" }}
                              htmlFor="formPriority"
                            >
                              Form Önceliği
                            </label>
                            {/* <Select
                              style={{ width: "100%" }}
                              value={formikProps.values.formPriortyText}
                              onChange={(e) => formikProps.setFieldValue("formPriority", parseInt(e.target.value))}
                              name="formPriority"
                            >
                              <Option value="">Seçiniz</Option>
                              {myFormPriorities.map((priority) => (
                                <Option key={priority.id} value={String(priority.id)}>
                                  {priority.description}
                                </Option>
                              ))}
                            </Select> */}
                            <ComboBox
                              onSelectionChange={(e) => {
                                let formPriorityId = myFormPriorities.find(
                                  (x) => x.description == e.target.value
                                ).id;
                                
                                formikProps.setFieldValue("formPriority", formPriorityId);
                              }}
                              style={{ width: "100%" }}
                              name="formPriority"
                              placeholder="Seçiniz"
                              value={formikProps.values.formPriortyText}
                            >
                              {myFormPriorities.map((priorty) => (
                                <ComboBoxItem
                                  key={priorty.id}
                                  data-id={priorty.id}
                                  text={priorty.description!}
                                />
                              ))}
                            </ComboBox>
                          </div>

                          <div
                            className="form-group"
                            style={{
                              marginBottom: "15px",
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                            }}
                          >
                            <label style={{ color: "#666" }} htmlFor="isActive">
                              Aktif mi?
                            </label>
                            <CheckBox
                              id="check"
                              name="isActive"
                              checked={Boolean(formikProps.values.isActive)}
                              onChange={(e) =>
                                formikProps.setFieldValue("isActive", e.target.checked ? 1 : 0)
                              }
                            />
                          </div>

                          <div
                            className="form-group"
                            style={{
                              marginBottom: "15px",
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                            }}
                          >
                            <label style={{ color: "#666" }} htmlFor="showInMenu">
                              Menüde Gösterilsin mi?
                            </label>
                            <CheckBox
                              id="check"
                              name="showInMenu"
                              checked={Boolean(formikProps.values.showInMenu)}
                              onChange={(e) =>
                                formikProps.setFieldValue("showInMenu", e.target.checked ? 1 : 0)
                              }
                            />
                          </div>
                        </AccordionTab>
                      </Accordion>
                      <Button
                        type="Submit"
                        style={{
                          width: "100%",
                          marginTop: "20px",
                          padding: "12px",
                          backgroundColor: "#4CAF50",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          boxShadow: "0 2px 4px rgba(76,175,80,0.2)",
                          transition: "all 0.3s ease",
                        }}
                        onClick={() => {
                          
                          // formikProps.submitForm();
                          saveForm(formikProps.values);
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = "#43A047";
                          e.currentTarget.style.boxShadow = "0 4px 8px rgba(76,175,80,0.3)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = "#4CAF50";
                          e.currentTarget.style.boxShadow = "0 2px 4px rgba(76,175,80,0.2)";
                        }}
                      >
                        Kaydet
                      </Button>
                    </form>
                  </AccordionTab>
                </Accordion>
              </SplitterPanel>
            </Splitter>
          </TabPanel>
          <TabPanel value="2">
            <Splitter style={{ height: "calc(100vh - 200px)" }}>
              <SplitterPanel className="flex align-items-center justify-content-center" size={100}>
                <Box
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    bgcolor: "#1e1e1e",
                  }}
                >
                  <Box sx={{ p: 1, display: "flex", gap: 1, justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <Button
                        onClick={() => {
                          const fileName = `${formikProps.values.formName || "DefaultForm"}.js`;
                          const blob = new Blob([generateJavaScript(jsonSchema)], {
                            type: "text/javascript",
                          });
                          const url = window.URL.createObjectURL(blob);
                          const link = document.createElement("a");
                          link.href = url;
                          link.download = fileName;
                          link.click();
                          window.URL.revokeObjectURL(url);
                        }}
                      >
                        JavaScript Kodunu Kaydet
                      </Button>
                      <Button
                        onClick={() => setShowPreviewModal(true)}
                        style={{ backgroundColor: "#28a745", color: "white" }}
                      >
                        Çalıştır
                      </Button>
                    </div>
                  </Box>
                  <Editor
                    height="calc(100% - 48px)"
                    defaultLanguage="javascript"
                    value={jsEditorValue}
                    onChange={(value) => value && setJsEditorValue(value)}
                    theme="vs-dark"
                    options={{
                      readOnly: false,
                      minimap: { enabled: true },
                      fontSize: 14,
                      lineNumbers: "on",
                      scrollBeyondLastLine: false,
                      wordWrap: "on",
                      formatOnPaste: true,
                      formatOnType: true,
                      suggestOnTriggerCharacters: true,
                      fontFamily: "'Fira Code', monospace",
                      fontLigatures: true,
                      renderLineHighlight: "all",
                      cursorBlinking: "smooth",
                      cursorSmoothCaretAnimation: true,
                    }}
                  />
                </Box>
              </SplitterPanel>
            </Splitter>
          </TabPanel>
          <TabPanel value="3">
            <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <div id="preview-container">
                <div
                  id="form-error"
                  style={{ display: "none", color: "red", margin: "10px" }}
                ></div>
                <Form
                  form={jsonSchema}
                  options={{ readOnly: false }}
                  onRender={() => {
                    const script = document.createElement("script");
                    script.id = "form-handler-script";
                    script.innerHTML = jsEditorValue;
                    document.body.appendChild(script);
                  }}
                />
              </div>
            </Box>
          </TabPanel>
          <TabPanel value="4">
            <Box
              sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: "#1e1e1e" }}
            >
              <Box sx={{ p: 1, display: "flex", gap: 1 }}>
                <Button
                  onClick={() => {
                    const fileName = `${formikProps.values.formName || "DefaultForm"}.json`;
                    const blob = new Blob([JSON.stringify(jsonSchema, null, 2)], {
                      type: "application/json",
                    });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = fileName;
                    link.click();
                    window.URL.revokeObjectURL(url);
                  }}
                >
                  JSON Dosyasını Kaydet
                </Button>
              </Box>
              <Editor
                height="calc(100vh - 200px)"
                defaultLanguage="json"
                value={JSON.stringify(jsonSchema, null, 2)}
                theme="vs-dark"
                onChange={(value) => {
                  try {
                    if (value) {
                      const newSchema = JSON.parse(value);
                      setSchema(newSchema);
                      setJsonEditorValue(value);
                    }
                  } catch (error) {
                    console.error("JSON parse hatası:", error);
                  }
                }}
                options={{
                  readOnly: false,
                  minimap: { enabled: true },
                  fontSize: 14,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  formatOnPaste: true,
                  formatOnType: true,
                  suggestOnTriggerCharacters: true,
                  fontFamily: "'Fira Code', monospace",
                  fontLigatures: true,
                  renderLineHighlight: "all",
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: true,
                }}
              />
            </Box>
          </TabPanel>
        </TabContext>

        <Dialog
          header={`${formikProps.values.formName || "Form"} Önizleme`}
          visible={showPreviewModal}
          style={{ width: "80vw", height: "80vh" }}
          onHide={() => setShowPreviewModal(false)}
          maximizable
        >
          <div style={{ height: "calc(100% - 40px)", overflow: "auto" }}>
            <Form
              form={jsonSchema}
              options={{ readOnly: false }}
              onRender={() => {
                const script = document.createElement("script");
                script.id = "form-handler-script";
                script.innerHTML = jsEditorValue;
                document.body.appendChild(script);
              }}
            />
          </div>
        </Dialog>
      </DashboardLayout>
    </>
  );
};
export default ParamtetersDefination;
