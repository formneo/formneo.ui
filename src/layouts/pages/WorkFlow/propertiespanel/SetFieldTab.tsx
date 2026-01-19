import React, { useEffect, useMemo, useState } from "react";
import {
  Icon,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Box,
} from "@mui/material";
import MDButton from "components/MDButton";
;

type FieldOption = { label: string; value: string };

type ValueMode = "static" | "copy" | "expr";

interface SetAction {
  field: string;
  valueMode: ValueMode;
  value?: string;
  copyFrom?: string;
  expr?: string;
  readonly?: boolean;
  disabled?: boolean;
  required?: boolean;
  hidden?: boolean;
  when?: any; // RuleGroupType (react-querybuilder)
}

interface SetFieldTabProps {
  node: any;
  parsedFormDesign?: any;
  selectedForm?: any;
  initialValues?: any;
  onButtonClick?: (payload: { id: string; data: any }) => void;
}

const SetFieldTab: React.FC<SetFieldTabProps> = ({ node, parsedFormDesign, selectedForm, onButtonClick }) => {
  const [tab, setTab] = useState<number>(0);
  const [actions, setActions] = useState<SetAction[]>(() => node?.data?.actions || []);
  const [summary, setSummary] = useState<string>(node?.data?.summary || "");
  const [conditionOpenFor, setConditionOpenFor] = useState<number | null>(null);

  const fieldOptions: FieldOption[] = useMemo(() => {
    let fields = parsedFormDesign?.fields || node?.data?.parsedFormDesign?.fields;
    if (!fields && (node?.data?.parsedFormDesign?.raw || selectedForm?.formDesign)) {
      try {
        const raw = node?.data?.parsedFormDesign?.raw || JSON.parse(selectedForm?.formDesign);
        const comps = raw?.components || [];
        fields = extractFieldsFromComponents(comps);
      } catch {}
    }
    const safe = Array.isArray(fields) ? fields : [];
    return safe.map((f: any) => ({ label: f.label || f.name, value: f.name }));
  }, [parsedFormDesign, node, selectedForm]);

  const extractFieldsFromComponents = (components: any[]): any[] => {
    const fields: any[] = [];
    const excludedTypes = ["button", "submit", "reset", "dsbutton", "hidden", "dshidden", "file", "dsfile"];
    const excludedKeys = ["submit", "kaydet", "save", "button", "reset", "cancel", "iptal"];
    const traverse = (items: any[]) => {
      for (const item of items) {
        const isInput = item.input !== false && item.key;
        if (isInput) {
          if (!excludedTypes.includes(item.type) && !excludedKeys.includes((item.key || "").toLowerCase())) {
            fields.push({ name: item.key, label: item.label || item.key });
          }
        }
        if (item.columns) item.columns.forEach((col: any) => traverse(col.components || []));
        if (item.components) traverse(item.components);
      }
    };
    traverse(components);
    return fields;
  };

  useEffect(() => {
    if (node?.data?.actions) setActions(node.data.actions);
  }, [node?.data?.actions, node?.id]);

  const upsertAction = (index: number, patch: Partial<SetAction>) => {
    setActions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch } as SetAction;
      return next;
    });
  };

  const addAction = () =>
    setActions((prev) => [
      ...prev,
      {
        field: "",
        valueMode: "static",
        value: "",
        readonly: false,
        disabled: false,
        required: false,
        hidden: false,
      },
    ]);

  const removeAction = (index: number) => setActions((prev) => prev.filter((_, i) => i !== index));

  const openCondition = (index: number) => setConditionOpenFor(index);
  const closeCondition = () => setConditionOpenFor(null);

  const handleSave = () => {
    const clean = actions.filter((a) => a.field);
    const data = {
      ...node.data,
      actions: clean,
      summary: summary || summarize(clean),
      selectedFormId: selectedForm?.id || node?.data?.selectedFormId,
      selectedFormName: selectedForm?.formName || node?.data?.selectedFormName,
      parsedFormDesign: parsedFormDesign || node?.data?.parsedFormDesign,
      lastModified: new Date().toISOString(),
      status: "configured",
    };
    onButtonClick?.({ id: node.id, data });
    alert("Aksiyonlar kaydedildi 🎉");
  };

  const summarize = (list: SetAction[]): string => {
    if (!list?.length) return "Tanımlı eylem yok";
    const first = list[0];
    const firstText = `${first.field}: ${first.hidden ? "hide" : first.disabled ? "disable" : first.readonly ? "readonly" : first.required ? "required" : first.valueMode}`;
    return list.length > 1 ? `${firstText} +${list.length - 1}` : firstText;
  };

  const ValueEditor = ({ index, action }: { index: number; action: SetAction }) => {
    switch (action.valueMode) {
      case "static":
        return (
          <TextField
            size="small"
            label="Değer"
            value={action.value ?? ""}
            onChange={(e) => upsertAction(index, { value: e.target.value })}
            placeholder="Sabit değer veya şablon"
          />
        );
      case "copy":
        return (
          <FormControl size="small">
            <InputLabel id={`copy-${index}`}>Alan Kopyala</InputLabel>
            <Select
              labelId={`copy-${index}`}
              value={action.copyFrom || ""}
              label="Alan Kopyala"
              onChange={(e) => upsertAction(index, { copyFrom: e.target.value as string })}
            >
              {fieldOptions.map((opt) => (
                <MenuItem value={opt.value} key={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      case "expr":
        return (
          <TextField
            size="small"
            label="İfade"
            value={action.expr ?? ""}
            onChange={(e) => upsertAction(index, { expr: e.target.value })}
            placeholder="Örn: ${firstName} ${lastName}"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: 12 }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 1 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Aksiyonlar" />
          <Tab label="Özet" />
        </Tabs>
      </Box>

      {tab === 0 && (
        <div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <TextField
              fullWidth
              label="Özet"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Kısa açıklama"
              size="small"
            />
          </div>

          {actions.map((action, index) => (
            <div
              key={index}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 140px 1fr auto",
                gap: 8,
                alignItems: "center",
                border: "1px solid #eee",
                padding: 8,
                borderRadius: 8,
                marginBottom: 8,
              }}
            >
              <FormControl size="small">
                <InputLabel id={`field-${index}`}>Alan</InputLabel>
                <Select
                  labelId={`field-${index}`}
                  value={action.field}
                  label="Alan"
                  onChange={(e) => upsertAction(index, { field: e.target.value as string })}
                >
                  {fieldOptions.map((opt) => (
                    <MenuItem value={opt.value} key={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small">
                <InputLabel id={`vm-${index}`}>Değer Modu</InputLabel>
                <Select
                  labelId={`vm-${index}`}
                  value={action.valueMode}
                  label="Değer Modu"
                  onChange={(e) => upsertAction(index, { valueMode: e.target.value as ValueMode })}
                >
                  <MenuItem value="static">Sabit</MenuItem>
                  <MenuItem value="copy">Alan Kopyala</MenuItem>
                  <MenuItem value="expr">İfade</MenuItem>
                </Select>
              </FormControl>

              <ValueEditor index={index} action={action} />

              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <MDButton color="secondary" variant="outlined" onClick={() => openCondition(index)}>
                  <Icon>rule</Icon>
                </MDButton>
                <MDButton color="error" variant="outlined" onClick={() => removeAction(index)}>
                  <Icon>delete</Icon>
                </MDButton>
              </div>

              <div style={{ gridColumn: "1 / -1", display: "flex", flexWrap: "wrap", gap: 12, marginTop: 6 }}>
                <FormControlLabel
                  control={<Switch checked={!!action.hidden} onChange={(e) => upsertAction(index, { hidden: e.target.checked })} />}
                  label="Gizli"
                />
                <FormControlLabel
                  control={<Switch checked={!!action.disabled} onChange={(e) => upsertAction(index, { disabled: e.target.checked })} />}
                  label="Devre Dışı"
                />
                <FormControlLabel
                  control={<Switch checked={!!action.readonly} onChange={(e) => upsertAction(index, { readonly: e.target.checked })} />}
                  label="Salt Okunur"
                />
                <FormControlLabel
                  control={<Switch checked={!!action.required} onChange={(e) => upsertAction(index, { required: e.target.checked })} />}
                  label="Zorunlu"
                />
              </div>
            </div>
          ))}

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <MDButton color="secondary" variant="outlined" onClick={addAction}>
              <Icon>add</Icon> Eylem Ekle
            </MDButton>
            <MDButton color="info" onClick={handleSave}>
              <Icon>save</Icon> Kaydet
            </MDButton>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ padding: 8, color: "#334" }}>
          <div style={{ marginBottom: 8, fontWeight: 600 }}>Özet</div>
          <div style={{ fontSize: 13 }}>{summary || summarize(actions)}</div>
          <pre style={{ marginTop: 12, background: "#fafafa", border: "1px solid #eee", padding: 8, borderRadius: 8, fontSize: 12 }}>
            {JSON.stringify(actions, null, 2)}
          </pre>
        </div>
      )}

      <Dialog open={conditionOpenFor !== null} onClose={closeCondition} maxWidth="md" fullWidth>
        <DialogTitle>Koşul Tanımla</DialogTitle>
        <DialogContent>
    
        </DialogContent>
        <DialogActions>
          <MDButton color="info" onClick={closeCondition}>
            Kapat
          </MDButton>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SetFieldTab;


