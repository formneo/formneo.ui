
import { Link, useSearchParams } from "react-router-dom";
import { Form, FormBuilder, Formio, form } from "@formio/react";
import { useEffect, useRef, useState } from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
// Declaring props types for SimpleBlogCard
import "./style/Builder.css";
import * as Yup from "yup";
import { render } from "@fullcalendar/core/preact";
import { FormDataApi, FormRuntimeApi, FormRuntimeDto } from "api/generated";
import { AxiosResponse } from "axios";
import getConfiguration from "confiuration";

var formexisstData: FormRuntimeDto = null;

const ParameterEdit = (): JSX.Element => {


    const urlParams = new URLSearchParams(location.search);
    const [searchParams] = useSearchParams();
    const [formId, setFormId] = useState("");
    const isInitialMount = useRef(true);
    const [formData, setFormData] = useState<FormRuntimeDto>();
    const [isEdit, setisEdit] = useState<boolean>(false);
    const formRef = useRef(null);
    useEffect(() => {
        // Update the document title using the browser API

    });


    useEffect(() => {
        if (formData) {
            
        }
    }, [formData]);

    useEffect(() => {
        const fetchData = async () => {
            if (searchParams.get("formid") != null) {
                await getFormId(searchParams.get("formid").toString());
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

        var configuration = getConfiguration();
        let formtuntimeApi = new FormRuntimeApi(configuration);

        var that = this;
        await formtuntimeApi.apiFormRuntimeGetDetailIdGet(id).then((res: AxiosResponse<FormRuntimeDto>) => {

            
            setisEdit(true);
            setFormData(res.data);

            formexisstData = res.data;


            
        }).finally(() => {
            
        });

    }
    async function getFormId(id: any) {

        var configuration = getConfiguration();
        let formapi = new FormDataApi(configuration);
        let formDetail = await formapi.apiFormDataIdGet(id);
        
        setSchema(JSON.parse(formDetail.data.formDesign));
        setFormId(searchParams.get("formid").toString())
        if (searchParams.get("id") != null) {
            await getDetail(searchParams.get("id"));
        }
        else {


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

    const handleSubmit = (event: any) => {
        let formRuntimeDto2: FormRuntimeDto = {
            id: "",
            formId: "",
            valuesJson: "",
            valuesJsonData: ""
        };

        var configuration = getConfiguration();
        let formruntimeApi = new FormRuntimeApi(configuration);
        if (searchParams.get("id") == null) {
            
            let formRuntimeDto: FormRuntimeDto;
            formRuntimeDto2.formId = formId;
            formRuntimeDto2.valuesJson = JSON.stringify(event);
            formRuntimeDto2.valuesJsonData = JSON.stringify(event.data);
            formruntimeApi.apiFormRuntimePost(null,formRuntimeDto2);

        }
        else {
            
            let formRuntimeDto2: FormRuntimeDto = {};
            formRuntimeDto2.formId = formexisstData.formId;
            formRuntimeDto2.id = formexisstData.id;
            formRuntimeDto2.valuesJson = JSON.stringify(event);
            formRuntimeDto2.valuesJsonData = JSON.stringify(event.data);
            formruntimeApi.apiFormRuntimePut(formRuntimeDto2);

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
                }

                // Form submission event
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
export default ParameterEdit;


