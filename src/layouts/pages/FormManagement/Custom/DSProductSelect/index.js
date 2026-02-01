import { Formio } from '@formio/react';
const SelectComponent = Formio.Components.components.select;

export class DSProductSelectComponent extends SelectComponent {
  static schema(...extend) {
    return SelectComponent.schema({
      label: 'Ürün Seçimi',
      type: 'dsproductselect',
      key: 'productSelect',
      dataSrc: 'custom',
      data: { custom: 'values = [];' },
      valueProperty: 'value',
      template: '<span>{{ item.label }}</span>',
      disableLimit: true,
      searchEnabled: true,
      searchField: 'label',
      minSearch: 0,
      placeholder: 'Ürün seçiniz...',
      validate: { required: false },
      customBooleanProp: false,
      multiple: false,
      widget: 'choicesjs'
    }, ...extend);
  }

  static get builderInfo() {
    return {
      title: 'Ürün Seçici',
      group: 'dscomponents',
      icon: 'inventory_2',
      weight: 33,
      documentation: '/userguide/#product-select',
      schema: DSProductSelectComponent.schema()
    };
  }

  attach(element) {
    const promise = super.attach(element);
    this.loadProducts();
    return promise;
  }

  async loadProducts() {
    this.component.dataSrc = 'values';
    this.component.data = {
      values: [
        { label: 'FormNeo Enterprise', value: 'prod-formneo-ent' },
        { label: 'FormNeo Professional', value: 'prod-formneo-pro' },
        { label: 'FormNeo Basic', value: 'prod-formneo-basic' },
        { label: 'Workflow Engine Module', value: 'prod-workflow' },
        { label: 'Reporting Module', value: 'prod-reporting' },
        { label: 'Integration Pack', value: 'prod-integration' },
        { label: 'Mobile License', value: 'prod-mobile' },
        { label: 'API Access', value: 'prod-api' }
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
      return value.map(v => this.getProductLabel(v)).filter(Boolean).join(', ');
    }
    return this.getProductLabel(value) || value;
  }

  getProductLabel(prodId) {
    if (!this.component.data?.values) return prodId;
    const prod = this.component.data.values.find(p => p.value === prodId);
    return prod ? prod.label : prodId;
  }
}

DSProductSelectComponent.editForm = (...args) => {
  const editForm = SelectComponent.editForm(...args);
  editForm.components.unshift(
    { type: 'checkbox', key: 'customBooleanProp', label: 'Grid Üzerinde Gösterilsin', input: true, weight: 15 },
    { type: 'checkbox', key: 'workFlowProp', label: 'İş Akışı Üzerinde Gösterilsin', input: true, weight: 15 },
    { type: 'checkbox', key: 'multiple', label: 'Çoklu Ürün Seçimi', input: true, weight: 15, defaultValue: false }
  );
  return editForm;
};

Formio.Components.addComponent('dsproductselect', DSProductSelectComponent);


