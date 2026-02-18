/**
 * Form schema'yı React/JSX benzeri markup koduna çevirir.
 * Designable playground'daki MarkupSchemaWidget'tan uyarlanmıştır.
 */
import React from "react";
import { TreeNode } from "@designable/core";
import { MonacoInput } from "@designable/react-settings-form";
import { isEmpty, isPlainObj } from "@formily/shared";

interface MarkupSchemaWidgetProps {
  tree: TreeNode;
}

const transformToMarkupSchemaCode = (tree: TreeNode): string => {
  const printAttribute = (node: TreeNode) => {
    if (!node) return "";
    const props = { ...node.props };
    if (node.depth !== 0) {
      props.name = node.props.name || node.id;
    }
    return Object.keys(props)
      .map((key) => {
        if (
          key === "x-designable-id" ||
          key === "x-designable-source-name" ||
          key === "_isJSONSchemaObject" ||
          key === "version" ||
          key === "type"
        )
          return "";
        const value = props[key];
        if (isPlainObj(value) && isEmpty(value)) return "";
        if (typeof value === "string") return `${key}="${value}"`;
        return `${key}={${JSON.stringify(value)}}`;
      })
      .filter(Boolean)
      .join(" ");
  };

  const printNode = (node: TreeNode): string => {
    if (!node) return "";
    const tag = printTag(node);
    const attr = printAttribute(node);
    const hasChildren = node.children && node.children.length > 0;
    return hasChildren
      ? `<${tag} ${attr}>${printChildren(node)}</${tag}>`
      : `<${tag} ${attr} />`;
  };

  const printChildren = (node: TreeNode): string => {
    if (!node || !node.children) return "";
    return node.children.map((child) => printNode(child)).join("");
  };

  const printTag = (node: TreeNode) => {
    if (node.props.type === "string") return "SchemaField.String";
    if (node.props.type === "number") return "SchemaField.Number";
    if (node.props.type === "boolean") return "SchemaField.Boolean";
    if (node.props.type === "date") return "SchemaField.Date";
    if (node.props.type === "datetime") return "SchemaField.DateTime";
    if (node.props.type === "array") return "SchemaField.Array";
    if (node.props.type === "object") return "SchemaField.Object";
    if (node.props.type === "void") return "SchemaField.Void";
    return "SchemaField.Markup";
  };

  const root =
    tree.componentName === "Form" || tree.componentName === "Root"
      ? tree
      : tree.find((child) => child.componentName === "Form" || child.componentName === "Root");
  if (!root) return "// Form bulunamadı";

  return `import React, { useMemo } from 'react'
import { createForm } from '@formily/core'
import { createSchemaField } from '@formily/react'
import {
  Form,
  FormItem,
  Input,
  Select,
  NumberPicker,
  DatePicker,
  TimePicker,
  Transfer,
  TreeSelect,
  Upload,
  FormGrid,
  FormLayout,
  FormTab,
  FormCollapse,
  ArrayTable,
  ArrayCards,
} from '@formily/antd'
import { Card, Slider, Rate } from 'antd'
import FormNeoButton from './custom/FormNeoButton'
import ApproveButtons from './custom/ApproveButtons'
import CurrencyInput from './custom/CurrencyInput'
import { DepartmentSelect, PositionSelect, ParametreSelectExport as ParametreSelect } from './custom/StandardComboboxes'

const SchemaField = createSchemaField({
  components: {
    FormItem,
    Input,
    Select,
    NumberPicker,
    DatePicker,
    TimePicker,
    Transfer,
    TreeSelect,
    Upload,
    FormGrid,
    FormLayout,
    FormTab,
    FormCollapse,
    ArrayTable,
    ArrayCards,
    Card,
    Slider,
    Rate,
    FormNeoButton,
    ApproveButtons,
    CurrencyInput,
    DepartmentSelect,
    PositionSelect,
    ParametreSelect,
  },
})

export default () => {
  const form = useMemo(() => createForm(), [])

  return (
    <Form form={form} ${printAttribute(root)}>
      <SchemaField>
      ${printChildren(root)}
      </SchemaField>
    </Form>
  )
}
`;
};

export const MarkupSchemaWidget: React.FC<MarkupSchemaWidgetProps> = ({ tree }) => {
  const code = React.useMemo(() => transformToMarkupSchemaCode(tree), [tree]);
  return (
    <MonacoInput
      options={{ readOnly: true }}
      value={code}
      language="typescript"
      height="100%"
    />
  );
};
