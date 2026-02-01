import { Formio } from '@formio/react';
const SelectComponent = Formio.Components.components.select;

export class DSSupplierSelectComponent extends SelectComponent {
  static schema(...extend) {
    return SelectComponent.schema({
      label: 'Tedarikçi Seçimi',
      type: 'dssupplierselect',
      key: 'supplierSelect',
      dataSrc: 'custom',
      data: { custom: 'values = [];' },
      valueProperty: 'value',
      template: '<span>{{ item.label }}</span>',
      disableLimit: true,
      searchEnabled: true,
      searchField: 'label',
      minSearch: 0,
      placeholder: 'Tedarikçi seçiniz...',
      validate: { required: false },
      customBooleanProp: false,
      multiple: false,
      widget: 'choicesjs'
    }, ...extend);
  }

  static get builderInfo() {
    return {
      title: 'Tedarikçi Seçici',
      group: 'dscomponents',
      icon: 'local_shipping',
      weight: 32,
      documentation: '/userguide/#supplier-select',
      schema: DSSupplierSelectComponent.schema()
    };
  }

  attach(element) {
    const promise = super.attach(element);
    this.loadSuppliers();
    return promise;
  }

  async loadSuppliers() {
    this.component.dataSrc = 'values';
    this.component.data = {
      values: [
        { label: 'ABC Tedarik A.Ş.', value: 'sup-abc' },
        { label: 'XYZ Lojistik Ltd.', value: 'sup-xyz' },
        { label: 'Global Suppliers Inc.', value: 'sup-global' },
        { label: 'Eko Tedarikçiler', value: 'sup-eko' },
        { label: 'Premium Suppliers', value: 'sup-premium' },
        { label: 'Express Tedarik', value: 'sup-express' }
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
      return value.map(v => this.getSupplierLabel(v)).filter(Boolean).join(', ');
    }
    return this.getSupplierLabel(value) || value;
  }

  getSupplierLabel(supId) {
    if (!this.component.data?.values) return supId;
    const sup = this.component.data.values.find(s => s.value === supId);
    return sup ? sup.label : supId;
  }
}

DSSupplierSelectComponent.editForm = (...args) => {
  const editForm = SelectComponent.editForm(...args);
  editForm.components.unshift(
    { type: 'checkbox', key: 'customBooleanProp', label: 'Grid Üzerinde Gösterilsin', input: true, weight: 15 },
    { type: 'checkbox', key: 'workFlowProp', label: 'İş Akışı Üzerinde Gösterilsin', input: true, weight: 15 },
    { type: 'checkbox', key: 'multiple', label: 'Çoklu Tedarikçi Seçimi', input: true, weight: 15, defaultValue: false }
  );
  return editForm;
};

Formio.Components.addComponent('dssupplierselect', DSSupplierSelectComponent);


