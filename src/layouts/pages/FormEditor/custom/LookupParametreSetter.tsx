import React, { useEffect, useState } from "react";
import { Select, Form, Spin } from "antd";
import getConfiguration from "confiuration";
import { LookupApi, LookupCategoryDto, LookupModuleDto } from "api/generated";

type LookupParametreSetterProps = {
  value?: { moduleKey?: string; categoryKey?: string };
  onChange?: (v: { moduleKey?: string; categoryKey?: string }) => void;
};

/**
 * Form Designer'da Modül + Kategori seçimi için setter.
 * Parametreler sayfasındaki Lookup verilerini kullanır.
 */
const LookupParametreSetter: React.FC<LookupParametreSetterProps> = ({ value, onChange }) => {
  const [modules, setModules] = useState<LookupModuleDto[]>([]);
  const [categories, setCategories] = useState<LookupCategoryDto[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const moduleKey = value?.moduleKey ?? "";
  const categoryKey = value?.categoryKey ?? "";

  const update = (patch: Partial<{ moduleKey?: string; categoryKey?: string }>) => {
    const next = { moduleKey, categoryKey, ...patch };
    onChange?.(next);
  };

  useEffect(() => {
    let cancelled = false;
    setLoadingModules(true);
    const api = new LookupApi(getConfiguration());
    api
      .apiLookupModulesGet()
      .then((res: any) => {
        if (cancelled) return;
        const mods = (res?.data || []) as LookupModuleDto[];
        if (mods?.length > 0) {
          setModules(mods);
          if (!moduleKey && mods[0]?.key) update({ moduleKey: mods[0].key });
        } else {
          api.apiLookupCategoriesGet().then((catsRes: any) => {
            if (cancelled) return;
            const cats = (catsRes?.data || []) as LookupCategoryDto[];
            const keys = Array.from(new Set(cats.map((c: any) => (c.moduleId || "").trim()).filter(Boolean)));
            const derived = keys.map((k) => ({ key: k, name: k })) as LookupModuleDto[];
            setModules(derived);
            if (!moduleKey && derived[0]?.key) update({ moduleKey: derived[0].key });
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingModules(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!moduleKey) {
      setCategories([]);
      return;
    }
    let cancelled = false;
    setLoadingCategories(true);
    const api = new LookupApi(getConfiguration());
    api
      .apiLookupCategoriesGet(moduleKey)
      .then((res: any) => {
        if (cancelled) return;
        const data = (res?.data || []) as LookupCategoryDto[];
        setCategories(data);
        const stillValid = data.some((c) => (c.key || "") === categoryKey);
        if (!stillValid && data[0]?.key) {
          update({ categoryKey: data[0].key });
        } else if (!stillValid) {
          update({ categoryKey: "" });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingCategories(false);
      });
    return () => { cancelled = true; };
  }, [moduleKey]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Form.Item label="Modül" style={{ marginBottom: 0 }}>
        <Select
          placeholder="Modül seçin"
          value={moduleKey || undefined}
          onChange={(v) => update({ moduleKey: v, categoryKey: "" })}
          loading={loadingModules}
          allowClear
          showSearch
          optionFilterProp="label"
          options={modules.map((m) => ({ label: m.name || m.key || "", value: m.key || "" }))}
          style={{ width: "100%" }}
        />
      </Form.Item>
      <Form.Item label="Kategori" style={{ marginBottom: 0 }}>
        <Select
          placeholder="Kategori seçin"
          value={categoryKey || undefined}
          onChange={(v) => update({ categoryKey: v })}
          loading={loadingCategories}
          disabled={!moduleKey}
          allowClear
          showSearch
          optionFilterProp="label"
          options={categories.map((c) => ({ label: c.description || c.key || "", value: c.key || "" }))}
          style={{ width: "100%" }}
          notFoundContent={loadingCategories ? <Spin size="small" /> : "Kategori bulunamadı"}
        />
      </Form.Item>
    </div>
  );
};

export default LookupParametreSetter;
