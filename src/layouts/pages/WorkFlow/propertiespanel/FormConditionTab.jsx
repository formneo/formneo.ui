import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Divider,
  Alert,
  Stack,
  Paper,
} from "@mui/material";
import { Save as SaveIcon } from "@mui/icons-material";
import { formatQuery } from "react-querybuilder";
import MDButton from "components/MDButton";
import { Icon } from "@mui/material";
import { FormDataApi } from "api/generated";
import getConfiguration from "confiuration";

const FormConditionTab = ({
  node,
  nodes = [],
  edges = [],
  parsedFormDesign,
  selectedForm,
  onButtonClick,
}) => {
  const [formNodeId, setFormNodeId] = useState(node?.data?.formNodeId || "");
  const [field, setField] = useState(node?.data?.field || "");
  const [operator, setOperator] = useState(node?.data?.operator || "==");
  const [value, setValue] = useState(node?.data?.value || "");
  const [condition, setCondition] = useState(node?.data?.condition || "");
  
  // ✅ Query Builder state
  const [query, setQuery] = useState(
    node?.data?.query || { combinator: "and", rules: [] }
  );
  
  // ✅ API'den çekilen form state'i
  const [fetchedFormData, setFetchedFormData] = useState(null);

  // ✅ Form node'larını bul
  const formNodes = useMemo(() => {
    return nodes.filter((n) => n.type === "formNode");
  }, [nodes]);

  // ✅ Seçilen form node
  const selectedFormNode = useMemo(() => {
    if (!formNodeId) return null;
    return nodes.find((n) => n.id === formNodeId);
  }, [formNodeId, nodes]);

  // ✅ extractFieldsFromComponents helper fonksiyonu
  const extractFieldsFromComponents = useCallback((components) => {
    if (!components || !Array.isArray(components) || components.length === 0) {
      return [];
    }
    
    const fields = [];
    const excludedTypes = ["button", "submit", "reset", "dsbutton", "hidden", "dshidden", "file", "dsfile"];
    const excludedKeys = ["submit", "kaydet", "save", "button", "reset", "cancel", "iptal"];
    
    const traverse = (items) => {
      if (!items || !Array.isArray(items)) return;
      
      for (const item of items) {
        if (!item) continue;
        
        const isInput = item.input !== false && item.key;
        if (isInput) {
          const itemType = item.type || "";
          const itemKey = (item.key || "").toLowerCase();
          
          if (!excludedTypes.includes(itemType) && !excludedKeys.includes(itemKey)) {
            fields.push({
              name: item.key,
              label: item.label || item.key,
              type: item.type || "string",
            });
          }
        }
        
        if (item.columns && Array.isArray(item.columns)) {
          item.columns.forEach((col) => {
            if (col && col.components) {
              traverse(col.components);
            }
          });
        }
        
        if (item.components && Array.isArray(item.components)) {
          traverse(item.components);
        }
      }
    };
    
    traverse(components);
    return fields;
  }, []);

  // ✅ Form field'larını al - Çok agresif extraction stratejisi
  const formFields = useMemo(() => {
    if (!selectedFormNode) return [];
    
    const formNodeId = selectedFormNode.data?.formId || selectedFormNode.data?.selectedFormId;
    
    // 0. ÖNCE API'den çekilen güncel formDesign'dan extract et (EN ÖNCELİKLİ - GÜNCEL ALANLAR)
    if (fetchedFormData?.formDesign) {
      try {
        const raw =
          typeof fetchedFormData.formDesign === "string"
            ? JSON.parse(fetchedFormData.formDesign)
            : fetchedFormData.formDesign;

        if (raw?.components && Array.isArray(raw.components)) {
          const extracted = extractFieldsFromComponents(raw.components);
          if (extracted.length > 0) {
            return extracted;
          }
        }

        if (raw?.fields && Array.isArray(raw.fields) && raw.fields.length > 0) {
          return raw.fields;
        }
      } catch (e) {
        // ignore extraction errors
      }
    }
    
    // 1. Önce node'un kendi parsedFormDesign.fields'ından dene
    if (selectedFormNode?.data?.parsedFormDesign?.fields) {
      const fields = selectedFormNode.data.parsedFormDesign.fields;
      if (Array.isArray(fields) && fields.length > 0) {
        return fields;
      }
    }
    
    // 2. Node'un parsedFormDesign.raw.components'ından extract et
    if (selectedFormNode?.data?.parsedFormDesign?.raw?.components) {
      const extracted = extractFieldsFromComponents(selectedFormNode.data.parsedFormDesign.raw.components);
      if (extracted.length > 0) {
        return extracted;
      }
    }
    
    // 3. Global parsedFormDesign.fields'dan dene (formId eşleşiyorsa)
    if (parsedFormDesign?.fields && formNodeId && (formNodeId === selectedForm?.id || selectedFormNode?.data?.formId === selectedForm?.id)) {
      const fields = parsedFormDesign.fields;
      if (Array.isArray(fields) && fields.length > 0) {
        return fields;
      }
    }
    
    // 4. Global parsedFormDesign.raw.components'ından extract et (formId eşleşiyorsa)
    if (parsedFormDesign?.raw?.components && formNodeId && (formNodeId === selectedForm?.id || selectedFormNode?.data?.formId === selectedForm?.id)) {
      const extracted = extractFieldsFromComponents(parsedFormDesign.raw.components);
      if (extracted.length > 0) {
        return extracted;
      }
    }
    
    // 5. selectedForm.formDesign'dan extract et (formId eşleşiyorsa)
    if (formNodeId && selectedForm?.formDesign && (formNodeId === selectedForm?.id || selectedFormNode?.data?.formId === selectedForm?.id)) {
      try {
        const raw = JSON.parse(selectedForm.formDesign);
        if (raw?.components && Array.isArray(raw.components)) {
          const extracted = extractFieldsFromComponents(raw.components);
          if (extracted.length > 0) {
            return extracted;
          }
        }
      } catch (e) {}
    }
    
    // 6. selectedFormNode'un data'sında formDesign varsa ondan extract et
    if (selectedFormNode?.data?.formDesign) {
      try {
        const raw = typeof selectedFormNode.data.formDesign === 'string' 
          ? JSON.parse(selectedFormNode.data.formDesign)
          : selectedFormNode.data.formDesign;
        if (raw?.components && Array.isArray(raw.components)) {
          const extracted = extractFieldsFromComponents(raw.components);
          if (extracted.length > 0) {
            return extracted;
          }
        }
      } catch (e) {}
    }
    
    // 7. selectedFormNode'un data'sında workflowFormInfo varsa ondan formId al ve selectedForm ile eşleştir
    if (selectedFormNode?.data?.workflowFormInfo?.formId && selectedForm?.formDesign) {
      try {
        const raw = JSON.parse(selectedForm.formDesign);
        if (raw?.components && Array.isArray(raw.components)) {
          const extracted = extractFieldsFromComponents(raw.components);
          if (extracted.length > 0) {
            return extracted;
          }
        }
      } catch (e) {}
    }
    
    // 8. Tüm nodes içinde aynı formId'ye sahip başka bir node varsa ondan al
    if (formNodeId) {
      const otherFormNode = nodes.find(
        (n) => n.type === "formNode" && 
        (n.data?.formId === formNodeId || n.data?.selectedFormId === formNodeId) &&
        n.id !== selectedFormNode.id &&
        n.data?.parsedFormDesign?.fields
      );
      if (otherFormNode?.data?.parsedFormDesign?.fields) {
        const fields = otherFormNode.data.parsedFormDesign.fields;
        if (Array.isArray(fields) && fields.length > 0) {
          return fields;
        }
      }
    }
    
    return [];
  }, [selectedFormNode, parsedFormDesign, selectedForm, extractFieldsFromComponents, nodes, fetchedFormData]);
  
  // ✅ Form node seçildiğinde API'den form çek (GÜNCEL ALANLAR İÇİN)
  useEffect(() => {
    const fetchFormFromApi = async () => {
      if (!selectedFormNode) {
        setFetchedFormData(null);
        return;
      }
      
      const formId = selectedFormNode.data?.formId || 
                     selectedFormNode.data?.selectedFormId || 
                     selectedFormNode.data?.workflowFormInfo?.formId;
      
      if (!formId) {
        setFetchedFormData(null);
        return;
      }
      
      // Her zaman API'den çek - güncel alanlar için
      try {
        const conf = getConfiguration();
        const api = new FormDataApi(conf);
        const response = await api.apiFormDataIdGet(formId);
        
        if (response.data) {
          setFetchedFormData(response.data);
        }
      } catch (error) {
        setFetchedFormData(null);
      }
    };
    
    fetchFormFromApi();
  }, [selectedFormNode?.id, selectedFormNode?.data?.formId, selectedFormNode?.data?.selectedFormId]);

  // ✅ Condition string'i oluştur
  useEffect(() => {
    if (field && operator && value !== "") {
      const fieldLabel = formFields.find((f) => f.name === field)?.label || field;
      setCondition(`${fieldLabel} ${operator} ${value}`);
    } else {
      setCondition("");
    }
  }, [field, operator, value, formFields]);

  // ✅ FormNodeId seçildiğinde formName'i hemen güncelle
  useEffect(() => {
    if (formNodeId && selectedFormNode && onButtonClick) {
      const formName = selectedFormNode?.data?.selectedFormName || selectedFormNode?.data?.name || "";
      if (formName && node?.data?.formName !== formName) {
        onButtonClick({
          id: node.id,
          data: {
            ...node.data,
            formNodeId,
            formId: selectedFormNode?.data?.selectedFormId,
            formName,
          },
        });
      }
    }
  }, [formNodeId, selectedFormNode, node, onButtonClick]);

  // ✅ Kaydet
  const handleSave = () => {
    if (!formNodeId) {
      alert("Lütfen bir form node seçin");
      return;
    }
    if (!field || value === "") {
      alert("Lütfen field ve value girin");
      return;
    }

    const nodeData = {
      formNodeId,
      formId: selectedFormNode?.data?.selectedFormId,
      formName: selectedFormNode?.data?.selectedFormName || selectedFormNode?.data?.name,
      field,
      operator,
      value,
      condition,
    };

    if (onButtonClick) {
      onButtonClick({
        id: node.id,
        data: nodeData,
      });
    }
  };

  return (
    <Box sx={{ p: 2, height: "100%", overflow: "auto" }}>
      <Typography variant="h6" gutterBottom>
        Form Koşulu
      </Typography>
      
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Form node&apos;undaki component&apos;lere göre koşul tanımlayın
      </Typography>

      <Divider sx={{ my: 2 }} />

      {/* Form Node Seçimi */}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Form Node</InputLabel>
        <Select
          value={formNodeId}
          label="Form Node"
          onChange={(e) => {
            setFormNodeId(e.target.value);
            setField("");
            setValue("");
          }}
        >
          {formNodes.length === 0 ? (
            <MenuItem disabled value="">
              Form node bulunamadı
            </MenuItem>
          ) : (
            formNodes.map((formNode) => (
              <MenuItem key={formNode.id} value={formNode.id}>
                {formNode.data?.name || formNode.data?.selectedFormName || formNode.id}
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>

      {formNodes.length === 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Workflow&apos;da henüz form node&apos;u bulunmuyor. Lütfen önce bir form seçin ve form node&apos;u oluşturun.
        </Alert>
      )}

      {formNodes.length > 0 && !formNodeId && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Lütfen önce bir form node seçin. Bu koşul node&apos;u sadece form node&apos;larına bağlanabilir.
        </Alert>
      )}

      {formNodeId && formFields.length === 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Seçilen form node&apos;unda field bulunamadı. Lütfen form node&apos;unun form field&apos;larını kontrol edin.
        </Alert>
      )}

      {formNodeId && formFields.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Koşul Oluştur
          </Typography>

          {/* Query Builder */}
          <Box
            sx={{
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              p: 2,
              bgcolor: "#fafafa",
              mb: 2,
            }}
          >

          </Box>

          {/* Condition Preview */}
          {query && query.rules && query.rules.length > 0 && (
            <Paper sx={{ p: 2, mb: 2, bgcolor: "#f5f5f5" }}>
              <Typography variant="caption" color="textSecondary" gutterBottom>
                Koşul Özeti:
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: "monospace", mt: 1 }}>
                {formatQuery(query, "sql")}
              </Typography>
            </Paper>
          )}
        </>
      )}

      <Divider sx={{ my: 2 }} />

      <MDButton
        variant="gradient"
        color="info"
        startIcon={<Icon>save</Icon>}
        fullWidth
        onClick={handleSave}
        disabled={!formNodeId || !query || !query.rules || query.rules.length === 0}
      >
        Koşulu Kaydet
      </MDButton>
    </Box>
  );
};

export default FormConditionTab;

