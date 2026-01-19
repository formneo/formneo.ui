import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Icon, Select, MenuItem, FormControl, InputLabel, Typography, Divider, Box } from "@mui/material";
import MDButton from "components/MDButton";
import { RuleGroupType } from "react-querybuilder";
import { formatQuery } from "react-querybuilder";

interface QueryConditionTabProps {
  node: any;
  parsedFormDesign: any;
  selectedForm?: any;
  initialValues?: any;
  onButtonClick?: (data: any) => void;
  workflowData?: any; // Workflow execution data
  nodes?: any[]; // All workflow nodes
  edges?: any[]; // All workflow edges
}

const QueryConditionTab: React.FC<QueryConditionTabProps> = ({
  node,
  parsedFormDesign,
  selectedForm,
  initialValues,
  onButtonClick,
  workflowData,
  nodes = [],
  edges = [],
}) => {
  const [query, setQuery] = useState<RuleGroupType>(
    node?.data?.query || { combinator: "and", rules: [] }
  );
  
  // Data source seçimi
  const [dataSource, setDataSource] = useState<"formData" | "previousNode" | "workflowData">(
    node?.data?.dataSource || "formData"
  );
  
  // Previous node seçimi
  const [selectedPreviousNodeId, setSelectedPreviousNodeId] = useState<string>(
    node?.data?.previousNodeId || ""
  );

  // ✅ Node'dan form bilgisini al
  const savedFormId = node?.data?.selectedFormId;
  const savedFormName = node?.data?.selectedFormName;
  const savedParsedFormDesign = node?.data?.parsedFormDesign;

  // ✅ extractFieldsFromComponents fonksiyonu
  const extractFieldsFromComponents = useCallback((components: any[]): any[] => {
    if (!components || !Array.isArray(components) || components.length === 0) {
      console.warn("⚠️ extractFieldsFromComponents: components boş veya geçersiz");
      return [];
    }
    
    const fields: any[] = [];
    const excludedTypes = ["button", "submit", "reset", "dsbutton", "hidden", "dshidden", "file", "dsfile"];
    const excludedKeys = ["submit", "kaydet", "save", "button", "reset", "cancel", "iptal"];
    
    const traverse = (items: any[]) => {
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
          item.columns.forEach((col: any) => {
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
    console.log(`✅ extractFieldsFromComponents: ${fields.length} field bulundu`);
    return fields;
  }, []);

  // ✅ En güncel form design'ını belirle
  const currentFormDesign = useMemo(() => {
    console.log("🔍 currentFormDesign useMemo çalışıyor:");
    console.log("- parsedFormDesign:", parsedFormDesign);
    console.log("- savedParsedFormDesign:", savedParsedFormDesign);
    console.log("- selectedForm:", selectedForm?.formName);
    
    // Önce parsedFormDesign'u kontrol et (en güncel)
    if (parsedFormDesign && parsedFormDesign.fields && parsedFormDesign.fields.length > 0) {
      console.log("✅ Using parsedFormDesign with fields:", parsedFormDesign.fields.length);
      return parsedFormDesign;
    }
    
    // Sonra savedParsedFormDesign'i kontrol et
    if (savedParsedFormDesign && savedParsedFormDesign.fields && savedParsedFormDesign.fields.length > 0) {
      console.log("✅ Using savedParsedFormDesign with fields:", savedParsedFormDesign.fields.length);
      return savedParsedFormDesign;
    }
    
    // Eğer fields yoksa, raw'dan veya selectedForm'dan extract et
    let design = parsedFormDesign || savedParsedFormDesign;
    
    // ✅ Agresif extract stratejisi: Önce selectedForm.formDesign'i dene
    if (selectedForm?.formDesign && (!design || !design.fields || design.fields.length === 0)) {
      try {
        console.log("🔍 Trying selectedForm.formDesign directly...");
        const raw = JSON.parse(selectedForm.formDesign);
        if (raw && raw.components && Array.isArray(raw.components) && raw.components.length > 0) {
          const extractedFields = extractFieldsFromComponents(raw.components);
          console.log("✅ Extracted from selectedForm.formDesign:", extractedFields.length, "fields");
          if (extractedFields.length > 0) {
            return {
              fields: extractedFields,
              raw: raw,
            };
          }
        }
      } catch (error) {
        console.error("❌ Error parsing selectedForm.formDesign:", error);
      }
    }
    
    if (!design) {
      console.warn("⚠️ No design found");
      return null;
    }
    
    try {
      let raw = design.raw;
      console.log("- design.raw:", raw ? "Var" : "Yok");
      
      if (!raw && selectedForm?.formDesign) {
        console.log("🔍 Parsing selectedForm.formDesign");
        raw = JSON.parse(selectedForm.formDesign);
        console.log("- parsed raw:", raw ? "Başarılı" : "Başarısız");
      }
      if (!raw && node?.data?.parsedFormDesign?.raw) {
        console.log("🔍 Using node.data.parsedFormDesign.raw");
        raw = node.data.parsedFormDesign.raw;
      }
      
      console.log("- Final raw:", raw ? "Var" : "Yok");
      console.log("- raw.components:", raw?.components ? `${raw.components.length} component` : "Yok");
      
      if (raw && raw.components && Array.isArray(raw.components)) {
        console.log("🔍 Extracting fields from components:", raw.components.length, "components");
        const extractedFields = extractFieldsFromComponents(raw.components);
        console.log("✅ Extracted fields:", extractedFields.length, "fields");
        if (extractedFields.length > 0) {
          const result = {
            ...design,
            fields: extractedFields,
            raw: raw,
          };
          console.log("✅ Returning design with fields:", result);
          return result;
        } else {
          console.warn("⚠️ No fields extracted from components");
        }
      } else {
        console.warn("⚠️ No raw.components found:", { 
          hasRaw: !!raw, 
          hasComponents: !!raw?.components,
          componentsType: typeof raw?.components,
          isArray: Array.isArray(raw?.components),
          rawKeys: raw ? Object.keys(raw).slice(0, 10) : []
        });
      }
    } catch (error) {
      console.error("❌ Error extracting fields:", error);
    }
    
    console.log("📤 Returning design (fields yok):", design);
    return design;
  }, [parsedFormDesign, savedParsedFormDesign, selectedForm, node, extractFieldsFromComponents]);

  // ✅ Önceki node'ları bul (current node'a bağlı olanlar)
  const previousNodes = useMemo(() => {
    if (!node?.id || !edges || edges.length === 0) return [];
    
    // Current node'a gelen edge'leri bul
    const incomingEdges = edges.filter((edge: any) => edge.target === node.id);
    
    // Source node'ları bul
    const prevNodes = incomingEdges
      .map((edge: any) => {
        const sourceNode = nodes.find((n: any) => n.id === edge.source);
        return sourceNode;
      })
      .filter((n: any) => n && n.type !== "startNode"); // StartNode hariç
    
    return prevNodes;
  }, [node?.id, edges, nodes]);

  // ✅ Otomatik olarak bağlı node'u bul (ilk previous node)
  const connectedNode = useMemo(() => {
    if (previousNodes.length > 0) {
      return previousNodes[0]; // İlk bağlı node'u al
    }
    return null;
  }, [previousNodes]);

  // ✅ Bağlı node'a göre otomatik data source belirle
  useEffect(() => {
    if (connectedNode && !node?.data?.dataSource) {
      // Eğer data source ayarlanmamışsa otomatik belirle
      if (connectedNode.type === "formNode") {
        setDataSource("formData");
      } else {
        setDataSource("previousNode");
        setSelectedPreviousNodeId(connectedNode.id);
      }
    } else if (connectedNode && node?.data?.dataSource === "formData" && connectedNode.type !== "formNode") {
      // Eğer formNode değilse previousNode'a geç
      setDataSource("previousNode");
      setSelectedPreviousNodeId(connectedNode.id);
    }
  }, [connectedNode, node?.data?.dataSource]);

  // ✅ Seçilen previous node'un data'sını al
  const selectedPreviousNode = useMemo(() => {
    if (!selectedPreviousNodeId) return null;
    return nodes.find((n: any) => n.id === selectedPreviousNodeId);
  }, [selectedPreviousNodeId, nodes]);

  // ✅ Data source'a göre field'ları hazırla
  const availableFields = useMemo(() => {
    console.log("🔍 AvailableFields calculation:");
    console.log("- dataSource:", dataSource);
    console.log("- currentFormDesign:", currentFormDesign);
    console.log("- currentFormDesign.fields:", currentFormDesign?.fields);
    
    if (dataSource === "formData") {
      // Form field'ları
      const fields = currentFormDesign?.fields || [];
      console.log("✅ FormData fields:", fields);
      return fields;
    } else if (dataSource === "previousNode" && selectedPreviousNode) {
      // Previous node'un output field'ları
      const nodeData = selectedPreviousNode.data || {};
      const outputFields: any[] = [];
      
      // Node type'a göre field'ları çıkar
      if (selectedPreviousNode.type === "formNode") {
        outputFields.push(
          { name: "action", label: "Action (Buton Action Code)", type: "string" },
          { name: "formData", label: "Form Data", type: "object" }
        );
      } else if (selectedPreviousNode.type === "userTaskNode") {
        outputFields.push(
          { name: "action", label: "Action (Buton Action Code)", type: "string" },
          { name: "userId", label: "User ID", type: "string" },
          { name: "userName", label: "User Name", type: "string" }
        );
      } else if (selectedPreviousNode.type === "setFieldNode") {
        outputFields.push(
          { name: "updatedFields", label: "Updated Fields", type: "object" },
          { name: "summary", label: "Summary", type: "string" }
        );
      } else if (selectedPreviousNode.type === "approverNode") {
        outputFields.push(
          { name: "approvalStatus", label: "Approval Status", type: "string" },
          { name: "approverId", label: "Approver ID", type: "string" }
        );
      }
      
      return outputFields;
    } else if (dataSource === "workflowData") {
      // Workflow context field'ları
      return [
        { name: "instanceId", label: "Instance ID", type: "string" },
        { name: "startTime", label: "Start Time", type: "string" },
        { name: "currentStep", label: "Current Step", type: "string" },
        { name: "formId", label: "Form ID", type: "string" },
        { name: "formName", label: "Form Name", type: "string" },
      ];
    }
    
    return [];
  }, [dataSource, currentFormDesign, selectedPreviousNode]);

  // ✅ Debug bilgileri
  useEffect(() => {
    console.log("🔍 QueryConditionTab props:");
    console.log("- parsedFormDesign:", parsedFormDesign);
    console.log("- selectedForm:", selectedForm);
    console.log("- node.data:", node?.data);
    console.log("- savedFormId:", savedFormId);
    console.log("- savedFormName:", savedFormName);
    console.log("- currentFormDesign:", currentFormDesign);
  }, [parsedFormDesign, selectedForm, node, savedFormId, savedFormName, currentFormDesign]);

  // ✅ Node data değiştiğinde query'yi güncelle - eklendi
  useEffect(() => {
    if (node?.data?.query) {
      setQuery(node.data.query);
    }
  }, [node?.data?.query, node?.id]);

  const handleSaveQuery = () => {
    if (node) {
      const queryBuilder = formatQuery(query, "jsonlogic");
      const updatedData = {
        ...node.data, // ✅ Mevcut data'yı koru
        query: query, // ✅ React Query Builder formatında sorgu
        jsonLogicRule: queryBuilder, // ✅ Query Builder formatında sorgu
        dataSource: dataSource, // ✅ Data source
        previousNodeId: selectedPreviousNodeId || undefined, // ✅ Previous node ID
        selectedFormId: selectedForm?.id || savedFormId,
        selectedFormName: selectedForm?.formName || savedFormName,
        parsedFormDesign: currentFormDesign, // ✅ En güncel form design'ını kullan
        lastModified: new Date().toISOString(),
        status: "configured",
      };

      if (onButtonClick) {
        onButtonClick({
          id: node.id,
          data: updatedData,
        });
      }

      alert("Sorgu kaydedildi 🎉");
    }
  };

  // ✅ Form design yoksa loading/warning göster (sadece formData için)
  if (dataSource === "formData" && (!currentFormDesign || !currentFormDesign.fields || currentFormDesign.fields.length === 0)) {
    return (
      <div style={{ padding: "1rem" }}>
        {/* ✅ Form adını göster - varsa */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <h3>Query Condition</h3>
          {(savedFormName || selectedForm?.formName) && (
            <div
              style={{
                backgroundColor: "#e3f2fd",
                padding: "8px 16px",
                borderRadius: "20px",
                fontSize: "14px",
                color: "#1976d2",
                fontWeight: "500",
              }}
            >
              📋 {savedFormName || selectedForm?.formName}
            </div>
          )}
        </div>

        <div
          style={{
            padding: "20px",
            backgroundColor: "#fff3cd",
            border: "1px solid #ffeaa7",
            borderRadius: "8px",
            margin: "10px 0",
          }}
        >
          ⚠️ Form alanları henüz yüklenmedi.
          <br />
          <small>Saved Form: {savedFormName || "Yok"}</small>
          <br />
          <small>Current Form: {selectedForm?.formName || "Yok"}</small>
          <br />
          <small>parsedFormDesign: {currentFormDesign ? "Var" : "null"}</small>
          <br />
          <small>currentFormDesign.fields: {currentFormDesign?.fields ? `${currentFormDesign.fields.length} field` : "Yok"}</small>
          <br />
          <small>selectedForm.formDesign: {selectedForm?.formDesign ? "Var" : "Yok"}</small>
          <br />
          <small>node.data.parsedFormDesign: {node?.data?.parsedFormDesign ? "Var" : "Yok"}</small>
          <br />
          <small>raw.components: {currentFormDesign?.raw?.components ? `${currentFormDesign.raw.components.length} component` : "Yok"}</small>
        </div>

        <MDButton
          variant="gradient"
          color="info"
          startIcon={<Icon>save</Icon>}
          sx={{ mt: 2 }}
          onClick={handleSaveQuery}
        >
          Sorguyu Kaydet
        </MDButton>
      </div>
    );
  }

  return (
    <div style={{ padding: "1rem" }}>
      {/* ✅ Form adını göster */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h3>Query Condition</h3>
        {(savedFormName || selectedForm?.formName) && dataSource === "formData" && (
          <div
            style={{
              backgroundColor: "#e3f2fd",
              padding: "8px 16px",
              borderRadius: "20px",
              fontSize: "14px",
              color: "#1976d2",
              fontWeight: "500",
            }}
          >
            📋 {savedFormName || selectedForm?.formName}
          </div>
        )}
      </div>

      {/* ✅ Bağlı Node Bilgisi */}
      {connectedNode && (
        <Box sx={{ mb: 2, p: 1.5, bgcolor: "#e3f2fd", borderRadius: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            🔗 Bağlı Node: {connectedNode.data?.name || connectedNode.type}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Bu node&apos;a göre otomatik filtreleme yapılacak
          </Typography>
        </Box>
      )}

      {/* ✅ Data Source Seçimi */}
      <Box sx={{ mb: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Data Source</InputLabel>
          <Select
            value={dataSource}
            label="Data Source"
            onChange={(e) => {
              setDataSource(e.target.value as any);
              // Data source değiştiğinde query'yi sıfırla
              setQuery({ combinator: "and", rules: [] });
            }}
          >
            <MenuItem value="formData">Form Data</MenuItem>
            <MenuItem value="previousNode">Previous Node Output</MenuItem>
            <MenuItem value="workflowData">Workflow Context</MenuItem>
          </Select>
        </FormControl>
        {connectedNode && (
          <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: "block" }}>
            💡 Önerilen: {connectedNode.type === "formNode" ? "Form Data" : "Previous Node Output"}
          </Typography>
        )}
      </Box>

      {/* ✅ Previous Node Selector */}
      {dataSource === "previousNode" && (
        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Previous Node</InputLabel>
            <Select
              value={selectedPreviousNodeId}
              label="Previous Node"
              onChange={(e) => {
                setSelectedPreviousNodeId(e.target.value);
                // Node değiştiğinde query'yi sıfırla
                setQuery({ combinator: "and", rules: [] });
              }}
            >
              <MenuItem value="">Select a node...</MenuItem>
              {previousNodes.map((prevNode: any) => (
                <MenuItem key={prevNode.id} value={prevNode.id}>
                  {prevNode.data?.name || prevNode.type} ({prevNode.id.substring(0, 8)})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {selectedPreviousNode && (
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: "block" }}>
              Selected: {selectedPreviousNode.data?.name || selectedPreviousNode.type}
            </Typography>
          )}
          {previousNodes.length === 0 && (
            <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: "block" }}>
              ⚠️ No previous nodes found. Connect a node to this condition node first.
            </Typography>
          )}
        </Box>
      )}

      {/* ✅ Workflow Data Info */}
      {dataSource === "workflowData" && (
        <Box sx={{ mb: 2, p: 1, bgcolor: "#f5f5f5", borderRadius: 1 }}>
          <Typography variant="caption" color="textSecondary">
            Available fields: instanceId, startTime, currentStep, formId, formName
          </Typography>
        </Box>
      )}

      <Divider sx={{ my: 2 }} />


      <MDButton
        variant="gradient"
        color="info"
        startIcon={<Icon>save</Icon>}
        sx={{ mt: 2 }}
        onClick={handleSaveQuery}
        disabled={availableFields.length === 0}
      >
        Sorguyu Kaydet
      </MDButton>
    </div>
  );
};

export default QueryConditionTab;
