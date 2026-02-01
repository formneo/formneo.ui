import React, { useState, useEffect } from "react";
import {
  Form,
  FormItem,
  Label,
  Input,
  TextArea,
  Button,
  Title,
  MessageStrip,
} from "@ui5/webcomponents-react";
import { Box } from "@mui/material";

interface FormNodeTabProps {
  initialValues?: any;
  node?: any;
  onButtonClick?: (payload: { id: string; data: any }) => void;
  selectedForm?: any;
}

const FormNodeTab: React.FC<FormNodeTabProps> = ({
  initialValues,
  node,
  onButtonClick,
  selectedForm,
}) => {
  const [formName, setFormName] = useState(initialValues?.name || selectedForm?.formName || "");
  const buttons = initialValues?.buttons || [];

  useEffect(() => {
    if (initialValues?.name) {
      setFormName(initialValues.name);
    }
  }, [initialValues]);

  const handleSave = () => {
    if (onButtonClick && node) {
      onButtonClick({
        id: node.id,
        data: {
          ...initialValues,
          name: formName,
        },
      });
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      <Title level="H4" style={{ marginBottom: "16px" }}>
        Form Node Özellikleri
      </Title>

      <Form>
        <FormItem label="Form Adı">
          <Input
            value={formName}
            onInput={(e: any) => setFormName(e.target.value)}
            placeholder="Form adını girin"
          />
        </FormItem>

        <FormItem label="Butonlar">
          {buttons.length > 0 ? (
            <div style={{ marginTop: "8px" }}>
              {buttons.map((button: any, index: number) => (
                <div
                  key={button.id || index}
                  style={{
                    padding: "8px",
                    marginBottom: "8px",
                    backgroundColor: "#f5f5f5",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                  }}
                >
                  <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                    {button.label || button.name || `Buton ${index + 1}`}
                  </div>
                  {button.action && (
                    <div style={{ fontSize: "0.85em", color: "#666" }}>
                      Action: {button.action}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <MessageStrip design="Information">
              Bu formda buton bulunmuyor. Form tasarımcısında buton ekleyin.
            </MessageStrip>
          )}
        </FormItem>
      </Form>

      <MessageStrip design="Information" sx={{ mt: 3 }}>
        <strong>💡 İpucu:</strong> Form başlangıç ayarlarını düzenlemek için Form Node&apos;a <strong>çift tıklayın</strong>.
        Otomatik değer atama, tarih, kullanıcı bilgisi gibi ayarları yapabilirsiniz.
      </MessageStrip>
    </div>
  );
};

export default FormNodeTab;

