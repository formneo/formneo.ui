import { Formio } from '@formio/react';
const SelectComponent = Formio.Components.components.select;

/**
 * FormNeo Department Selector Component
 * Departman listesini API'den otomatik çeker ve dropdown olarak gösterir
 */
export class DSDepartmentSelectComponent extends SelectComponent {
  
  /**
   * Component schema - FormNeo Department Selector
   */
  static schema(...extend) {
    return SelectComponent.schema({
      label: 'Departman Seçimi',
      type: 'dsdepartmentselect',
      key: 'departmentSelect',
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
      placeholder: 'Departman seçiniz...',
      validate: {
        required: false
      },
      customBooleanProp: false,
      multiple: false,
      widget: 'choicesjs'
    }, ...extend);
  }

  static get builderInfo() {
    return {
      title: 'Departman Seçici',
      group: 'dscomponents',
      icon: 'domain',
      weight: 27,
      documentation: '/userguide/#department-select',
      schema: DSDepartmentSelectComponent.schema()
    };
  }

  /**
   * Component attach - DOM'a eklendiğinde çalışır
   */
  attach(element) {
    const promise = super.attach(element);
    this.loadDepartments();
    return promise;
  }

  /**
   * Departman listesini yükle
   */
  async loadDepartments() {
    try {
      
      
      // TODO: API entegrasyonu yapılacak
      // const getConfiguration = (await import('../../../../../confiuration')).default;
      // const { DepartmentApi } = await import('../../../../../api/generated');
      // const conf = getConfiguration();
      // const api = new DepartmentApi(conf);
      // const response = await api.apiDepartmentGet();
      
      // Şimdilik fallback data kullan
      this.loadFallbackDepartments();
      
    } catch (error) {
      console.error('❌ Departman listesi yüklenirken hata:', error);
      this.loadFallbackDepartments();
    }
  }

  /**
   * Fallback - Test departmanları yükle
   */
  loadFallbackDepartments() {
    
    
    this.component.dataSrc = 'values';
    this.component.data = {
      values: [
        { label: 'İnsan Kaynakları', value: 'dept-hr' },
        { label: 'Bilgi Teknolojileri', value: 'dept-it' },
        { label: 'Finans', value: 'dept-finance' },
        { label: 'Satış', value: 'dept-sales' },
        { label: 'Pazarlama', value: 'dept-marketing' },
        { label: 'Operasyon', value: 'dept-operations' },
        { label: 'Ar-Ge', value: 'dept-rnd' },
        { label: 'Lojistik', value: 'dept-logistics' },
        { label: 'Müşteri Hizmetleri', value: 'dept-customer-service' },
        { label: 'Hukuk', value: 'dept-legal' }
      ]
    };
    
    this.triggerUpdate();
    
    if (this.choices) {
      this.choices.clearStore();
      this.choices.setChoices(this.component.data.values, 'value', 'label', true);
    } else {
      this.redraw();
    }
    
    
  }

  getValueAsString(value, options) {
    if (!value) return '';
    if (Array.isArray(value)) {
      return value.map(v => this.getDepartmentLabel(v)).filter(Boolean).join(', ');
    }
    return this.getDepartmentLabel(value) || value;
  }

  getDepartmentLabel(deptId) {
    if (!this.component.data?.values) return deptId;
    const dept = this.component.data.values.find(d => d.value === deptId);
    return dept ? dept.label : deptId;
  }
}

/**
 * Edit form - Component ayarları
 */
DSDepartmentSelectComponent.editForm = (...args) => {
  const editForm = SelectComponent.editForm(...args);

  editForm.components.unshift({
    type: 'checkbox',
    key: 'customBooleanProp',
    label: 'Grid Üzerinde Gösterilsin',
    input: true,
    weight: 15,
    tooltip: 'Bu alan tablo görünümünde gösterilecek mi?'
  });

  editForm.components.unshift({
    type: 'checkbox',
    key: 'workFlowProp',
    label: 'İş Akışı Üzerinde Gösterilsin',
    input: true,
    weight: 15,
    tooltip: 'Bu alan iş akışı sürecinde kullanılacak mı?'
  });

  editForm.components.unshift({
    type: 'checkbox',
    key: 'multiple',
    label: 'Çoklu Departman Seçimi',
    input: true,
    weight: 15,
    tooltip: 'Birden fazla departman seçilebilsin mi?',
    defaultValue: false
  });

  return editForm;
};

// Component'i Form.io'ya kaydet
Formio.Components.addComponent('dsdepartmentselect', DSDepartmentSelectComponent);


