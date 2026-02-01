import { Formio } from '@formio/react';
const SelectComponent = Formio.Components.components.select;

export class DSCompanySelectComponent extends SelectComponent {
  static schema(...extend) {
    return SelectComponent.schema({
      label: 'Şirket Seçimi',
      type: 'dscompanyselect',
      key: 'companySelect',
      dataSrc: 'custom',
      data: { custom: 'values = [];' },
      valueProperty: 'value',
      template: '<span>{{ item.label }}</span>',
      disableLimit: true,
      searchEnabled: true,
      searchField: 'label',
      minSearch: 0,
      placeholder: 'Şirket seçiniz...',
      validate: { required: false },
      customBooleanProp: false,
      multiple: false,
      widget: 'choicesjs'
    }, ...extend);
  }

  static get builderInfo() {
    return {
      title: 'Şirket Seçici',
      group: 'dscomponents',
      icon: 'business',
      weight: 29,
      documentation: '/userguide/#company-select',
      schema: DSCompanySelectComponent.schema()
    };
  }

  attach(element) {
    const promise = super.attach(element);
    this.loadCompanies();
    return promise;
  }

  async loadCompanies() {
    this.component.dataSrc = 'values';
    this.component.data = {
      values: [
        { label: 'FormNeo Teknoloji A.Ş.', value: 'comp-formneo' },
        { label: 'ABC Yazılım Ltd. Şti.', value: 'comp-abc' },
        { label: 'XYZ Danışmanlık A.Ş.', value: 'comp-xyz' },
        { label: 'Tech Solutions Inc.', value: 'comp-techsol' },
        { label: 'Digital Innovations Ltd.', value: 'comp-digital' }
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
      return value.map(v => this.getCompanyLabel(v)).filter(Boolean).join(', ');
    }
    return this.getCompanyLabel(value) || value;
  }

  getCompanyLabel(compId) {
    if (!this.component.data?.values) return compId;
    const comp = this.component.data.values.find(c => c.value === compId);
    return comp ? comp.label : compId;
  }
}

DSCompanySelectComponent.editForm = (...args) => {
  const editForm = SelectComponent.editForm(...args);
  editForm.components.unshift(
    { type: 'checkbox', key: 'customBooleanProp', label: 'Grid Üzerinde Gösterilsin', input: true, weight: 15 },
    { type: 'checkbox', key: 'workFlowProp', label: 'İş Akışı Üzerinde Gösterilsin', input: true, weight: 15 },
    { type: 'checkbox', key: 'multiple', label: 'Çoklu Şirket Seçimi', input: true, weight: 15, defaultValue: false }
  );
  return editForm;
};

Formio.Components.addComponent('dscompanyselect', DSCompanySelectComponent);


