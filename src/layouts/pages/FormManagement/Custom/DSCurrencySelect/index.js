import { Formio } from '@formio/react';
const SelectComponent = Formio.Components.components.select;

export class DSCurrencySelectComponent extends SelectComponent {
  static schema(...extend) {
    return SelectComponent.schema({
      label: 'Para Birimi',
      type: 'dscurrencyselect',
      key: 'currencySelect',
      dataSrc: 'custom',
      data: { custom: 'values = [];' },
      valueProperty: 'value',
      template: '<span>{{ item.label }}</span>',
      disableLimit: true,
      searchEnabled: true,
      searchField: 'label',
      minSearch: 0,
      placeholder: 'Para birimi seçiniz...',
      validate: { required: false },
      customBooleanProp: false,
      multiple: false,
      widget: 'choicesjs'
    }, ...extend);
  }

  static get builderInfo() {
    return {
      title: 'Para Birimi',
      group: 'dscomponents',
      icon: 'attach_money',
      weight: 35,
      documentation: '/userguide/#currency-select',
      schema: DSCurrencySelectComponent.schema()
    };
  }

  attach(element) {
    const promise = super.attach(element);
    this.loadCurrencies();
    return promise;
  }

  async loadCurrencies() {
    this.component.dataSrc = 'values';
    this.component.data = {
      values: [
        { label: 'TRY - Türk Lirası', value: 'TRY' },
        { label: 'USD - ABD Doları', value: 'USD' },
        { label: 'EUR - Euro', value: 'EUR' },
        { label: 'GBP - İngiliz Sterlini', value: 'GBP' },
        { label: 'CHF - İsviçre Frangı', value: 'CHF' },
        { label: 'JPY - Japon Yeni', value: 'JPY' },
        { label: 'CNY - Çin Yuanı', value: 'CNY' },
        { label: 'AED - BAE Dirhemi', value: 'AED' },
        { label: 'SAR - Suudi Arabistan Riyali', value: 'SAR' },
        { label: 'CAD - Kanada Doları', value: 'CAD' },
        { label: 'AUD - Avustralya Doları', value: 'AUD' }
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
      return value.map(v => this.getCurrencyLabel(v)).filter(Boolean).join(', ');
    }
    return this.getCurrencyLabel(value) || value;
  }

  getCurrencyLabel(currId) {
    if (!this.component.data?.values) return currId;
    const curr = this.component.data.values.find(c => c.value === currId);
    return curr ? curr.label : currId;
  }
}

DSCurrencySelectComponent.editForm = (...args) => {
  const editForm = SelectComponent.editForm(...args);
  editForm.components.unshift(
    { type: 'checkbox', key: 'customBooleanProp', label: 'Grid Üzerinde Gösterilsin', input: true, weight: 15 },
    { type: 'checkbox', key: 'workFlowProp', label: 'İş Akışı Üzerinde Gösterilsin', input: true, weight: 15 },
    { type: 'checkbox', key: 'multiple', label: 'Çoklu Para Birimi Seçimi', input: true, weight: 15, defaultValue: false }
  );
  return editForm;
};

Formio.Components.addComponent('dscurrencyselect', DSCurrencySelectComponent);


