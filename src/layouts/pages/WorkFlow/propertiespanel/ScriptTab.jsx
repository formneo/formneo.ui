import React, { useState, useEffect, useMemo, useCallback } from "react";
import { FormDataApi, FormApi } from "api/generated";
import getConfiguration from "confiuration";
import {
  Box,
  Typography,
  Divider,
  List,
  ListItem,
  ListSubheader,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Tabs,
  Tab,
  Alert,
  Paper,
} from "@mui/material";
import {
  Close as CloseIcon,
  Code as CodeIcon,
  Info as InfoIcon,
  CallSplit as CallSplitIcon,
  TableChart as TableChartIcon,
  TipsAndUpdates as TipsIcon,
} from "@mui/icons-material";
import { Editor } from "@monaco-editor/react";
import { Splitter, SplitterPanel } from "primereact/splitter";
import { PlayArrow as PlayIcon, Save as SaveIcon } from "@mui/icons-material";

const ScriptTab = ({
  node,
  nodes = [],
  edges = [],
  parsedFormDesign,
  selectedForm,
  onButtonClick,
  open = false,
  onClose,
}) => {
  const [script, setScript] = useState("");
  const [name, setName] = useState("Script");
  const [formInputsCache, setFormInputsCache] = useState({}); // Form input'ları cache'i (/api/Form/{id}/inputs)
  const [loadingInputs, setLoadingInputs] = useState(false); // Input'lar yükleniyor mu?
  const [activeTab, setActiveTab] = useState(0); // 0: Process Data & Script, 1: Koşul Rehberi

  // ✅ Node değiştiğinde state'i güncelle
  useEffect(() => {
    if (node?.data) {
      setScript(node.data.script || "");
      setName(node.data.name || "Script");
    }
  }, [node?.id, node?.data?.script, node?.data?.name]);

  // ✅ Modal açıldığında form inputs çek - tüm form node'ları dahil
  useEffect(() => {
    if (!open || !node?.id || !edges || !nodes) return;
    
    const fetchFormInputs = async () => {
      setLoadingInputs(true);
      
      try {
        const incomingEdges = edges.filter((edge) => edge.target === node.id);
        const incomingNodes = incomingEdges
          .map((edge) => nodes.find((n) => n.id === edge.source))
          .filter(Boolean);
        const formNodes = incomingNodes.filter((n) => n.type === "formNode" || n.type === "formTaskNode");

        const inputsCache = {};
        const formIdsToFetch = [];
        
        // Workflow form + ScriptNode form
        const scriptNodeFormId = node.data?.formId || node.data?.selectedFormId || node.data?.workflowFormInfo?.formId;
        if (scriptNodeFormId && !formInputsCache[scriptNodeFormId]) formIdsToFetch.push(scriptNodeFormId);
        if (selectedForm?.id && !formInputsCache[selectedForm.id]) formIdsToFetch.push(selectedForm.id);
        
        for (const formNode of formNodes) {
          const formId = formNode.data?.formId || formNode.data?.selectedFormId || formNode.data?.workflowFormInfo?.formId;
          if (formId && !formInputsCache[formId]) formIdsToFetch.push(formId);
        }
        
        // Sadece cache'de olmayan formId'ler için API çağrısı yap
        if (formIdsToFetch.length > 0) {
          for (const formId of formIdsToFetch) {
            try {
              const conf = getConfiguration();
              const formApi = new FormApi(conf);
              // ✅ GET /api/Form/{id}/inputs endpoint'ine istek yap
              const response = await formApi.apiFormIdInputsGet(formId);
              
              // Response data'yı cache'e kaydet
              if (response.data !== undefined && response.data !== null) {
                inputsCache[formId] = response.data;
              }
            } catch (error) {
              // ignore errors
            }
          }
          
          // Cache'i güncelle (sadece yeni çekilenler için)
          if (Object.keys(inputsCache).length > 0) {
            setFormInputsCache((prev) => ({ ...prev, ...inputsCache }));
          }
        }
      } finally {
        setLoadingInputs(false);
      }
    };

    fetchFormInputs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]); // Sadece modal açıldığında (open=true) çalışsın

  // ✅ extractFieldsFromComponents helper fonksiyonu - Formily ve Formio formatlarını destekler
  const extractFieldsFromComponents = useMemo(() => {
    return (components) => {
      if (!components) return [];
      
      const fields = [];
      const excludedTypes = ["button", "submit", "reset", "dsbutton", "hidden", "dshidden", "file", "dsfile"];
      const excludedKeys = ["submit", "kaydet", "save", "button", "reset", "cancel", "iptal"];
      
      // ✅ Formily formatı: schema.properties objesi (nested properties desteği ile)
      if (components.schema && components.schema.properties) {
        const traverseProperties = (props, parentPath = "") => {
          if (!props || typeof props !== "object") return;
          
          Object.keys(props).forEach((key) => {
            const prop = props[key];
            if (!prop || typeof prop !== "object") return;
            
            const componentType = prop["x-component"] || "";
            const itemKey = (key || "").toLowerCase();
            const propType = prop.type || "";
            
            // Void type (Card, FormLayout gibi container'lar) - nested properties'e git
            if (propType === "void" && prop.properties && typeof prop.properties === "object") {
              traverseProperties(prop.properties, parentPath ? `${parentPath}.${key}` : key);
            }
            // Normal field (string, number, vb.) - title varsa ekle
            else if (prop.title && propType !== "void") {
              // Button component'lerini hariç tut
              if (!componentType.toLowerCase().includes("button") && 
                  !excludedKeys.includes(itemKey) &&
                  !excludedTypes.includes(componentType.toLowerCase())) {
                fields.push({
                  name: key,
                  label: prop.title || key,
                  type: propType || "string",
                  component: componentType,
                });
              }
            }
            // Nested properties varsa (void olmayan ama properties'i olan)
            else if (prop.properties && typeof prop.properties === "object") {
              traverseProperties(prop.properties, parentPath ? `${parentPath}.${key}` : key);
            }
          });
        };
        
        traverseProperties(components.schema.properties);
        return fields;
      }
      
      // ✅ Formio formatı: components array'i
      if (Array.isArray(components) && components.length > 0) {
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
      }
      
      return fields;
    };
  }, []);

  // ✅ Form alanlarını API + parsedFormDesign'dan birleştir (tüm componentler)
  const getFormFieldsFromSource = useCallback((formId, source) => {
    const items = [];
    const seen = new Set();
    const add = (fieldId, fieldLabel, componentType) => {
      if (!fieldId || seen.has(fieldId)) return;
      seen.add(fieldId);
      items.push({ fieldId, fieldLabel, componentType });
    };

    // 1. API (formInputsCache)
    if (formId && formInputsCache[formId]) {
      try {
        const inputs = formInputsCache[formId];
        let arr = Array.isArray(inputs) ? inputs : inputs?.inputs || inputs?.fields || Object.values(inputs || {});
        (arr || []).forEach((i) => {
          const id = i.name || i.id || i.key || i.fieldName || "";
          add(id, i.label || i.title || i.fieldLabel || i.name || id, i.componentType || i.type || i.component || "unknown");
        });
      } catch (e) {}
    }

    // 2. parsedFormDesign (API'de eksik componentler varsa)
    if (source?.fields) {
      source.fields.forEach((f) => add(f.name || f.key, f.label || f.title || f.name, f.componentType || f.type || "unknown"));
    }
    if (source?.raw) {
      const raw = source.raw;
      let extracted = extractFieldsFromComponents(raw);
      if (extracted.length === 0 && raw?.components) extracted = extractFieldsFromComponents(raw.components);
      extracted.forEach((f) => add(f.name || f.key, f.label || f.title || f.name, f.component || f.componentType || "unknown"));
    }

    return items;
  }, [formInputsCache, extractFieldsFromComponents]);

  // ✅ Process Data: workflow + formData + previousNodes (formData, öncekiNode, global mantığı)
  const formFieldsList = useMemo(() => {
    const fields = [];
    const formId = node.data?.formId || node.data?.selectedFormId || node.data?.workflowFormInfo?.formId || selectedForm?.id;

    // 1. WORKFLOW (global değişkenler)
    [
      { fieldId: "instanceId", fieldLabel: "Workflow Instance ID", path: "workflow.instanceId" },
      { fieldId: "startTime", fieldLabel: "Başlangıç Zamanı", path: "workflow.startTime" },
      { fieldId: "currentStep", fieldLabel: "Mevcut Adım", path: "workflow.currentStep" },
      { fieldId: "formId", fieldLabel: "Form ID", path: "workflow.formId" },
      { fieldId: "formName", fieldLabel: "Form Adı", path: "workflow.formName" },
    ].forEach(({ fieldId, fieldLabel, path }) => {
      fields.push({
        fieldId,
        fieldLabel,
        componentType: "workflow",
        nodeName: "workflow",
        path,
        formId: null,
        section: "workflow",
      });
    });

    // 2. FORMDATA (form alanları - API + parsedFormDesign birleşik, tüm componentler)
    let rawDesign = parsedFormDesign?.raw;
    if (!rawDesign && selectedForm?.formDesign) {
      try {
        rawDesign = typeof selectedForm.formDesign === "string" ? JSON.parse(selectedForm.formDesign) : selectedForm.formDesign;
      } catch (e) {}
    }
    const formDesignSource = (parsedFormDesign || rawDesign) ? { raw: rawDesign || parsedFormDesign?.raw, fields: parsedFormDesign?.fields } : null;
    const formDataItems = getFormFieldsFromSource(formId, formDesignSource);
    formDataItems.forEach(({ fieldId, fieldLabel, componentType }) => {
      fields.push({
        fieldId,
        fieldLabel,
        componentType,
        nodeName: "formData",
        path: `formData.${fieldId}`,
        formId: formId || null,
        section: "formData",
      });
    });

    // 3. PREVIOUSNODES (tüm önceki node tipleri)
    if (node?.id && edges) {
      const incomingEdges = edges.filter((e) => e.target === node.id);
      incomingEdges.forEach((edge) => {
        const sourceNode = nodes.find((n) => n.id === edge.source);
        if (!sourceNode) return;
        const nodeName = sourceNode.data?.name || sourceNode.id;

        if (sourceNode.type === "formNode" || sourceNode.type === "formTaskNode") {
          const fid = sourceNode.data?.formId || sourceNode.data?.selectedFormId || sourceNode.data?.workflowFormInfo?.formId;
          const source = sourceNode.data?.parsedFormDesign || parsedFormDesign;
          const formItems = getFormFieldsFromSource(fid, source);
          fields.push({ fieldId: "action", fieldLabel: "Buton Action", componentType: "string", nodeName, path: `previousNodes.${nodeName}.action`, formId: fid, section: "previousNodes" });
          formItems.forEach(({ fieldId, fieldLabel, componentType }) => {
            fields.push({
              fieldId,
              fieldLabel,
              componentType,
              nodeName,
              path: `previousNodes.${nodeName}.formData.${fieldId}`,
              formId: fid,
              section: "previousNodes",
            });
          });
        } else if (sourceNode.type === "userTaskNode") {
          const outs = [
            { fieldId: "action", fieldLabel: "Buton Action", path: `previousNodes.${nodeName}.action` },
            { fieldId: "userId", fieldLabel: "User ID", path: `previousNodes.${nodeName}.userId` },
            { fieldId: "userName", fieldLabel: "User Name", path: `previousNodes.${nodeName}.userName` },
          ];
          outs.forEach(({ fieldId, fieldLabel, path }) => {
            fields.push({ fieldId, fieldLabel, componentType: "string", nodeName, path, formId: null, section: "previousNodes" });
          });
        } else if (sourceNode.type === "setFieldNode") {
          const outs = [
            { fieldId: "updatedFields", fieldLabel: "Güncellenen Alanlar", path: `previousNodes.${nodeName}.updatedFields` },
            { fieldId: "summary", fieldLabel: "Özet", path: `previousNodes.${nodeName}.summary` },
          ];
          outs.forEach(({ fieldId, fieldLabel, path }) => {
            fields.push({ fieldId, fieldLabel, componentType: "object", nodeName, path, formId: null, section: "previousNodes" });
          });
        } else if (sourceNode.type === "approverNode") {
          const outs = [
            { fieldId: "approvalStatus", fieldLabel: "Onay Durumu", path: `previousNodes.${nodeName}.approvalStatus` },
            { fieldId: "approverId", fieldLabel: "Onaylayan ID", path: `previousNodes.${nodeName}.approverId` },
          ];
          outs.forEach(({ fieldId, fieldLabel, path }) => {
            fields.push({ fieldId, fieldLabel, componentType: "string", nodeName, path, formId: null, section: "previousNodes" });
          });
        } else if (sourceNode.type === "scriptNode") {
          fields.push({ fieldId: "result", fieldLabel: "Script Sonucu", componentType: "boolean", nodeName, path: `previousNodes.${nodeName}.result`, formId: null, section: "previousNodes" });
        } else if (sourceNode.type === "queryConditionNode") {
          fields.push({ fieldId: "conditionResult", fieldLabel: "Koşul Sonucu", componentType: "boolean", nodeName, path: `previousNodes.${nodeName}.conditionResult`, formId: null, section: "previousNodes" });
        }
      });
    }

    return fields;
  }, [node?.id, node?.data?.formId, node?.data?.selectedFormId, node?.data?.workflowFormInfo?.formId, nodes, edges, formInputsCache, parsedFormDesign, selectedForm, getFormFieldsFromSource]);

  // ✅ Form alanını editor'e ekle
  const handleFieldClick = (fieldId, path) => {
    const editor = window.monacoEditorRef;
    if (editor) {
      const selection = editor.getSelection();
      // Tıklayınca ID'yi yaz (path yerine direkt fieldId veya path)
      editor.executeEdits("insert-variable", [
        {
          range: selection,
          text: path, // previousNodes.nodeName.fieldId formatında
        },
      ]);
    }
  };

  // ✅ Kaydet
  const handleSave = () => {
    if (!script.trim()) {
      alert("Lütfen bir script yazın");
      return;
    }

    const nodeData = {
      name,
      script,
      formFieldsList, // Form alanlarını da kaydet (runtime'da kullanılabilir)
    };

    if (onButtonClick) {
      onButtonClick({
        id: node.id,
        data: nodeData,
      });
    }

    alert("Script kaydedildi 🎉");
  };

  // ✅ Test et
  const handleTest = () => {
    try {
      // Syntax kontrolü ve boolean dönüş kontrolü
      const testFunction = new Function("workflow", "formData", "previousNodes", script);
      const result = testFunction(
        { instanceId: "test", startTime: new Date(), currentStep: 1, formId: "test", formName: "Test" },
        {},
        {}
      );
      
      if (typeof result !== "boolean") {
        alert(`⚠️ Script boolean döndürmüyor. Dönen değer: ${typeof result}. Script true veya false döndürmelidir.`);
        return;
      }
      
      alert(`Script syntax kontrolü başarılı ✅\nDönen değer: ${result} (${result ? "TRUE" : "FALSE"})`);
    } catch (error) {
      alert(`Script hatası: ${error.message}`);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: "700px",
          maxHeight: "90vh",
          borderRadius: "12px",
        },
      }}
    >
      <DialogTitle
        sx={{
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          color: "white",
          padding: "20px 24px",
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <CodeIcon sx={{ fontSize: "28px" }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "white" }}>
                Script Node
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.8)" }}>
                JavaScript koşulları ve işlemleri yazın
              </Typography>
              {selectedForm && (
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.9)", mt: 0.5, display: "block", fontWeight: 500 }}>
                  Form: {selectedForm.formName}
                </Typography>
              )}
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: "white" }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0, height: "600px" }}>
        {/* Form Başlangıç Ayarları gibi Tab yapısı */}
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{ borderBottom: 1, borderColor: "divider", backgroundColor: "#fafafa", px: 2 }}
        >
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TableChartIcon fontSize="small" />
                Process Data & Script
                {formFieldsList.length > 0 && (
                  <Chip label={formFieldsList.length} size="small" color="primary" />
                )}
              </Box>
            }
            sx={{ textTransform: "none", fontWeight: 600 }}
          />
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CallSplitIcon fontSize="small" />
                Koşul Rehberi
              </Box>
            }
            sx={{ textTransform: "none", fontWeight: 600 }}
          />
        </Tabs>

        {/* Tab 0: Process Data + Form Seçimi + Script (Form Başlangıç gibi) */}
        {activeTab === 0 && (
          <Splitter style={{ height: "100%", width: "100%", minHeight: "500px" }} layout="horizontal">
            <SplitterPanel size={30} minSize={20} style={{ overflow: "auto" }}>
              <Box sx={{ p: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Process Data
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: "block" }}>
                  Değişkenleri tıklayarak script&apos;e ekleyin
                </Typography>

                {loadingInputs ? (
                  <Box sx={{ textAlign: "center", py: 4 }}>
                    <Typography variant="body2" color="textSecondary">
                      Veriler yükleniyor...
                    </Typography>
                  </Box>
                ) : formFieldsList.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 4 }}>
                    <Typography variant="body2" color="textSecondary">
                      Process Data boş. Workflow formu seçin veya önceki node&apos;ları bağlayın.
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ width: "100%", maxHeight: "500px", overflowY: "auto" }}>
                    {["workflow", "formData", "previousNodes"].map((section) => {
                      const sectionItems = formFieldsList.filter((f) => f.section === section);
                      if (sectionItems.length === 0) return null;
                      const labels = { workflow: "Workflow (Genel)", formData: "Form Data", previousNodes: "Önceki Node'lar" };
                      return (
                        <React.Fragment key={section}>
                          <ListSubheader sx={{ bgcolor: "#f0f4f8", fontWeight: 600, color: "#334155" }}>
                            {labels[section]}
                          </ListSubheader>
                          {sectionItems.map((field, index) => (
                    <Tooltip
                      key={`${field.nodeName}-${field.fieldId}-${index}`}
                      title={
                        <Box>
                          <Typography variant="caption" display="block" fontWeight={600}>
                            Component: {field.componentType}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Node: {field.nodeName}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Path: {field.path}
                          </Typography>
                        </Box>
                      }
                      arrow
                      placement="right"
                    >
                      <ListItem
                        component="div"
                        onClick={() => handleFieldClick(field.fieldId, field.path)}
                        sx={{
                          py: 1,
                          px: 2,
                          cursor: "pointer",
                          borderBottom: "1px solid #e5e7eb",
                          "&:hover": { 
                            backgroundColor: "#f5f5f5",
                            transform: "translateX(4px)",
                            transition: "all 0.2s"
                          },
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontFamily: "monospace",
                                fontWeight: 600,
                                color: "#6366f1"
                              }}
                            >
                              {field.fieldId}
                            </Typography>
                            <Chip 
                              label={field.componentType} 
                              size="small" 
                              sx={{ 
                                height: "20px",
                                fontSize: "0.65rem",
                                bgcolor: "#e0e7ff",
                                color: "#6366f1"
                              }} 
                            />
                          </Box>
                          <Typography 
                            variant="caption" 
                            color="textSecondary"
                            sx={{ display: "block" }}
                          >
                            {field.fieldLabel}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            color="textSecondary"
                            sx={{ 
                              fontFamily: "monospace",
                              fontSize: "0.7rem",
                              display: "block",
                              mt: 0.5
                            }}
                          >
                            {field.path}
                          </Typography>
                        </Box>
                        <InfoIcon fontSize="small" sx={{ color: "#9ca3af", ml: 1 }} />
                      </ListItem>
                    </Tooltip>
                          ))}
                        </React.Fragment>
                      );
                    })}
                </List>
              )}
            </Box>
          </SplitterPanel>

          {/* Sağ Panel - Monaco Editor */}
          <SplitterPanel size={70} minSize={50} style={{ overflow: "hidden" }}>
            <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <Box sx={{ p: 2, borderBottom: "1px solid #e5e7eb" }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  JavaScript Editor
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: "block" }}>
                  Script true veya false döndürmelidir. Örnek: <code>return formData.amount &gt; 1000;</code>
                </Typography>
              </Box>

              <Box sx={{ flex: 1, position: "relative", minHeight: "500px" }}>
                <Editor
                  height="100%"
                  language="javascript"
                  theme="vs-light"
                  value={script}
                  onChange={(value) => setScript(value || "")}
                  onMount={(editor) => {
                    // Editor referansını global'e kaydet (tree item click için)
                    window.monacoEditorRef = editor;
                  }}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: "on",
                    roundedSelection: true,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    wordWrap: "on",
                    formatOnPaste: true,
                    formatOnType: true,
                    autoIndent: "full",
                    suggestOnTriggerCharacters: true,
                    acceptSuggestionOnEnter: "on",
                    padding: { top: 16, bottom: 16 },
                    renderLineHighlight: "all",
                  }}
                />
              </Box>
            </Box>
          </SplitterPanel>
        </Splitter>
        )}

        {/* Tab 1: Koşul Rehberi - BPM Editor If Condition Best Practice */}
        {activeTab === 1 && (
          <Box sx={{ p: 3, overflowY: "auto", maxHeight: "550px" }}>
            <Alert severity="info" icon={<TipsIcon />} sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                🔀 BPM Editor If Condition Yönlendirme – Best Practice
              </Typography>
              <Typography variant="body2">
                ScriptNode&apos;un <strong>TRUE</strong> ve <strong>FALSE</strong> handle&apos;ları, BPM editor&apos;deki
                if condition&apos;a benzer şekilde akış yönlendirmesi yapar. Script <code>true</code> dönerse
                TRUE dalına, <code>false</code> dönerse FALSE dalına gider.
              </Typography>
            </Alert>

            <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: "#f8fafc" }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                ✅ TRUE / FALSE Akış Şeması
              </Typography>
              <Box sx={{ fontFamily: "monospace", fontSize: "0.85rem", color: "#334155" }}>
                <Box sx={{ mb: 1 }}>ScriptNode → Script çalışır → return değeri</Box>
                <Box sx={{ pl: 2, borderLeft: "3px solid #22c55e" }}>
                  return true → TRUE handle&apos;a bağlı node&apos;a gider
                </Box>
                <Box sx={{ pl: 2, borderLeft: "3px solid #ef4444", mt: 0.5 }}>
                  return false → FALSE handle&apos;a bağlı node&apos;a gider
                </Box>
              </Box>
            </Paper>

            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              📝 Örnek Senaryolar
            </Typography>
            <Box sx={{ "& pre": { bgcolor: "#1e293b", color: "#e2e8f0", p: 2, borderRadius: 1, overflow: "auto", fontSize: "0.8rem" } }}>
              <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                Tutar kontrolü (örn. 1000 üzeri onay):
              </Typography>
              <pre>{`// TRUE: Onay gerekli
// FALSE: Doğrudan devam
return (formData.amount || 0) > 1000;`}</pre>

              <Typography variant="caption" color="textSecondary" display="block" gutterBottom sx={{ mt: 2 }}>
                Buton action&apos;a göre yönlendirme:
              </Typography>
              <pre>{`// TRUE: Onaylandı
// FALSE: Reddedildi
const action = previousNodes?.FormNode?.action || "";
return action === "approve";`}</pre>

              <Typography variant="caption" color="textSecondary" display="block" gutterBottom sx={{ mt: 2 }}>
                Koşullu ifade (formül):
              </Typography>
              <pre>{`// Birden fazla alan ile karar
const val = formData.someField;
return val !== null && val !== "" && val > 0;`}</pre>
            </Box>

            <Alert severity="warning" sx={{ mt: 3 }} icon={false}>
              <Typography variant="body2">
                <strong>Not:</strong> Script mutlaka <code>true</code> veya <code>false</code> döndürmelidir.
                Başka tür döndürürseniz yönlendirme hatalı çalışabilir.
              </Typography>
            </Alert>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: "1px solid #e5e7eb" }}>
        <Button onClick={handleTest} variant="outlined" startIcon={<PlayIcon />}>
          Test Et
        </Button>
        <Button onClick={onClose} variant="outlined">
          İptal
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<SaveIcon />}
          sx={{
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            minWidth: "120px",
          }}
        >
          Kaydet
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ScriptTab;

