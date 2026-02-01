import { Formio } from '@formio/react';
const SelectComponent = Formio.Components.components.select;

export class DSCategorySelectComponent extends SelectComponent {
  static schema(...extend) {
    return SelectComponent.schema({
      label: 'Kategori Seçimi',
      type: 'dscategoryselect',
      key: 'categorySelect',
      dataSrc: 'custom',
      data: { custom: 'values = [];' },
      valueProperty: 'value',
      template: '<span>{{ item.label }}</span>',
      disableLimit: true,
      searchEnabled: true,
      searchField: 'label',
      minSearch: 0,
      placeholder: 'Kategori seçiniz...',
      validate: { required: false },
      customBooleanProp: false,
      multiple: false,
      widget: 'choicesjs'
    }, ...extend);
  }

  static get builderInfo() {
    return {
      title: 'Kategori Seçici',
      group: 'dscomponents',
      icon: 'category',
      weight: 34,
      documentation: '/userguide/#category-select',
      schema: DSCategorySelectComponent.schema()
    };
  }

  attach(element) {
    const promise = super.attach(element);
    this.loadCategories();
    return promise;
  }

  async loadCategories() {
    this.component.dataSrc = 'values';
    this.component.data = {
      values: [
        { label: 'Yazılım', value: 'cat-software' },
        { label: 'Donanım', value: 'cat-hardware' },
        { label: 'Danışmanlık', value: 'cat-consulting' },
        { label: 'Eğitim', value: 'cat-training' },
        { label: 'Destek', value: 'cat-support' },
        { label: 'Entegrasyon', value: 'cat-integration' },
        { label: 'Bakım', value: 'cat-maintenance' },
        { label: 'Lisans', value: 'cat-license' }
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

  getValueAsString(value) {
    if (!value) return '';
    if (Array.isArray(value)) {
      return value.map(v => this.getCategoryLabel(v)).filter(Boolean).join(', ');
    }
    return this.getCategoryLabel(value) || value;
  }

  getCategoryLabel(catId) {
    if (!this.component.data?.values) return catId;
    const cat = this.component.data.values.find(c => c.value === catId);
    return cat ? cat.label : catId;
  }
}

DSCategorySelectComponent.editForm = (...args) => {
  const editForm = SelectComponent.editForm(...args);
  editForm.components.unshift(
    { type: 'checkbox', key: 'customBooleanProp', label: 'Grid Üzerinde Gösterilsin', input: true, weight: 15 },
    { type: 'checkbox', key: 'workFlowProp', label: 'İş Akışı Üzerinde Gösterilsin', input: true, weight: 15 },
    { type: 'checkbox', key: 'multiple', label: 'Çoklu Kategori Seçimi', input: true, weight: 15, defaultValue: false }
  );
  return editForm;
};

Formio.Components.addComponent('dscategoryselect', DSCategorySelectComponent);


