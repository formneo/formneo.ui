import React, { useEffect, useState } from "react";
import { Select, Spin } from "antd";
import { connect, mapProps, mapReadPretty } from "@formily/react";
import { createResource, createBehavior } from "@designable/core";
import { createFieldSchema } from "@designable/formily-antd/esm/components/Field/shared";
import { DepartmentsApi, LookupApi, PositionsApi } from "api/generated";
import getConfiguration from "confiuration";

// ==================== DATA SOURCES ====================

const departmentData = [
  { label: 'İnsan Kaynakları', value: 'dept-hr' },
  { label: 'Bilgi Teknolojileri2', value: 'dept-it' },
  { label: 'Finans', value: 'dept-finance' },
  { label: 'Satış', value: 'dept-sales' },
  { label: 'Pazarlama', value: 'dept-marketing' },
  { label: 'Operasyo22n', value: 'dept-operations' },
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

// ==================== API-BASED COMBOBOX COMPONENT ====================

type ApiComboboxProps = ComboboxProps & {
  loadData?: () => Promise<{ label: string; value: string }[]>;
};

const ApiComboboxComponent: React.FC<ApiComboboxProps> = (props) => {
  const { value, onChange, placeholder, disabled, readOnly, mode, loadData } = props;
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    if (loadData && dataSource.length === 0) {
      console.log("🔄 ApiComboboxComponent - API'den veri yükleniyor...");
      setLoading(true);
      loadData()
        .then(data => {
          console.log("✅ ApiComboboxComponent - Veri yüklendi:", data);
          setDataSource(data);
          setLoading(false);
        })
        .catch(error => {
          console.error("❌ ApiComboboxComponent - Veri yükleme hatası:", error);
          setLoading(false);
        });
    }
  }, [loadData, dataSource.length]);

  return (
    <Select
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled || readOnly}
      mode={mode}
      showSearch
      loading={loading}
      filterOption={(input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
      }
      options={dataSource}
      style={{ width: '100%' }}
      notFoundContent={loading ? <Spin size="small" /> : 'Veri bulunamadı'}
    />
  );
};

// ==================== API DATA LOADERS ====================

const loadDepartments = async (): Promise<{ label: string; value: string }[]> => {
  try {
    console.log("🔄 Departmanlar API'den yükleniyor...");
    const conf = getConfiguration();
    const api = new DepartmentsApi(conf);
    const response: any = await api.apiDepartmentsGet();
    
    console.log("📡 API Response (raw):", response);
    console.log("📦 response.data:", response?.data);
    
    // Response array olabilir veya { data: [] } formatında olabilir
    const departments = Array.isArray(response?.data) 
      ? response.data 
      : Array.isArray(response) 
        ? response 
        : [];
    
    console.log("✅ Departmanlar parse edildi:", departments);
    console.log("📊 Departman sayısı:", departments.length);
    
    const mapped = departments.map((dept: any) => {
      console.log("🏢 Departman:", dept);
      return {
        label: dept.departmentName || dept.name || 'İsimsiz',
        value: dept.id || dept.departmentId || '',
      };
    });
    
    console.log("🎯 Son departman listesi:", mapped);
    return mapped;
  } catch (error) {
    console.error("❌ Departmanlar yüklenirken hata:", error);
    return [];
  }
};

const loadPositions = async (): Promise<{ label: string; value: string }[]> => {
  try {
    const conf = getConfiguration();
    const api = new PositionsApi(conf);
    const response: any = await api.apiPositionsGet();
    
    // Response array olabilir veya { data: [] } formatında olabilir
    const positions = Array.isArray(response?.data) 
      ? response.data 
      : Array.isArray(response) 
        ? response 
        : [];
    
    console.log("Pozisyonlar yüklendi:", positions);
    
    return positions.map((pos: any) => ({
      label: pos.positionName || pos.name || 'İsimsiz',
      value: pos.id || pos.positionId || '',
    }));
  } catch (error) {
    console.error("Pozisyonlar yüklenirken hata:", error);
    return [];
  }
};

// ==================== LOOKUP / PARAMETRE LOADER ====================

const loadLookupItems = async (categoryKey: string): Promise<{ label: string; value: string }[]> => {
  if (!categoryKey?.trim()) return [];
  try {
    const api = new LookupApi(getConfiguration());
    const res: any = await api.apiLookupItemsKeyGet(categoryKey.trim());
    const items = Array.isArray(res?.data) ? res.data : [];
    return items
      .filter((p: any) => p.isActive !== false)
      .sort((a: any, b: any) => (a.orderNo || 0) - (b.orderNo || 0))
      .map((p: any) => ({
        label: p.name || p.code || "İsimsiz",
        value: p.code || p.id || "",
      }));
  } catch {
    return [];
  }
};

// ==================== PARAMETRE COMBOBOX (Lookup API) ====================

type ParametreComboboxProps = ComboboxProps & {
  categoryKey?: string;
};

const getCategoryKeyFromProps = (props: any): string => {
  const cc = props["x-component-props"];
  const lookup = props.lookupSource ?? cc?.lookupSource;
  return (
    props.categoryKey ??
    lookup?.categoryKey ??
    cc?.categoryKey ??
    ""
  );
};

const ParametreComboboxComponent: React.FC<ParametreComboboxProps> = (props) => {
  const { categoryKey, value, onChange, placeholder, disabled, readOnly, mode } = props;
  const key = categoryKey ?? getCategoryKeyFromProps(props);

  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    if (!key?.trim()) {
      setDataSource([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    loadLookupItems(key)
      .then((data) => {
        if (!cancelled) setDataSource(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [key]);

  if (!key?.trim()) {
    return (
      <Select
        placeholder={placeholder || "Önce sağ panelden Modül ve Kategori seçin"}
        disabled
        style={{ width: "100%" }}
        notFoundContent="Parametre kaynağı seçilmedi"
      />
    );
  }

  return (
    <Select
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled || readOnly}
      mode={mode}
      showSearch
      loading={loading}
      filterOption={(input, option) =>
        (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
      }
      options={dataSource}
      style={{ width: "100%" }}
      notFoundContent={loading ? <Spin size="small" /> : "Veri bulunamadı"}
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

// ==================== CREATE API-BASED COMBOBOX ====================

const createApiCombobox = (name: string, title: string, loadData: () => Promise<{ label: string; value: string }[]>) => {
  const Component: any = connect(
    (props: any) => <ApiComboboxComponent {...props} loadData={loadData} />,
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
      
      // API'den gelen değerler için
      if (Array.isArray(value)) {
        return <span style={{ padding: '4px 8px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>{value.join(', ')}</span>;
      }
      
      return <span style={{ padding: '4px 8px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>{value}</span>;
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

// ==================== PARAMETRE SELECT (Lookup) ====================

const ParametreSelect: any = connect(
  (props: any) => <ParametreComboboxComponent {...props} categoryKey={getCategoryKeyFromProps(props)} />,
  mapProps((props: any) => ({
    ...props,
    placeholder: props["x-component-props"]?.placeholder || props.placeholder || "Parametre seçiniz...",
    disabled: props["x-component-props"]?.disabled || props.disabled,
    readOnly: props["x-component-props"]?.readOnly || props.readOnly,
    mode: props["x-component-props"]?.mode || props.mode,
  })),
  mapReadPretty((props: any) => {
    const v = props.value;
    if (!v) return <span style={{ color: "#999" }}>-</span>;
    if (Array.isArray(v)) return <span style={{ padding: "4px 8px", backgroundColor: "#f0f0f0", borderRadius: "4px" }}>{v.join(", ")}</span>;
    return <span style={{ padding: "4px 8px", backgroundColor: "#f0f0f0", borderRadius: "4px" }}>{v}</span>;
  })
);

ParametreSelect.Resource = createResource({
  icon: "SelectSource",
  title: "Parametre",
  elements: [
    {
      componentName: "Field",
      props: {
        type: "string",
        title: "Parametre",
        "x-decorator": "FormItem",
        "x-component": "ParametreSelect",
        "x-component-props": {
          lookupSource: { moduleKey: "", categoryKey: "" },
        },
      },
    },
  ],
});

const ParametreSelectComponentSchema = {
  type: "object",
  properties: {
    lookupSource: {
      type: "object",
      title: "Parametre Kaynağı",
      "x-decorator": "FormItem",
      "x-component": "LookupParametreSetter",
    },
    mode: {
      type: "string",
      title: "Seçim Modu",
      enum: [
        { label: "Tekli", value: undefined },
        { label: "Çoklu", value: "multiple" },
        { label: "Tags", value: "tags" },
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
};

ParametreSelect.Behavior = createBehavior({
  name: "ParametreSelect",
  extends: ["Field"],
  selector: (node: any) => node.props?.["x-component"] === "ParametreSelect",
  designerProps: {
    propsSchema: createFieldSchema(ParametreSelectComponentSchema as any),
  },
});

// ==================== EXPORT COMPONENTS ====================

export const DepartmentSelect = createApiCombobox("DepartmentSelect", "Departman", loadDepartments);
export const PositionSelect = createApiCombobox("PositionSelect", "Pozisyon", loadPositions);
export const ParametreSelectExport = ParametreSelect;
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
  ParametreSelect: ParametreSelectExport,
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

