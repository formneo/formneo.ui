import React from "react";
import { Select } from "antd";
import { connect, mapProps, mapReadPretty } from "@formily/react";
import { createResource, createBehavior } from "@designable/core";

// ==================== DATA SOURCES ====================

const departmentData = [
  { label: 'İnsan Kaynakları', value: 'dept-hr' },
  { label: 'Bilgi Teknolojileri', value: 'dept-it' },
  { label: 'Finans', value: 'dept-finance' },
  { label: 'Satış', value: 'dept-sales' },
  { label: 'Pazarlama', value: 'dept-marketing' },
  { label: 'Operasyon', value: 'dept-operations' },
  { label: 'Ar-Ge', value: 'dept-rnd' },
  { label: 'Lojistik', value: 'dept-logistics' },
];

const positionData = [
  { label: 'Yazılım Geliştirici', value: 'pos-developer' },
  { label: 'Proje Yöneticisi', value: 'pos-pm' },
  { label: 'İş Analisti', value: 'pos-analyst' },
  { label: 'Müdür', value: 'pos-manager' },
  { label: 'Direktör', value: 'pos-director' },
];

const companyData = [
  { label: 'FormNeo Teknoloji A.Ş.', value: 'comp-formneo' },
  { label: 'ABC Yazılım Ltd. Şti.', value: 'comp-abc' },
  { label: 'XYZ Danışmanlık A.Ş.', value: 'comp-xyz' },
];

const locationData = [
  { label: 'İstanbul - Merkez Ofis', value: 'loc-istanbul-hq' },
  { label: 'Ankara - Çankaya Şubesi', value: 'loc-ankara' },
  { label: 'İzmir - Alsancak Şubesi', value: 'loc-izmir' },
];

const projectData = [
  { label: 'FormNeo Platform', value: 'proj-formneo' },
  { label: 'Müşteri Portalı', value: 'proj-customer-portal' },
  { label: 'Mobil Uygulama', value: 'proj-mobile' },
];

const supplierData = [
  { label: 'ABC Tedarik A.Ş.', value: 'sup-abc' },
  { label: 'XYZ Lojistik Ltd.', value: 'sup-xyz' },
];

const productData = [
  { label: 'FormNeo Enterprise', value: 'prod-ent' },
  { label: 'FormNeo Professional', value: 'prod-pro' },
  { label: 'FormNeo Basic', value: 'prod-basic' },
];

const categoryData = [
  { label: 'Yazılım', value: 'cat-software' },
  { label: 'Donanım', value: 'cat-hardware' },
  { label: 'Danışmanlık', value: 'cat-consulting' },
];

const currencyData = [
  { label: 'TRY - Türk Lirası', value: 'TRY' },
  { label: 'USD - ABD Doları', value: 'USD' },
  { label: 'EUR - Euro', value: 'EUR' },
  { label: 'GBP - İngiliz Sterlini', value: 'GBP' },
];

const countryData = [
  { label: 'Türkiye', value: 'TR' },
  { label: 'Amerika Birleşik Devletleri', value: 'US' },
  { label: 'Almanya', value: 'DE' },
  { label: 'Fransa', value: 'FR' },
  { label: 'İngiltere', value: 'GB' },
];

const cityData = [
  { label: 'İstanbul', value: 'city-istanbul' },
  { label: 'Ankara', value: 'city-ankara' },
  { label: 'İzmir', value: 'city-izmir' },
  { label: 'Bursa', value: 'city-bursa' },
];

const approverData = [
  { label: 'Ahmet Yılmaz (Müdür)', value: 'approver-1' },
  { label: 'Ayşe Demir (Direktör)', value: 'approver-2' },
  { label: 'Mehmet Kaya (Genel Müdür)', value: 'approver-3' },
];

// ==================== GENERIC COMBOBOX COMPONENT ====================

type ComboboxProps = {
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  mode?: 'multiple' | 'tags';
  dataSource?: { label: string; value: string }[];
};

const ComboboxComponent: React.FC<ComboboxProps> = (props) => {
  const { value, onChange, placeholder, disabled, readOnly, mode, dataSource = [] } = props;

  return (
    <Select
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled || readOnly}
      mode={mode}
      showSearch
      filterOption={(input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
      }
      options={dataSource}
      style={{ width: '100%' }}
    />
  );
};

// ==================== CREATE COMBOBOX ====================

const createCombobox = (name: string, title: string, dataSource: any[]) => {
  const Component: any = connect(
    (props: any) => <ComboboxComponent {...props} dataSource={dataSource} />,
    mapProps((props: any) => ({
      ...props,
      placeholder: props["x-component-props"]?.placeholder || props.placeholder || `${title} seçiniz...`,
      disabled: props["x-component-props"]?.disabled || props.disabled,
      readOnly: props["x-component-props"]?.readOnly || props.readOnly,
      mode: props["x-component-props"]?.mode || props.mode,
    })),
    mapReadPretty((props: any) => {
      const value = props.value;
      if (!value) return <span style={{ color: "#999" }}>-</span>;
      
      if (Array.isArray(value)) {
        const labels = value.map(v => dataSource.find(d => d.value === v)?.label || v);
        return <span>{labels.join(', ')}</span>;
      }
      
      const item = dataSource.find(d => d.value === value);
      return <span>{item?.label || value}</span>;
    })
  );

  Component.Resource = createResource({
    icon: "SelectSource",
    title: title,
    elements: [
      {
        componentName: "Field",
        props: {
          type: "string",
          title: title,
          "x-decorator": "FormItem",
          "x-component": name,
        },
      },
    ],
  });

  Component.Behavior = createBehavior({
    name: name,
    extends: ["Field"],
    selector: (node: any) => node.props?.["x-component"] === name,
    designerProps: {
      propsSchema: {
        type: "object",
        properties: {
          mode: {
            type: "string",
            title: "Seçim Modu",
            enum: [
              { label: 'Tekli', value: undefined },
              { label: 'Çoklu', value: 'multiple' },
              { label: 'Tags', value: 'tags' },
            ],
            "x-decorator": "FormItem",
            "x-component": "Select",
          },
          placeholder: {
            type: "string",
            title: "Placeholder",
            "x-decorator": "FormItem",
            "x-component": "Input",
          },
        },
      },
    },
  });

  return Component;
};

// ==================== EXPORT COMPONENTS ====================

export const DepartmentSelect = createCombobox("DepartmentSelect", "Departman", departmentData);
export const PositionSelect = createCombobox("PositionSelect", "Pozisyon", positionData);
export const CompanySelect = createCombobox("CompanySelect", "Şirket", companyData);
export const LocationSelect = createCombobox("LocationSelect", "Lokasyon", locationData);
export const ProjectSelect = createCombobox("ProjectSelect", "Proje", projectData);
export const SupplierSelect = createCombobox("SupplierSelect", "Tedarikçi", supplierData);
export const ProductSelect = createCombobox("ProductSelect", "Ürün", productData);
export const CategorySelect = createCombobox("CategorySelect", "Kategori", categoryData);
export const CurrencySelect = createCombobox("CurrencySelect", "Para Birimi", currencyData);
export const CountrySelect = createCombobox("CountrySelect", "Ülke", countryData);
export const CitySelect = createCombobox("CitySelect", "Şehir", cityData);
export const ApproverSelect = createCombobox("ApproverSelect", "Onaylayıcı", approverData);

export default {
  DepartmentSelect,
  PositionSelect,
  CompanySelect,
  LocationSelect,
  ProjectSelect,
  SupplierSelect,
  ProductSelect,
  CategorySelect,
  CurrencySelect,
  CountrySelect,
  CitySelect,
  ApproverSelect,
};

