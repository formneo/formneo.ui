/**
 * EvetHayirConditionTab - Evet/Hayır çıkışlı koşul node'unun properties paneli.
 * FormConditionBuilder kullanır, form design'a uyumlu koşul tanımlar.
 */
import React, { useState, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
} from "@mui/material";
import { formatQuery } from "react-querybuilder";
import MDButton from "components/MDButton";
import { Icon } from "@mui/material";
import FormConditionBuilder from "../components/FormConditionBuilder";

const EvetHayirConditionTab = ({
  node,
  nodes = [],
  edges = [],
  parsedFormDesign,
  selectedForm,
  onButtonClick,
}) => {
  const [formNodeId, setFormNodeId] = useState(node?.data?.formNodeId || "");
  const [query, setQuery] = useState(
    node?.data?.query || { combinator: "and", rules: [] }
  );

  const formNodes = useMemo(() => {
    return nodes.filter((n) => n.type === "formNode");
  }, [nodes]);

  const selectedFormNode = useMemo(() => {
    if (!formNodeId) return null;
    return nodes.find((n) => n.id === formNodeId);
  }, [formNodeId, nodes]);

  const formDesign = useMemo(() => {
    if (selectedFormNode) {
      const nodeDesign = selectedFormNode.data?.parsedFormDesign;
      if (nodeDesign?.fields?.length > 0) return nodeDesign;
      if (nodeDesign?.raw?.components) return { raw: nodeDesign.raw, fields: nodeDesign.fields };
      const formId = selectedFormNode.data?.formId || selectedFormNode.data?.selectedFormId;
      if (formId && selectedForm?.id === formId && selectedForm?.formDesign) {
        try {
          return typeof selectedForm.formDesign === "string"
            ? JSON.parse(selectedForm.formDesign)
            : selectedForm.formDesign;
        } catch {
          return parsedFormDesign;
        }
      }
    }
    return parsedFormDesign || selectedForm?.formDesign;
  }, [selectedFormNode, parsedFormDesign, selectedForm]);

  const handleSave = useCallback(() => {
    if (!query?.rules?.length) {
      alert("Lütfen en az bir koşul kuralı ekleyin");
      return;
    }

    let summary = "";
    try {
      summary = formatQuery(query, "sql") || "";
    } catch {
      summary = `${query.rules.length} kural`;
    }

    const nodeData = {
      ...node?.data,
      formNodeId: formNodeId || undefined,
      formId: selectedFormNode?.data?.selectedFormId,
      formName: selectedFormNode?.data?.selectedFormName || selectedFormNode?.data?.name,
      query,
      jsonLogicRule: formatQuery(query, "jsonlogic"),
      summary,
    };

    if (onButtonClick) {
      onButtonClick({ id: node.id, data: nodeData });
    }
    alert("Koşul kaydedildi");
  }, [node, formNodeId, selectedFormNode, query, onButtonClick]);

  return (
    <Box sx={{ p: 2, height: "100%", overflow: "auto" }}>
      <Typography variant="h6" gutterBottom>
        Koşul (Evet/Hayır)
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Form alanlarına göre koşul tanımlayın. Koşul sağlanırsa <strong>Evet</strong>, sağlanmazsa <strong>Hayır</strong> çıkışına gidilir.
      </Typography>

      <Divider sx={{ my: 2 }} />

      {/* Form Node Seçimi - Opsiyonel, form varsa otomatik */}
      {formNodes.length > 1 && (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Form Kaynağı</InputLabel>
          <Select
            value={formNodeId}
            label="Form Kaynağı"
            onChange={(e) => {
              setFormNodeId(e.target.value);
              setQuery({ combinator: "and", rules: [] });
            }}
          >
            <MenuItem value="">Workflow formu kullan</MenuItem>
            {formNodes.map((fn) => (
              <MenuItem key={fn.id} value={fn.id}>
                {fn.data?.name || fn.data?.selectedFormName || fn.id}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {formNodes.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Workflow&apos;da form node yok. Koşul alanları workflow&apos;un seçili formundan alınacak.
        </Alert>
      )}

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
        Koşul Kuralları
      </Typography>

      <FormConditionBuilder
        formDesign={formDesign}
        query={query}
        onQueryChange={setQuery}
      />

      <Divider sx={{ my: 2 }} />

      <MDButton
        variant="gradient"
        color="info"
        startIcon={<Icon>save</Icon>}
        fullWidth
        onClick={handleSave}
        disabled={!query?.rules?.length}
      >
        Koşulu Kaydet
      </MDButton>
    </Box>
  );
};

export default EvetHayirConditionTab;
