/**
 * Formily Reaction Editor Demo
 *
 * Form önizlemesi + x-reactions düzenleyici.
 * FormTask modalinden yönlendirildiğinde FormTask modu: kaydet ve geri dön.
 */
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createForm } from "@formily/core";
import { FormProvider, createSchemaField } from "@formily/react";
import { Form, FormItem, Input, Select, NumberPicker } from "@formily/antd";
import { Card, Button, Space, Divider, message } from "antd";
import FormTaskReactionsSetter from "../WorkFlow/propertiespanel/FormTaskReactionsSetter";
import { useFormWorkflowScope } from "utils/formWorkflowScope";

import "antd/dist/antd.css";
import "./FormEditorReactions.css";

const STORAGE_KEY_REACTIONS_PENDING = "formTask_reactions_pending";
const STORAGE_KEY_REACTIONS_RESULT = "formTask_reactions_result";

const SchemaField = createSchemaField({
  components: {
    FormItem,
    Input,
    Select,
    NumberPicker,
  },
});

const FormBuilderWithReactions = () => {
  const navigate = useNavigate();
  const [formTaskData, setFormTaskData] = useState<{
    formReactions: any;
    formSchema: { schema: any; form?: any } | null;
    formFieldPaths: { label: string; value: string; key: string }[];
    nodeId: string;
    returnTo: string;
  } | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY_REACTIONS_PENDING);
      if (raw) {
        const data = JSON.parse(raw);
        setFormTaskData({
          formReactions: data.formReactions,
          formSchema: data.formSchema,
          formFieldPaths: data.formFieldPaths || [],
          nodeId: data.nodeId,
          returnTo: data.returnTo || "/workflowList",
        });
        sessionStorage.removeItem(STORAGE_KEY_REACTIONS_PENDING);
      }
    } catch {
      setFormTaskData(null);
    }
  }, []);

  // Form schema state
  const [schema, setSchema] = useState<{
    type: string;
    properties: Record<string, any>;
  }>({
    type: "object",
    properties: {
      country: {
        type: "string",
        title: "Ülke",
        "x-decorator": "FormItem",
        "x-component": "Select",
        enum: [
          { label: "Türkiye", value: "TR" },
          { label: "ABD", value: "US" },
          { label: "İngiltere", value: "UK" },
        ],
      },
      age: {
        type: "number",
        title: "Yaş",
        "x-decorator": "FormItem",
        "x-component": "NumberPicker",
      },
      email: {
        type: "string",
        title: "Email",
        "x-decorator": "FormItem",
        "x-component": "Input",
      },
      city: {
        type: "string",
        title: "Şehir",
        "x-decorator": "FormItem",
        "x-component": "Select",
        enum: [
          { label: "Ankara", value: "ankara" },
          { label: "İstanbul", value: "istanbul" },
          { label: "İzmir", value: "izmir" },
        ],
        "x-reactions": null as any,
      },
    },
  });

  // Şu an düzenlenen alan
  const [selectedField, setSelectedField] = useState("city");

  // Form instance
  const form = useMemo(() => createForm(), []);
  const workflowScope = useFormWorkflowScope(form);

  // formDesign: ReactionsSetter Designer için - FormTask modunda formSchema kullan
  const formDesign = useMemo(
    () =>
      formTaskData?.formSchema
        ? formTaskData.formSchema
        : schema
          ? { schema, form: {} }
          : null,
    [schema, formTaskData?.formSchema]
  );

  // FormTask modunda düzenlenen reaction
  const [formTaskReactions, setFormTaskReactions] = useState<any>(null);

  // Reaction güncelleme
  const handleReactionChange = (reactions: any) => {
    if (formTaskData) {
      setFormTaskReactions(reactions);
      message.success("Reaction güncellendi!");
    } else {
      setSchema({
        ...schema,
        properties: {
          ...schema.properties,
          [selectedField]: {
            ...((schema.properties as Record<string, any>)[selectedField] ?? {}),
            "x-reactions": reactions,
          },
        },
      });
      message.success("Reaction kaydedildi!");
    }
  };

  // FormTask: Kaydet ve Geri Dön
  const handleFormTaskSaveAndReturn = () => {
    if (!formTaskData) return;
    const result = formTaskReactions ?? formTaskData.formReactions;
    sessionStorage.setItem(
      STORAGE_KEY_REACTIONS_RESULT,
      JSON.stringify({ nodeId: formTaskData.nodeId, formReactions: result })
    );
    message.success("Reaction kaydedildi!");
    navigate(formTaskData.returnTo);
  };

  // Schema göster
  const handleShowSchema = () => {
    console.log("📋 Current Schema:", schema);
    message.info("Schema console'da gösterildi");
  };

  const reactionValue = formTaskData
    ? formTaskReactions ?? formTaskData.formReactions
    : (schema.properties as Record<string, any>)[selectedField]?.["x-reactions"];

  // FormTask modu: sadece reaction editörü - tam sayfa, modal yok, dropdown'lar düzgün çalışır
  if (formTaskData) {
    return (
      <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
        <h1>Formily x-reactions Düzenleyici</h1>
        <p style={{ color: "#666", marginBottom: 16 }}>
          Tam sayfa editör - Source alanında tıklayarak seçim yapabilirsiniz.
        </p>
        <Card title="Formily x-reactions">
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            {formDesign ? (
              <FormTaskReactionsSetter
                formDesign={formDesign}
                value={reactionValue}
                onChange={handleReactionChange}
              />
            ) : (
              <div style={{ padding: 24, textAlign: "center", color: "#999" }}>
                Form şeması yükleniyor...
              </div>
            )}
            <div>
              <Button type="primary" size="large" onClick={handleFormTaskSaveAndReturn}>
                Kaydet ve Geri Dön
              </Button>
              <Button style={{ marginLeft: 8 }} onClick={() => navigate(formTaskData.returnTo)}>
                İptal
              </Button>
            </div>
          </Space>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <h1>Formily Reaction Editor Demo</h1>

      <div style={{ display: "flex", gap: 24 }}>
        {/* Sol Panel: Form Preview */}
        <Card
          title="Form Önizleme"
          style={{ flex: 1 }}
          extra={<Button onClick={handleShowSchema}>Schema&apos;yı Göster</Button>}
        >
          <FormProvider form={form}>
            <Form layout="vertical">
              <SchemaField schema={schema} scope={workflowScope} />
            </Form>
          </FormProvider>

          <Divider />

          <div>
            <h4>Form Değerleri:</h4>
            <pre style={{ background: "#f5f5f5", padding: 12, borderRadius: 4 }}>
              {JSON.stringify(form.values, null, 2)}
            </pre>
          </div>
        </Card>

        {/* Sağ Panel: Reaction Editor */}
        <Card title="Reaction Düzenleyici" style={{ flex: 1 }}>
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            {/* Alan Seçici */}
            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
                Düzenlenecek Alan:
              </label>
              <Select
                style={{ width: "100%" }}
                value={selectedField}
                onChange={(v: string) => setSelectedField(v)}
                options={Object.keys(schema.properties).map((key) => ({
                  label: (schema.properties[key] as any)?.title || key,
                  value: key,
                }))}
              />
            </div>

            <Divider />

            {/* Reaction Editor */}
            <div>
              <h4>Reaction Ayarları:</h4>
              <FormTaskReactionsSetter
                formDesign={formDesign}
                value={reactionValue}
                onChange={handleReactionChange}
              />
            </div>

            <Divider />

            {/* Mevcut Reaction Göster */}
            <div>
              <h4>Mevcut Reaction:</h4>
              <pre
                style={{
                  background: "#f5f5f5",
                  padding: 12,
                  borderRadius: 4,
                  maxHeight: 300,
                  overflow: "auto",
                }}
              >
                {JSON.stringify(reactionValue, null, 2) || "Henüz reaction eklenmedi"}
              </pre>
            </div>
          </Space>
        </Card>
      </div>

      {/* Kullanım Örnekleri */}
      <Card title="Örnek Senaryolar" style={{ marginTop: 24 }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <div>
            <h4>Senaryo 1: Ülke seçilince şehir görünsün</h4>
            <p>1. &quot;city&quot; alanını seç</p>
            <p>2. Dependencies&apos;e &quot;country&quot; ekle</p>
            <p>3. State&apos;de visible: <code>{"{{$deps.country !== ''}}"}</code></p>
          </div>

          <Divider />

          <div>
            <h4>Senaryo 2: Yaş 18&apos;den küçükse şehir disabled olsun</h4>
            <p>1. &quot;city&quot; alanını seç</p>
            <p>2. Dependencies&apos;e &quot;age&quot; ekle</p>
            <p>3. State&apos;de disabled: <code>{"{{$deps.age < 18}}"}</code></p>
          </div>

          <Divider />

          <div>
            <h4>Senaryo 3: Türkiye seçilince başlık değişsin</h4>
            <p>1. &quot;city&quot; alanını seç</p>
            <p>2. Dependencies&apos;e &quot;country&quot; ekle</p>
            <p>3. State&apos;de title:{" "}
              <code>
                {'{{$deps.country === "TR" ? "Türkiye Şehirleri" : "Şehir"}}'}
              </code>
            </p>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default FormBuilderWithReactions;
