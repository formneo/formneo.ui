/**
 * Form Design'dan (Formily schema veya Formio components) alanları çıkarır.
 * Formily.js bağımlılığı YOK - sadece JSON yapısı parse edilir.
 */

export interface FormFieldOption {
  label: string;
  value: string | number | boolean;
}

export interface FormDesignField {
  name: string;
  label: string;
  type: "string" | "number" | "boolean" | "date";
  valueEditorType: "text" | "number" | "date" | "time" | "select" | "radio" | "checkbox" | "multiselect";
  operators: string[];
  values?: FormFieldOption[];
}

// Formio/Designable component type -> standart type mapping
const TYPE_MAP: Record<string, string> = {
  dsradio: "radio",
  dsdatetime: "datetime",
  dstime: "time",
  dscheckbox: "checkbox",
  dstextarea: "textarea",
  dsselect: "select",
  dsselectboxes: "selectboxes",
  dsnumber: "number",
  dscurrency: "currency",
  dsdate: "date",
  dstext: "textfield",
  dstextfield: "textfield",
  textfield: "textfield",
  text: "textfield",
  textarea: "textarea",
  number: "number",
  checkbox: "checkbox",
  radio: "radio",
  select: "select",
  date: "date",
  datetime: "datetime",
  "datetime-local": "datetime",
  time: "time",
  currency: "currency",
  selectboxes: "selectboxes",
};

// Formily x-component -> standart type mapping
const FORMILY_COMPONENT_MAP: Record<string, string> = {
  Input: "textfield",
  Password: "textfield",
  TextArea: "textarea",
  NumberPicker: "number",
  Select: "select",
  Radio: "radio",
  Checkbox: "checkbox",
  DatePicker: "date",
  TimePicker: "time",
  Switch: "checkbox",
  Slider: "number",
  Rate: "number",
  CurrencyInput: "currency",
  TreeSelect: "select",
  Cascader: "select",
  Transfer: "select",
};

/**
 * Formily schema formatından alanları çıkarır (schema.properties)
 */
function extractFromFormilySchema(properties: Record<string, any>, parentPath = ""): FormDesignField[] {
  const fields: FormDesignField[] = [];

  if (!properties || typeof properties !== "object") return fields;

  for (const key of Object.keys(properties)) {
    const prop = properties[key];
    const fieldPath = parentPath ? `${parentPath}.${key}` : key;

    if (prop.type === "void") {
      if (prop.properties) {
        fields.push(...extractFromFormilySchema(prop.properties, fieldPath));
      }
      continue;
    }

    const component = prop["x-component"];
    if (!component || component === "FormItem") {
      if (prop.properties) {
        fields.push(...extractFromFormilySchema(prop.properties, fieldPath));
      }
      continue;
    }

    const mappedType = FORMILY_COMPONENT_MAP[component] || prop.type || "string";
    const { type, valueEditorType, operators } = getTypeConfig(mappedType);

    let values: FormFieldOption[] | undefined;
    const enumData = prop.enum || prop["x-component-props"]?.options;
    if (enumData && Array.isArray(enumData)) {
      values = enumData.map((v: any) =>
        typeof v === "object"
          ? { label: v.label ?? v.title ?? v.value, value: v.value ?? v.label }
          : { label: String(v), value: v }
      );
    }

    if (mappedType === "checkbox" && !values) {
      values = [
        { label: "Evet", value: true },
        { label: "Hayır", value: false },
      ];
    }

    fields.push({
      name: fieldPath,
      label: prop.title || prop.label || key,
      type,
      valueEditorType: values ? (values.length <= 5 ? "radio" : "select") : valueEditorType,
      operators,
      values,
    });
  }

  return fields;
}

/**
 * Formio components array formatından alanları çıkarır
 */
function extractFromFormioComponents(components: any[]): FormDesignField[] {
  const fields: FormDesignField[] = [];
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

        if (excludedTypes.includes(itemType) || excludedKeys.includes(itemKey)) continue;

        const labelLower = (item.label || "").toLowerCase();
        if (
          labelLower.includes("kaydet") ||
          labelLower.includes("submit") ||
          labelLower.includes("gönder") ||
          labelLower.includes("cancel") ||
          labelLower.includes("iptal")
        ) {
          continue;
        }

        const rawType = item.type;
        const mappedType = TYPE_MAP[rawType] || rawType;
        const { type, valueEditorType, operators } = getTypeConfig(mappedType);

        const values = item.values || item.data?.values || [];
        let fieldValues: FormFieldOption[] | undefined;

        if (["select", "radio", "multiselect"].includes(valueEditorType)) {
          fieldValues = values.map((v: any) =>
            typeof v === "object"
              ? { label: v.label || v.value, value: v.value ?? v.label }
              : { label: String(v), value: v }
          );
        } else if (valueEditorType === "checkbox") {
          fieldValues = [
            { label: "Evet", value: true },
            { label: "Hayır", value: false },
          ];
        } else if (mappedType === "approval") {
          fieldValues = [
            { label: "Onaylandı", value: "approved" },
            { label: "Reddedildi", value: "rejected" },
            { label: "Beklemede", value: "pending" },
          ];
        }

        let finalValueEditorType = valueEditorType;
        if (values.length > 0 && ["textfield", "textarea", "email", "url"].includes(mappedType)) {
          finalValueEditorType = values.length <= 5 ? "radio" : "select";
        }

        fields.push({
          name: item.key,
          label: item.label || item.key,
          type,
          valueEditorType: finalValueEditorType,
          operators,
          values: fieldValues,
        });
      }

      if (item.columns?.length) {
        item.columns.forEach((col: any) => {
          if (col?.components) traverse(col.components);
        });
      }
      if (item.components?.length) {
        traverse(item.components);
      }
    }
  };

  traverse(components);
  return fields;
}

function getDefaultConfigForType(type: string): { valueEditorType: string; operators: string[] } {
  const mapped = TYPE_MAP[type] || type;
  switch (mapped) {
    case "number":
    case "currency":
      return { valueEditorType: "number", operators: ["=", "!=", "<", "<=", ">", ">=", "between"] };
    case "date":
    case "datetime":
      return { valueEditorType: "date", operators: ["=", "!=", "<", "<=", ">", ">=", "between"] };
    case "time":
      return { valueEditorType: "time", operators: ["=", "!=", "<", "<=", ">", ">="] };
    case "checkbox":
      return { valueEditorType: "checkbox", operators: ["=", "!="] };
    case "select":
    case "radio":
      return { valueEditorType: "select", operators: ["=", "!=", "in", "notIn"] };
    default:
      return { valueEditorType: "text", operators: ["=", "!=", "contains", "beginsWith", "endsWith", "null", "notNull"] };
  }
}

function getTypeConfig(
  mappedType: string
): { type: FormDesignField["type"]; valueEditorType: FormDesignField["valueEditorType"]; operators: string[] } {
  switch (mappedType) {
    case "number":
    case "currency":
    case "range":
      return { type: "number", valueEditorType: "number", operators: ["=", "!=", "<", "<=", ">", ">=", "between"] };

    case "datetime":
    case "date":
    case "day":
    case "month":
    case "week":
      return { type: "date", valueEditorType: "date", operators: ["=", "!=", "<", "<=", ">", ">=", "between"] };

    case "time":
      return { type: "string", valueEditorType: "time", operators: ["=", "!=", "<", "<=", ">", ">="] };

    case "checkbox":
      return { type: "boolean", valueEditorType: "checkbox", operators: ["=", "!="] };

    case "radio":
      return { type: "string", valueEditorType: "radio", operators: ["=", "!=", "in", "notIn"] };

    case "select":
      return { type: "string", valueEditorType: "select", operators: ["=", "!=", "in", "notIn"] };

    case "selectboxes":
      return { type: "string", valueEditorType: "multiselect", operators: ["in", "notIn"] };

    case "textarea":
      return { type: "string", valueEditorType: "text", operators: ["=", "!=", "contains", "beginsWith", "endsWith"] };

    default:
      return {
        type: "string",
        valueEditorType: "text",
        operators: ["=", "!=", "contains", "beginsWith", "endsWith", "null", "notNull"],
      };
  }
}

/**
 * Form design'dan (her iki format desteklenir) alanları çıkarır.
 * @param formDesign - Formily schema { schema: { properties } } veya Formio { components: [] }
 */
export function extractFieldsFromFormDesign(formDesign: any): FormDesignField[] {
  if (!formDesign) return [];

  try {
    const design = typeof formDesign === "string" ? JSON.parse(formDesign) : formDesign;

    // Formily schema formatı
    const schema = design?.schema ?? design;
    if (schema?.properties && typeof schema.properties === "object") {
      const fields = extractFromFormilySchema(schema.properties);
      if (fields.length > 0) return fields;
    }

    // Formio components formatı
    const components = design?.components;
    if (Array.isArray(components) && components.length > 0) {
      return extractFromFormioComponents(components);
    }

    // parsedFormDesign formatı (zaten extract edilmiş fields)
    if (design?.fields && Array.isArray(design.fields) && design.fields.length > 0) {
      return design.fields.map((f: any) => {
        const type = f.type || "string";
        const { valueEditorType, operators } = getDefaultConfigForType(type);
        return {
          name: f.name || f.key,
          label: f.label || f.name,
          type,
          valueEditorType: f.valueEditorType || valueEditorType,
          operators: f.operators || operators,
          values: f.values,
        };
      });
    }

    // raw.components fallback
    const raw = design?.raw ?? design;
    if (raw?.components && Array.isArray(raw.components)) {
      return extractFromFormioComponents(raw.components);
    }
  } catch (e) {
    console.warn("extractFieldsFromFormDesign parse hatası:", e);
  }

  return [];
}
