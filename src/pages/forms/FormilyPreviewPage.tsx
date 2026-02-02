import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FormDataApi } from "api/generated";
import getConfiguration from "confiuration";

// Antd + Formily render
import "antd/dist/antd.css";
import { Spin, Alert, Button as AntButton, message, Card as AntdCard, Slider as AntdSlider, Rate as AntdRate, Tag } from "antd";
import { createForm } from "@formily/core";
import { FormProvider, createSchemaField } from "@formily/react";
import * as AntdFormily from "@formily/antd";
import * as Icons from "@ant-design/icons";

// FormNeo layout
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import { Typography } from "@mui/material";

// Custom components - Formily için
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
} from "layouts/pages/FormEditor/custom/StandardComboboxes";

interface FormButton {
  id: string;
  label: string;
  type?: "primary" | "default" | "dashed" | "link" | "text";
  icon?: string;
  action?: string;
}

export default function FormilyPreviewPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schema, setSchema] = useState<any>(null);
  const [formButtons, setFormButtons] = useState<FormButton[]>([]);
  const [formName, setFormName] = useState<string>("");
  const [revision, setRevision] = useState<number | undefined>(undefined);
  const [publicationStatus, setPublicationStatus] = useState<number>(1);

  const form = useMemo(() => createForm(), []);
  const SchemaField = useMemo(
    () => createSchemaField({ 
      components: { 
        ...(AntdFormily as any), 
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

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const conf = getConfiguration();
        const api = new FormDataApi(conf);
        const res = await api.apiFormDataIdGet(id);
        const data = res?.data as any;
        
        // Form bilgilerini kaydet
        setFormName(data?.formName || "Form");
        if (typeof data?.revision === "number") setRevision(data.revision);
        if (typeof data?.publicationStatus === "number") setPublicationStatus(data.publicationStatus);
        
        const designStr = data?.formDesign;
        let parsed: any = null;
        try { parsed = designStr ? JSON.parse(designStr) : null; } catch {}
        // If not a Formily design, fallback to old viewer route
        if (!parsed || !parsed.schema) {
          navigate(`/forms/view/${id}`, { replace: true });
          return;
        }
        setSchema(parsed.schema);
        // Button paneli bilgilerini yükle
        if (parsed.buttonPanel && parsed.buttonPanel.buttons) {
          setFormButtons(parsed.buttonPanel.buttons);
        }
      } catch (e: any) {
        setError(e?.message || "Unable to load form");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox px={2} py={2}>
        <MDBox mb={2} display="flex" alignItems="center" gap={2}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 600, color: "#344767" }}>
            Form Önizleme
          </Typography>
          {formName && (
            <Typography variant="body1" sx={{ color: "#7b809a", fontWeight: 500 }}>
              - {formName}
            </Typography>
          )}
          {typeof revision === "number" && (
            <Tag color="blue" style={{ fontSize: "13px", padding: "2px 8px" }}>
              Revizyon #{revision}
            </Tag>
          )}
          {publicationStatus === 2 ? (
            <Tag color="green" style={{ fontSize: "13px", padding: "2px 8px" }}>
              Yayınlanmış
            </Tag>
          ) : publicationStatus === 3 ? (
            <Tag style={{ fontSize: "13px", padding: "2px 8px" }}>
              Arşivlenmiş
            </Tag>
          ) : (
            <Tag color="default" style={{ fontSize: "13px", padding: "2px 8px" }}>
              Taslak
            </Tag>
          )}
        </MDBox>
        {loading && (
          <MDBox p={2}><Spin /></MDBox>
        )}
        {!loading && error && (
          <MDBox p={2}><Alert type="error" message={error} /></MDBox>
        )}
        {!loading && !error && schema && (
          <>
            <MDBox p={2} sx={{ backgroundColor: "#fff", borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", marginBottom: formButtons.length > 0 ? "80px" : "0" }}>
              <FormProvider form={form}>
                <AntdFormily.Form>
                  <AntdFormily.FormLayout layout="horizontal" labelAlign="left" labelCol={6} wrapperCol={18} size="default">
                    <SchemaField schema={schema} />
                  </AntdFormily.FormLayout>
                </AntdFormily.Form>
              </FormProvider>
            </MDBox>
            {/* Button Paneli - En Alta Sabitlenmiş */}
            {formButtons.length > 0 && (
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
                        message.info(`Buton tıklandı: ${btn.label}${btn.action ? ` (Action: ${btn.action})` : ""}`);
                      }}
                    >
                      {btn.label}
                    </AntButton>
                  );
                })}
              </div>
            )}
          </>
        )}
      </MDBox>
    </DashboardLayout>
  );
}


