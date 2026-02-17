/**
 * FormConditionBuilder - react-querybuilder ile form design'a uyumlu koşul builder.
 * Formily.js kullanmaz, form design JSON'dan alanları çıkarır.
 * Form design component tiplerine göre (Input, Select, NumberPicker, DatePicker vb.) uygun
 * operatörler ve value editor'lar sunar.
 *
 * NOT: Value editor MODÜL SEVİYESİNDE tanımlanmalı - parent içinde tanımlanırsa
 * her render'da yeniden oluşturulur ve focus kaybı olur (react-querybuilder common mistake).
 */
import React, { useMemo, useCallback, createContext, useContext } from "react";
import { QueryBuilder, RuleGroupType, Field, formatQuery } from "react-querybuilder";
import "react-querybuilder/dist/query-builder.css";
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Box,
} from "@mui/material";
import {
  extractFieldsFromFormDesign,
  FormDesignField,
} from "../utils/formDesignFields";

const FormConditionFieldsContext = createContext<FormDesignField[]>([]);

export interface FormConditionBuilderProps {
  /** Form design: Formily schema, Formio components veya parsedFormDesign */
  formDesign?: any;
  /** Doğrudan alan listesi (formDesign yerine) */
  fields?: FormDesignField[];
  /** Mevcut query (controlled) */
  query: RuleGroupType;
  /** Query değiştiğinde */
  onQueryChange: (query: RuleGroupType) => void;
  /** Opsiyonel: JSONLogic formatında export */
  onJsonLogicChange?: (jsonLogic: any) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Ek alanlar (formDesign/fields'e ek olarak) */
  extraFields?: { name: string; label: string; type?: string }[];
}

// react-querybuilder operator isimleri -> conditionEvaluator uyumlu
const OPERATOR_MAP: Record<string, string> = {
  "=": "==",
  "!=": "!=",
  "<": "<",
  ">": ">",
  "<=": "<=",
  ">=": ">=",
  contains: "contains",
  beginsWith: "startsWith",
  endsWith: "endsWith",
  null: "isEmpty",
  notNull: "isNotEmpty",
  in: "in",
  notIn: "notIn",
};

function mapOperatorForEval(op: string): string {
  return OPERATOR_MAP[op] ?? op;
}

/**
 * Field tipine göre MUI value editor.
 * Text/number/date/time için blur'da report - her keystroke'ta parent re-render focus kaybına neden oluyordu.
 */
function MuiValueEditor(props: {
  field: string;
  fieldData: Field;
  operator: string;
  value: any;
  handleOnChange: (value: any) => void;
  values?: { label: string; value: any }[];
  valueEditorType?: string;
  disabled?: boolean;
}) {
  const {
    field,
    fieldData,
    value,
    handleOnChange,
    values = [],
    valueEditorType = "text",
    disabled,
  } = props;

  const fd = fieldData as unknown as FormDesignField;

  // Text/number/date/time: internal state, blur'da report (focus bug fix)
  const [internalValue, setInternalValue] = React.useState(value ?? "");
  const [isUserTyping, setIsUserTyping] = React.useState(false);
  const lastReportedRef = React.useRef(value);

  React.useEffect(() => {
    if (!isUserTyping && value !== internalValue) {
      setInternalValue(value ?? "");
      lastReportedRef.current = value;
    }
  }, [value, isUserTyping]);

  const reportToParent = React.useCallback(
    (newVal: any) => {
      if (newVal !== lastReportedRef.current) {
        lastReportedRef.current = newVal;
        handleOnChange(newVal);
      }
    },
    [handleOnChange]
  );

  const handleBlur = React.useCallback(() => {
    setIsUserTyping(false);
    setTimeout(() => reportToParent(internalValue), 100);
  }, [internalValue, reportToParent]);

  const handleFocus = React.useCallback(() => setIsUserTyping(true), []);

  // Checkbox - immediate report
  if (valueEditorType === "checkbox") {
    return (
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={value === true || value === "true" || value === 1}
            onChange={(e) => handleOnChange(e.target.checked)}
            disabled={disabled}
          />
        }
        label={value === true || value === "true" ? "Evet" : "Hayır"}
      />
    );
  }

  // Select / Radio - immediate report
  if (valueEditorType === "select" || valueEditorType === "radio") {
    const options = values.length > 0 ? values : fd?.values || [];
    return (
      <FormControl size="small" sx={{ minWidth: 160 }} disabled={disabled}>
        <InputLabel>Seçiniz</InputLabel>
        <Select
          value={value ?? ""}
          label="Seçiniz"
          onChange={(e) => handleOnChange(e.target.value)}
        >
          <MenuItem value="">
            <em>Seçiniz...</em>
          </MenuItem>
          {options.map((opt, i) => (
            <MenuItem key={i} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  // Tıklama event'inin parent'a gitmesini engelle - focus kaybı önleme
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  // Number - blur'da report
  if (valueEditorType === "number") {
    return (
      <Box onMouseDown={stopPropagation} component="span" sx={{ display: "inline-block" }}>
        <TextField
          type="number"
          size="small"
          value={internalValue}
          onChange={(e) => setInternalValue(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Değer"
          sx={{ minWidth: 120 }}
          disabled={disabled}
          inputProps={{ autoComplete: "off" }}
        />
      </Box>
    );
  }

  // Date - blur'da report
  if (valueEditorType === "date") {
    return (
      <Box onMouseDown={stopPropagation} component="span" sx={{ display: "inline-block" }}>
        <TextField
          type="date"
          size="small"
          value={internalValue}
          onChange={(e) => setInternalValue(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 160 }}
          disabled={disabled}
        />
      </Box>
    );
  }

  // Time - blur'da report
  if (valueEditorType === "time") {
    return (
      <Box onMouseDown={stopPropagation} component="span" sx={{ display: "inline-block" }}>
        <TextField
          type="time"
          size="small"
          value={internalValue}
          onChange={(e) => setInternalValue(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 140 }}
          disabled={disabled}
        />
      </Box>
    );
  }

  // Default: text - blur'da report
  return (
    <Box onMouseDown={stopPropagation} component="span" sx={{ display: "inline-block" }}>
      <TextField
        type="text"
        size="small"
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="Değer giriniz..."
        sx={{ minWidth: 150 }}
        disabled={disabled}
        inputProps={{ autoComplete: "off" }}
      />
    </Box>
  );
}

/**
 * Modül seviyesinde tanımlı - parent re-render'da yeniden oluşturulmaz, focus korunur.
 */
function FormConditionValueEditor(props: any) {
  const fields = useContext(FormConditionFieldsContext);
  const fd = fields.find((f) => f.name === props.field);
  return (
    <MuiValueEditor
      {...props}
      valueEditorType={fd?.valueEditorType}
      values={fd?.values}
    />
  );
}

export default function FormConditionBuilder({
  formDesign,
  fields: fieldsProp,
  query,
  onQueryChange,
  onJsonLogicChange,
  disabled = false,
  extraFields = [],
}: FormConditionBuilderProps) {
  const fields = useMemo(() => {
    let fromDesign: FormDesignField[] = [];
    if (fieldsProp && Array.isArray(fieldsProp)) {
      fromDesign = fieldsProp.map((f) =>
        typeof f.valueEditorType === "string"
          ? (f as FormDesignField)
          : {
              ...f,
              valueEditorType: (f as any).valueEditorType ?? "text",
              operators: (f as any).operators ?? ["=", "!=", "contains"],
            }
      );
    } else if (formDesign) {
      fromDesign = extractFieldsFromFormDesign(formDesign);
    }
    const combined = [...fromDesign];
    extraFields.forEach((ef) => {
      if (!combined.some((f) => f.name === ef.name)) {
        combined.push({
          name: ef.name,
          label: ef.label,
          type: (ef.type as FormDesignField["type"]) || "string",
          valueEditorType: "text",
          operators: ["=", "!=", "contains", "beginsWith", "endsWith"],
        });
      }
    });
    return combined;
  }, [formDesign, extraFields]);

  // react-querybuilder Field sadece şu valueEditorType'ları kabul eder: text, select, checkbox, radio, textarea, switch, multiselect
  // number, date, time -> custom editor'da handle edilir, Field'a "text" geçiyoruz
  const toValidValueEditorType = (t: string): "text" | "select" | "checkbox" | "radio" | "multiselect" => {
    if (["select", "radio", "checkbox", "multiselect"].includes(t)) return t as any;
    return "text";
  };

  const queryBuilderFields: Field[] = useMemo(
    () =>
      fields.map((f) => {
        const { valueEditorType, values, operators, ...rest } = f;
        const fieldObj = {
          name: f.name,
          label: f.label,
          ...rest,
          valueEditorType: toValidValueEditorType(valueEditorType),
          values: values?.map((v) => ({ label: v.label, value: String(v.value) })),
          operators,
        };
        return fieldObj as unknown as Field;
      }),
    [fields]
  );

  const getOperators = useCallback(
    (fieldName: string) => {
      const fd = fields.find((f) => f.name === fieldName);
      return fd?.operators ?? ["=", "!="];
    },
    [fields]
  );

  const getValueEditorType = useCallback(
    (fieldName: string) => {
      const fd = fields.find((f) => f.name === fieldName);
      const t = fd?.valueEditorType ?? "text";
      if (t === "multiselect") return "multiselect";
      if (t === "select" || t === "radio") return "select";
      if (t === "checkbox") return "checkbox";
      return "text";
    },
    [fields]
  );

  const getValues = useCallback(
    (fieldName: string) => {
      const fd = fields.find((f) => f.name === fieldName);
      const vals = fd?.values ?? [];
      return vals.map((v) => ({ label: v.label, value: String(v.value) }));
    },
    [fields]
  );

  const handleQueryChange = useCallback(
    (q: RuleGroupType) => {
      onQueryChange(q);
      if (onJsonLogicChange) {
        try {
          const jsonLogic = formatQuery(q, "jsonlogic");
          onJsonLogicChange(jsonLogic);
        } catch {
          onJsonLogicChange(null);
        }
      }
    },
    [onQueryChange, onJsonLogicChange]
  );

  if (fields.length === 0) {
    return (
      <Box
        sx={{
          p: 2,
          bgcolor: "#fff8e1",
          borderRadius: 1,
          border: "1px solid #ffecb3",
        }}
      >
        Form alanları bulunamadı. Form design yükleyin veya form node seçin.
      </Box>
    );
  }

  return (
    <Box
      sx={{
        "& .query-builder": {
          fontFamily: "inherit",
        },
        "& .query-builder .rule-group": {
          backgroundColor: "#fafafa",
          border: "1px solid #e0e0e0",
          borderRadius: 8,
          padding: 12,
        },
        "& .query-builder .rule": {
          marginBottom: 8,
        },
        "& .query-builder select": {
          minWidth: 120,
          padding: "6px 12px",
          borderRadius: 4,
          border: "1px solid #ccc",
        },
        "& .query-builder .rule-group-header": {
          marginBottom: 8,
        },
      }}
    >
      <FormConditionFieldsContext.Provider value={fields}>
        <QueryBuilder
          fields={queryBuilderFields}
          query={query}
          onQueryChange={handleQueryChange}
          getOperators={getOperators}
          getValueEditorType={getValueEditorType}
          getValues={getValues}
          controlElements={{
            valueEditor: FormConditionValueEditor,
          }}
        translations={{
          addRule: { label: "+ Kural", title: "Kural ekle" },
          addGroup: { label: "+ Grup", title: "Grup ekle" },
          removeRule: { label: "✕", title: "Kuralı kaldır" },
          removeGroup: { label: "✕", title: "Grubu kaldır" },
          combinators: { title: "Mantık" },
          fields: { title: "Alan", placeholderName: "------", placeholderLabel: "Alan seçin" },
          operators: { title: "Operatör", placeholderName: "------", placeholderLabel: "Operatör seçin" },
          values: { title: "Değer", placeholderName: "------", placeholderLabel: "Değer seçin" },
        }}
        showCombinatorsBetweenRules
        addRuleToNewGroups
        disabled={disabled}
        />
      </FormConditionFieldsContext.Provider>
    </Box>
  );
}

export { formatQuery };
