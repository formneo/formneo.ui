import { Formio } from '@formio/react';
const SelectComponent = Formio.Components.components.select;

export class DSCountrySelectComponent extends SelectComponent {
  static schema(...extend) {
    return SelectComponent.schema({
      label: 'Ülke Seçimi',
      type: 'dscountryselect',
      key: 'countrySelect',
      dataSrc: 'custom',
      data: { custom: 'values = [];' },
      valueProperty: 'value',
      template: '<span>{{ item.label }}</span>',
      disableLimit: true,
      searchEnabled: true,
      searchField: 'label',
      minSearch: 0,
      placeholder: 'Ülke seçiniz...',
      validate: { required: false },
      customBooleanProp: false,
      multiple: false,
      widget: 'choicesjs'
    }, ...extend);
  }

  static get builderInfo() {
    return {
      title: 'Ülke Seçici',
      group: 'dscomponents',
      icon: 'flag',
      weight: 36,
      documentation: '/userguide/#country-select',
      schema: DSCountrySelectComponent.schema()
    };
  }

  attach(element) {
    const promise = super.attach(element);
    this.loadCountries();
    return promise;
  }

  async loadCountries() {
    this.component.dataSrc = 'values';
    this.component.data = {
      values: [
        { label: 'Türkiye', value: 'TR' },
        { label: 'Amerika Birleşik Devletleri', value: 'US' },
        { label: 'Almanya', value: 'DE' },
        { label: 'Fransa', value: 'FR' },
        { label: 'İngiltere', value: 'GB' },
        { label: 'İtalya', value: 'IT' },
        { label: 'İspanya', value: 'ES' },
        { label: 'Hollanda', value: 'NL' },
        { label: 'Belçika', value: 'BE' },
        { label: 'İsviçre', value: 'CH' },
        { label: 'Avusturya', value: 'AT' },
        { label: 'Yunanistan', value: 'GR' },
        { label: 'Rusya', value: 'RU' },
        { label: 'Çin', value: 'CN' },
        { label: 'Japonya', value: 'JP' },
        { label: 'Kanada', value: 'CA' },
        { label: 'Avustralya', value: 'AU' },
        { label: 'Hindistan', value: 'IN' },
        { label: 'Brezilya', value: 'BR' },
        { label: 'Meksika', value: 'MX' },
        { label: 'Suudi Arabistan', value: 'SA' },
        { label: 'Birleşik Arap Emirlikleri', value: 'AE' }
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
      return value.map(v => this.getCountryLabel(v)).filter(Boolean).join(', ');
    }
    return this.getCountryLabel(value) || value;
  }

  getCountryLabel(countryId) {
    if (!this.component.data?.values) return countryId;
    const country = this.component.data.values.find(c => c.value === countryId);
    return country ? country.label : countryId;
  }
}

DSCountrySelectComponent.editForm = (...args) => {
  const editForm = SelectComponent.editForm(...args);
  editForm.components.unshift(
    { type: 'checkbox', key: 'customBooleanProp', label: 'Grid Üzerinde Gösterilsin', input: true, weight: 15 },
    { type: 'checkbox', key: 'workFlowProp', label: 'İş Akışı Üzerinde Gösterilsin', input: true, weight: 15 },
    { type: 'checkbox', key: 'multiple', label: 'Çoklu Ülke Seçimi', input: true, weight: 15, defaultValue: false }
  );
  return editForm;
};

Formio.Components.addComponent('dscountryselect', DSCountrySelectComponent);


