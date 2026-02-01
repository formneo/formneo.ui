import { Formio } from '@formio/react';
const SelectComponent = Formio.Components.components.select;

/**
 * FormNeo Parameter Selector Component
 * Parameters ekranından dinamik değerler çeker (Lookup Items)
 */
export class DSParameterSelectComponent extends SelectComponent {
  
  /**
   * Component schema - FormNeo Parameter Selector
   */
  static schema(...extend) {
    return SelectComponent.schema({
      label: 'Parametre Seçimi',
      type: 'dsparameterselect',
      key: 'parameterSelect',
      dataSrc: 'custom',
      data: {
        custom: 'values = [];'
      },
      valueProperty: 'value',
      template: '<span>{{ item.label }}</span>',
      disableLimit: true,
      searchEnabled: true,
      searchField: 'label',
      minSearch: 0,
      placeholder: 'Parametre seçiniz...',
      validate: {
        required: false
      },
      // Özel özellikler: Module ve Category
      parameterModule: '',
      parameterCategory: '',
      customBooleanProp: false,
      multiple: false,
      widget: 'choicesjs'
    }, ...extend);
  }

  static get builderInfo() {
    return {
      title: 'Parametre Seçici',
      group: 'dscomponents',
      icon: 'database',
      weight: 27,
      documentation: '/userguide/#parameter-select',
      schema: DSParameterSelectComponent.schema()
    };
  }

  /**
   * Component attach - DOM'a eklendiğinde çalışır
   */
  attach(element) {
    const promise = super.attach(element);
    this.loadParameters();
    return promise;
  }

  /**
   * Value set edilirken, obje ise value'yu al
   */
  setValue(value, flags = {}) {
    // Eğer obje geliyorsa, sadece value'yu al
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      
      value = value.value || value.key || value;
    }
    return super.setValue(value, flags);
  }

  /**
   * Parameter listesini API'den çeker
   */
  async loadParameters() {
    try {
      // Module ve Category KEY'lerini doğru şekilde al
      let moduleKey = this.component.parameterModule;
      let categoryKey = this.component.parameterCategory;
      
      // Eğer obje geliyorsa, value'sunu al
      if (typeof moduleKey === 'object' && moduleKey !== null) {
        moduleKey = moduleKey.value || moduleKey.key || moduleKey;
      }
      if (typeof categoryKey === 'object' && categoryKey !== null) {
        categoryKey = categoryKey.value || categoryKey.key || categoryKey;
      }
      
      
      
      
      
      
      
      // Eğer module seçili ama category boşsa: ilk kategoriyi otomatik seç
      if (moduleKey && (!categoryKey || String(categoryKey).trim() === '')) {
        try {
          let cats = [];
          if (typeof window !== 'undefined' && window.__lookupFetchCategories) {
            cats = await window.__lookupFetchCategories(moduleKey);
          } else {
            const getConfiguration = (await import('../../../../../confiuration')).default;
            const { LookupApi } = await import('../../../../../api/generated');
            const confTmp = getConfiguration();
            const apiTmp = new LookupApi(confTmp);
            const resCats = await apiTmp.apiLookupCategoriesGet(moduleKey);
            cats = resCats?.data || [];
          }
          if (Array.isArray(cats) && cats.length > 0) {
            const firstKey = cats[0]?.key;
            if (firstKey) {
              this.component.parameterCategory = firstKey;
              categoryKey = firstKey;
              
            }
          }
        } catch (autoErr) {
          console.warn('⚠️ Otomatik kategori seçimi başarısız:', autoErr?.message || autoErr);
        }
      }

      if (!moduleKey || !categoryKey) {
        console.warn('⚠️ Module veya Kategori seçilmedi. Component ayarlarından seçin.');
        this.loadFallbackParameters();
        return;
      }

      // Axios/configuration ile API çağrısı
      const getConfiguration = (await import('../../../../../confiuration')).default;
      const { LookupApi } = await import('../../../../../api/generated');
      
      
      
      const conf = getConfiguration();
      const api = new LookupApi(conf);
      
      // Kategori key'e göre parametreleri çek (her ihtimale karşı stringe çevir)
      const safeCategoryKey = String(categoryKey || '').trim();
      const response = await api.apiLookupItemsKeyGet(safeCategoryKey);
      
      if (response.data && Array.isArray(response.data)) {
        const parameters = response.data;
        
        
        // Form.io select component'ine data set et
        this.component.dataSrc = 'values';
        this.component.data = {
          values: parameters
            .filter(p => p.isActive !== false) // Sadece aktif parametreler
            .sort((a, b) => (a.orderNo || 0) - (b.orderNo || 0)) // OrderNo'ya göre sırala
            .map(param => ({
              label: param.name || param.code || 'İsimsiz',
              value: param.code, // Code'u value olarak kullan
              // Ek bilgiler
              parameter: {
                id: param.id,
                code: param.code,
                name: param.name,
                orderNo: param.orderNo,
                externalKey: param.externalKey
              }
            }))
        };
        
        // Component'i güncelle
        this.triggerUpdate();
        
        // Eğer component zaten render edildiyse, yeniden render et
        if (this.choices) {
          this.choices.clearStore();
          this.choices.setChoices(this.component.data.values, 'value', 'label', true);
        } else {
          this.redraw();
        }
        
        
      } else {
        console.error('❌ API yanıtı beklendiği gibi değil:', response);
        this.loadFallbackParameters();
      }
    } catch (error) {
      console.error('❌ Parametre listesi yüklenirken hata:', error);
      this.loadFallbackParameters();
    }
  }

  /**
   * Fallback - Test parametreleri yükle
   */
  loadFallbackParameters() {
    const moduleKey = this.component.parameterModule;
    const categoryKey = this.component.parameterCategory;
    
    
    
    // Module ve kategori bazlı örnek data
    let testData = [];
    
    if (moduleKey && categoryKey) {
      testData = [
        { label: `${moduleKey}/${categoryKey} - Seçenek 1`, value: `${categoryKey}_1` },
        { label: `${moduleKey}/${categoryKey} - Seçenek 2`, value: `${categoryKey}_2` },
        { label: `${moduleKey}/${categoryKey} - Seçenek 3`, value: `${categoryKey}_3` }
      ];
    } else if (!moduleKey) {
      testData = [
        { label: '⚠️ Module seçilmedi', value: '' },
        { label: 'Component ayarlarından Module Key girin', value: 'warning' }
      ];
    } else if (!categoryKey) {
      testData = [
        { label: '⚠️ Kategori seçilmedi', value: '' },
        { label: 'Component ayarlarından Category Key girin', value: 'warning' }
      ];
    }
    
    this.component.dataSrc = 'values';
    this.component.data = {
      values: testData
    };
    
    // Component'i güncelle
    this.triggerUpdate();
    
    if (this.choices) {
      this.choices.clearStore();
      this.choices.setChoices(this.component.data.values, 'value', 'label', true);
    } else {
      this.redraw();
    }
    
    
  }

  /**
   * Render değerini formatla
   */
  getValueAsString(value, options) {
    if (!value) return '';
    
    // Eğer multiple ise array döner
    if (Array.isArray(value)) {
      return value.map(v => this.getParameterLabel(v)).filter(Boolean).join(', ');
    }
    
    return this.getParameterLabel(value) || value;
  }

  /**
   * Parameter code'dan label'ı getir
   */
  getParameterLabel(code) {
    if (!this.component.data?.values) return code;
    
    const param = this.component.data.values.find(p => p.value === code);
    return param ? param.label : code;
  }

  /**
   * Seçili parametrenin detay bilgilerini getir
   */
  getParameterDetails(code) {
    if (!this.component.data?.values) return null;
    
    const param = this.component.data.values.find(p => p.value === code);
    return param ? param.parameter : null;
  }
}

/**
 * Module ve Category listelerini yükle (Helper)
 */
let cachedModules = null;
let cachedAllCategories = null; // Tüm kategorileri cache'le
let modulesLoadingPromise = null;
let categoriesLoadingPromise = null;

async function preloadModules() {
  if (cachedModules) {
    
    return cachedModules;
  }
  
  if (modulesLoadingPromise) {
    
    return modulesLoadingPromise;
  }
  
  modulesLoadingPromise = (async () => {
    try {
      
      const getConfiguration = (await import('../../../../../confiuration')).default;
      const { LookupApi } = await import('../../../../../api/generated');
      
      const conf = getConfiguration();
      const api = new LookupApi(conf);
      
      const res = await api.apiLookupModulesGet();
      const modules = res?.data || [];
      
      cachedModules = modules.map(m => ({ 
        label: m.name || m.key, 
        value: m.key 
      }));
      
      
      return cachedModules;
    } catch (e) {
      console.error('❌ Module yükleme hatası:', e);
      cachedModules = [
        { label: 'API hatası - Manuel yazın', value: '' }
      ];
      return cachedModules;
    } finally {
      modulesLoadingPromise = null;
    }
  })();
  
  return modulesLoadingPromise;
}

async function preloadAllCategories() {
  if (cachedAllCategories) {
    
    return cachedAllCategories;
  }
  
  if (categoriesLoadingPromise) {
    
    return categoriesLoadingPromise;
  }
  
  categoriesLoadingPromise = (async () => {
    try {
      
      const getConfiguration = (await import('../../../../../confiuration')).default;
      const { LookupApi } = await import('../../../../../api/generated');
      
      const conf = getConfiguration();
      const api = new LookupApi(conf);
      
      // Tüm kategorileri çek (moduleKey olmadan)
      const res = await api.apiLookupCategoriesGet();
      const categories = res?.data || [];
      
      cachedAllCategories = categories.map(c => ({ 
        label: c.description || c.key || c.name,
        value: c.key,
        moduleId: c.moduleId || c.moduleKey || '' // Module'e göre filtreleme için
      }));
      
      // Global window'a yaz (Form.io custom script'ten erişebilsin)
      if (typeof window !== 'undefined') {
        window.__categoryCache = cachedAllCategories;
        
        
      }
      
      
      return cachedAllCategories;
    } catch (e) {
      console.error('❌ Category yükleme hatası:', e);
      cachedAllCategories = [];
      if (typeof window !== 'undefined') {
        window.__categoryCache = [];
      }
      return cachedAllCategories;
    } finally {
      categoriesLoadingPromise = null;
    }
  })();
  
  return categoriesLoadingPromise;
}

function getCategoriesByModule(moduleKey) {
  if (!cachedAllCategories || !moduleKey) {
    return [{ label: '⚠️ Kategoriler yükleniyor...', value: '' }];
  }
  
  const filtered = cachedAllCategories.filter(c => c.moduleId === moduleKey);
  
  
  if (filtered.length === 0) {
    return [{ label: '⚠️ Bu module\'de kategori yok', value: '' }];
  }
  
  return filtered;
}

// Sayfa yüklendiğinde hem modülleri hem kategorileri cache'le
preloadModules();
preloadAllCategories();

// API helper'larını config'ten alan global fonksiyonlar olarak tanımla
let apiHelpersInitializing = null;
async function ensureApiHelpers() {
  if (typeof window === 'undefined') return;
  if (window.__lookupFetchCategories && window.__apiBaseUrl && window.__lookupCategoriesCache && window.__lookupCategoriesPromise) return;
  if (apiHelpersInitializing) return apiHelpersInitializing;

  apiHelpersInitializing = (async () => {
    try {
      const getConfiguration = (await import('../../../../../confiuration')).default;
      const { LookupApi } = await import('../../../../../api/generated');

      const conf = getConfiguration();
      if (conf?.basePath) {
        window.__apiBaseUrl = conf.basePath;
        
      }

      // Basit cache ve promise memoization
      window.__lookupCategoriesCache = window.__lookupCategoriesCache || {};
      window.__lookupCategoriesPromise = window.__lookupCategoriesPromise || {};

      window.__lookupFetchCategories = async function(moduleKey) {
        try {
          if (!moduleKey) return [];
          // Cache varsa doğrudan dön
          if (window.__lookupCategoriesCache[moduleKey]) {
            return window.__lookupCategoriesCache[moduleKey];
          }
          // Devam eden istek varsa onu bekle
          if (window.__lookupCategoriesPromise[moduleKey]) {
            return await window.__lookupCategoriesPromise[moduleKey];
          }
          const api = new LookupApi(conf);
          const promise = api.apiLookupCategoriesGet(moduleKey)
            .then(res => {
              const data = res?.data || [];
              window.__lookupCategoriesCache[moduleKey] = data;
              return data;
            })
            .catch(e => {
              console.error('❌ __lookupFetchCategories hata:', e);
              return [];
            })
            .finally(() => {
              delete window.__lookupCategoriesPromise[moduleKey];
            });

          window.__lookupCategoriesPromise[moduleKey] = promise;
          return await promise;
        } catch (e) {
          console.error('❌ __lookupFetchCategories dış hata:', e);
          return [];
        }
      };
    } catch (e) {
      console.error('❌ API helper init hata:', e);
    } finally {
      apiHelpersInitializing = null;
    }
  })();

  return apiHelpersInitializing;
}

// Başlarken helper'ları hazırla
ensureApiHelpers();

/**
 * Edit form - Component ayarları
 */
DSParameterSelectComponent.editForm = (...args) => {
  const editForm = SelectComponent.editForm(...args);

  
  
  
  
  const moduleValues = cachedModules || [{ label: '⏳ Yükleniyor...', value: '' }];

  // NOT: unshift() en son eklenen en üstte görünür!
  // Bu yüzden TERS SIRADA ekliyoruz: Notlar → Category → Module
  
  // 3. ÖNEMLİ NOTLAR PANEL (en altta görünecek)
  editForm.components.unshift({
    type: 'htmlelement',
    tag: 'div',
    className: 'alert alert-info',
    content: `
      <strong>📌 Kullanım:</strong><br>
      1️⃣ Yukarıdan <strong>Module</strong> seçin<br>
      2️⃣ <strong>Category</strong> otomatik filtrelenir, seçin<br>
      ✅ Form'da parametreler otomatik yüklenir!
    `,
    weight: 2
  });

  // 2. Parametre kategorisi - DİNAMİK DROPDOWN (API ile - config tabanlı)
  editForm.components.unshift({
    type: 'select',
    key: 'parameterCategory',
    label: '2️⃣ Category Seçin',
    input: true,
    weight: 1,
    placeholder: 'Önce module seçin...',
    tooltip: 'Seçilen module\'e ait kategoriler',
    dataType: 'string',
    valueProperty: 'value',
    template: '<span>{{ item.label }}</span>',
    dataSrc: 'custom',
    data: {
      custom: `
        values = [];
        const moduleKey = data.parameterModule;
        if (!moduleKey) {
          values = [{ label: '⚠️ Önce module seçin', value: '' }];
          return values;
        }
        (async function() {
          try {
            if (!window.__lookupFetchCategories) {
              values = [{ label: 'API init bekleniyor...', value: '' }];
              return;
            }
            const cats = await window.__lookupFetchCategories(moduleKey);
            values = (cats || []).map(function(c){ return { label: (c.description || c.key || c.name), value: c.key }; });
            if (!values.length) { values = [{ label: 'Bu module için kategori yok', value: '' }]; }
            // Tek-seferlik güvenli redraw: cache dolduktan sonra bir kez çiz
            try {
              window.__categoryRedrawOnce = window.__categoryRedrawOnce || {};
              if (instance && !window.__categoryRedrawOnce[moduleKey]) {
                window.__categoryRedrawOnce[moduleKey] = true;
                instance.triggerRedraw();
              }
            } catch (_) {}
          } catch (e) {
            console.error('Kategori yükleme hatası:', e);
            values = [{ label: 'Yükleme hatası', value: '' }];
          }
        })();
        return values;
      `
    },
    validate: { required: false },
    description: 'Module seçildikten sonra otomatik yüklenir',
    customClass: 'category-field',
    searchEnabled: true,
    refreshOn: 'parameterModule',
    clearOnRefresh: true
  });

  // 1. Module seçimi - EN ÜSTTE görünecek
  editForm.components.unshift({
    type: 'select',
    key: 'parameterModule',
    label: '1️⃣ Module Seçin',
    input: true,
    weight: 0,
    placeholder: 'Module seçiniz...',
    tooltip: 'Parameters ekranındaki module\'leri listeler',
    dataSrc: 'values',
    data: {
      values: moduleValues
    },
    onChange: (schema, newValue, data) => {
      try {
        const direct = (newValue && typeof newValue === 'object') ? (newValue.value || newValue.key) : newValue;
        const fallbackRaw = data ? data.parameterModule : undefined;
        const fallback = (fallbackRaw && typeof fallbackRaw === 'object') ? (fallbackRaw.value || fallbackRaw.key) : fallbackRaw;
        const val = direct || fallback || '';
        if (typeof window !== 'undefined' && window.alert) {
          window.alert('Module seçildi: ' + (val || 'boş'));
        }
      } catch (_) {}
    },
    dataType: 'string',  // ← Sadece value string'i kaydet, obje değil
    valueProperty: 'value',  // ← Obje yerine sadece value al
    validate: {
      required: false
    },
    description: cachedModules 
      ? `${cachedModules.length} module mevcut` 
      : 'Module listesi yükleniyor...',
    customClass: 'module-field',
    searchEnabled: true,
    lazyLoad: false
  });

  // AYIRICI ÇİZGİ
  editForm.components.unshift({
    type: 'htmlelement',
    tag: 'hr',
    weight: 3
  });

  // Grid gösterim ayarı
  editForm.components.unshift({
    type: 'checkbox',
    key: 'customBooleanProp',
    label: 'Grid Üzerinde Gösterilsin',
    input: true,
    weight: 15,
    tooltip: 'Bu alan tablo görünümünde gösterilecek mi?'
  });

  // İş akışı ayarı
  editForm.components.unshift({
    type: 'checkbox',
    key: 'workFlowProp',
    label: 'İş Akışı Üzerinde Gösterilsin',
    input: true,
    weight: 15,
    tooltip: 'Bu alan iş akışı sürecinde kullanılacak mı?'
  });

  // Çoklu seçim ayarı
  editForm.components.unshift({
    type: 'checkbox',
    key: 'multiple',
    label: 'Çoklu Seçim',
    input: true,
    weight: 15,
    tooltip: 'Birden fazla parametre seçilebilsin mi?',
    defaultValue: false
  });

  // Arama ayarı
  editForm.components.unshift({
    type: 'checkbox',
    key: 'searchEnabled',
    label: 'Arama Özelliği',
    input: true,
    weight: 15,
    tooltip: 'Parametre listesinde arama yapılabilsin mi?',
    defaultValue: true
  });

  return editForm;
};

// Component'i Form.io'ya kaydet
Formio.Components.addComponent('dsparameterselect', DSParameterSelectComponent);

