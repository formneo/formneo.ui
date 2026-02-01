import { Formio } from '@formio/react';
const SelectComponent = Formio.Components.components.select;

export class DSLocationSelectComponent extends SelectComponent {
  static schema(...extend) {
    return SelectComponent.schema({
      label: 'Lokasyon Seçimi',
      type: 'dslocationselect',
      key: 'locationSelect',
      dataSrc: 'custom',
      data: { custom: 'values = [];' },
      valueProperty: 'value',
      template: '<span>{{ item.label }}</span>',
      disableLimit: true,
      searchEnabled: true,
      searchField: 'label',
      minSearch: 0,
      placeholder: 'Lokasyon seçiniz...',
      validate: { required: false },
      customBooleanProp: false,
      multiple: false,
      widget: 'choicesjs'
    }, ...extend);
  }

  static get builderInfo() {
    return {
      title: 'Lokasyon Seçici',
      group: 'dscomponents',
      icon: 'location_on',
      weight: 30,
      documentation: '/userguide/#location-select',
      schema: DSLocationSelectComponent.schema()
    };
  }

  attach(element) {
    const promise = super.attach(element);
    this.loadLocations();
    return promise;
  }

  async loadLocations() {
    this.component.dataSrc = 'values';
    this.component.data = {
      values: [
        { label: 'İstanbul - Merkez Ofis', value: 'loc-istanbul-hq' },
        { label: 'İstanbul - Avrupa Yakası', value: 'loc-istanbul-eu' },
        { label: 'İstanbul - Anadolu Yakası', value: 'loc-istanbul-as' },
        { label: 'Ankara - Çankaya Şubesi', value: 'loc-ankara-cankaya' },
        { label: 'İzmir - Alsancak Şubesi', value: 'loc-izmir-alsancak' },
        { label: 'Bursa - Nilüfer Şubesi', value: 'loc-bursa-nilufer' },
        { label: 'Antalya - Konyaaltı Şubesi', value: 'loc-antalya-konyaalti' }
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
      return value.map(v => this.getLocationLabel(v)).filter(Boolean).join(', ');
    }
    return this.getLocationLabel(value) || value;
  }

  getLocationLabel(locId) {
    if (!this.component.data?.values) return locId;
    const loc = this.component.data.values.find(l => l.value === locId);
    return loc ? loc.label : locId;
  }
}

DSLocationSelectComponent.editForm = (...args) => {
  const editForm = SelectComponent.editForm(...args);
  editForm.components.unshift(
    { type: 'checkbox', key: 'customBooleanProp', label: 'Grid Üzerinde Gösterilsin', input: true, weight: 15 },
    { type: 'checkbox', key: 'workFlowProp', label: 'İş Akışı Üzerinde Gösterilsin', input: true, weight: 15 },
    { type: 'checkbox', key: 'multiple', label: 'Çoklu Lokasyon Seçimi', input: true, weight: 15, defaultValue: false }
  );
  return editForm;
};

Formio.Components.addComponent('dslocationselect', DSLocationSelectComponent);


