
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Form, FormBuilder, Formio, form } from "@formio/react";
import { useEffect, useRef, useState } from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
// Declaring props types for SimpleBlogCard
import "../style/Builder.css";
import * as Yup from "yup";
import { render } from "@fullcalendar/core/preact";
import { FormAssignApi, FormDataApi, FormDataListDto, FormRuntimeApi, FormRuntimeDto } from "api/generated";
import { AxiosResponse } from "axios";
import getConfiguration from "confiuration";
import { v4 as uuidv4 } from 'uuid';
import { useBusy } from "layouts/pages/hooks/useBusy";

var formexisstData: FormRuntimeDto = null;

const ParameterView = (): JSX.Element => {

    const { formId } = useParams();
    const { formRunId } = useParams();
    const { isVisibility } = useParams();

    const location = useLocation();
    const formAssignId = location.state?.formAssignId;
    const [formWorkflowId, setformWorkflowId] = useState("");

    const urlParams = new URLSearchParams(location.search);
    const [searchParams] = useSearchParams();
    const [formsId, setFormsId] = useState("");
    const isInitialMount = useRef(true);
    const [formData, setFormData] = useState<FormRuntimeDto>();
    const [javaSciprtCode, setJavaScriptCode] = useState("");
    const [isEdit, setisEdit] = useState<boolean>(false);
    const formRef = useRef(null);
    const dispatchBusy = useBusy();
    const navigate = useNavigate();

    useEffect(() => {
        // Update the document title using the browser API

    });


    useEffect(() => {
        if (formData) {
            
        }
    }, [formData]);

    useEffect(() => {

        const fetchData = async () => {
            if (formId != null) {
                await getFormId(formId);
            }
        };

        fetchData();

        return () => {
            // Unmount Form Builder when component is unmounted
        };
    }, []);
    const [jsonSchema, setSchema] = useState({});


    const onFormChange = (schema: any) => {
        setSchema({ ...schema, components: [...schema.components] });
    };

    const getDetail = async (id: any) => {

        try {
            dispatchBusy({ isBusy: true });
            var configuration = getConfiguration();
            let formtuntimeApi = new FormRuntimeApi(configuration);

            var that = this;
            await formtuntimeApi.apiFormRuntimeGetDetailIdGet(id).then((res: AxiosResponse<FormRuntimeDto>) => {

                
                setisEdit(true);
                setFormData(res.data);

                formexisstData = res.data;

                
            }).finally(() => {
                
            });
        } catch (error) {
            console.error("Error:", error);
        }
        finally {
            dispatchBusy({ isBusy: false });
        }


    }
    async function getFormId(id: any) {
        try {
            console.log("form run id", formRunId)
            dispatchBusy({ isBusy: true });
            var configuration = getConfiguration();
            let formapi = new FormDataApi(configuration);
            let formDetail = await formapi.apiFormDataIdGet(id);
            
            setformWorkflowId(formDetail.data.workFlowDefinationId);
            setJavaScriptCode(formDetail.data.javaScriptCode);
            setSchema(JSON.parse(formDetail.data.formDesign));
            setFormsId(id)
            if (formRunId != undefined) {
                await getDetail(formRunId);
            }

        } catch (error) {
            console.error("Error:", error);
        }
        finally {
            dispatchBusy({ isBusy: false });
        }



    }

    const initialValues = {
        formName: '', // Eğer InputText'e bağlamak istediğiniz alan bu alansa buraya ekleyin
        formDescription: '', // Eğer InputText'e bağlamak istediğiniz alan bu alansa buraya ekleyin
        Revision: '', // Eğer InputText'e bağlamak istediğiniz alan bu alansa buraya ekleyin
        // Diğer form alanları buraya eklenebilir
    };
    const validationSchema = Yup.object().shape({
        formName: Yup.string().required('Bu alan boş bırakılamaz'),
        // Diğer form alanlarına ait doğrulama kurallarını buraya ekleyebilirsiniz
    });

    const handleSubmit = async (event: any) => {
        try {
            dispatchBusy({ isBusy: true });
            let formRuntimeDto2: FormRuntimeDto = {
                id: "",
                formId: "",
                valuesJson: "",
                valuesJsonData: "",
                isActive: false,
            };

            var configuration = getConfiguration();
            let formruntimeApi = new FormRuntimeApi(configuration);
            
            
            
            
            if (formexisstData == null) {
                
                formRuntimeDto2.id = uuidv4();
                formRuntimeDto2.formId = formsId;
                formRuntimeDto2.valuesJson = JSON.stringify(event);
                formRuntimeDto2.valuesJsonData = JSON.stringify(event.data);
                formRuntimeDto2.isActive = true;
                await formruntimeApi.apiFormRuntimePost(formAssignId,formRuntimeDto2);
            }
            else {
                
                let formRuntimeDto2: FormRuntimeDto = {};
                formRuntimeDto2.formId = formexisstData.formId;
                formRuntimeDto2.id = formRunId;
                formRuntimeDto2.valuesJson = JSON.stringify(event);
                formRuntimeDto2.valuesJsonData = JSON.stringify(event.data);
                formRuntimeDto2.isActive = true;
                
                await formruntimeApi.apiFormRuntimePut(formRuntimeDto2);
            }
        }
        catch (error) {
            console.error("Error:", error);
        }
        finally {
            dispatchBusy({ isBusy: false });
            navigate(-1);
        }

    };
    const handleChange = (submission: any) => {

        

        if (submission.isValid) {
            setFormData(submission.data);
        }

    };



    useEffect(() => {
        if (jsonSchema && formRef.current) {
            Formio.createForm(formRef.current, jsonSchema).then((form) => {
                if (formData && formData.valuesJson) {
                    form.submission = JSON.parse(formData.valuesJson);
                }
            });
        }
    }, [jsonSchema, formData]);




    useEffect(() => {
        if (jsonSchema && formRef.current) {
            Formio.createForm(formRef.current, jsonSchema).then((form) => {
                if (formData && formData.valuesJson) {
                    form.submission = JSON.parse(formData.valuesJson);
                    const submitBtn = form.getComponent('submit');
                    
                    if (isVisibility == "true") {


                        if (submitBtn) {
                            const btnElement = submitBtn.element;
                            if (btnElement) {
                                btnElement.style.display = 'none';  // ya da btnElement.remove();
                            }
                        }

                        form.components.forEach((a: any) => {
                            a._disabled = true;
                            a._visible = false;
                            if (a.component.type == "button") {
                                a.component.hidden = true;
                            }
                        })
                    }




                    const savedCode = `
                    // Kullanıcıdan gelen kayıtlı kod
                    form.on('submit', (submission) => {
                      alert('Form gönderildi!');
                      
                    });

                    const tf = form.getComponent('textField');
                    if (tf) {
                      tf.on('change', (e) => 
                    }
                    `;

                    const func = new Function("form", javaSciprtCode);
                    func(form);
                    // **Yöntem 1: Formio'nun güvenli değerlendirme fonksiyonunu kullanma (tercih edilir)**
                    try {
                        // instance.evaluate ile kodu çalıştır (Formio korumalı eval kullanır)
                        form.instance.evaluate("alert('hello rowld')");
                        // Not: instance.evaluate, Formio'nun her bileşende veya form nesnesinde bulunan,
                        // kodu güvenli bağlamda çalıştıran bir yöntemdir&#8203;:contentReference[oaicite:13]{index=13}.
                        // Genellikle custom validation ve calculated value işlemlerinde kullanılır.



                    } catch (err) {
                        console.error("Custom script evaluation error:", err);
                    }

                }
                form.on("submit", handleSubmit);
            });
        }
    }, [jsonSchema, formData]);

    return (


        <>

            <DashboardLayout  >
                <DashboardNavbar />
                <div ref={formRef} id="formio" onSubmit={handleSubmit} />
            </DashboardLayout>
        </>

    );
};
export default ParameterView;


