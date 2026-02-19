/**
 * Grid şema tipi - veritabanına kaydedilecek
 */
export interface GridColumnSchema {
  fieldKey: string;
  label: string;
  width?: number;
  order?: number;
  type?: "string" | "number" | "boolean" | "date";
  valueEditorType?: string;
  values?: { label: string; value: string | number | boolean }[];
}

export type GridSchema = GridColumnSchema[];
