import { Formio } from '@formio/react';
const SelectComponent = Formio.Components.components.select;

export class DSCitySelectComponent extends SelectComponent {
  static schema(...extend) {
    return SelectComponent.schema({
      label: 'Şehir Seçimi',
      type: 'dscityselect',
      key: 'citySelect',
      dataSrc: 'custom',
      data: { custom: 'values = [];' },
      valueProperty: 'value',
      template: '<span>{{ item.label }}</span>',
      disableLimit: true,
      searchEnabled: true,
      searchField: 'label',
      minSearch: 0,
      placeholder: 'Şehir seçiniz...',
      validate: { required: false },
      customBooleanProp: false,
      multiple: false,
      widget: 'choicesjs'
    }, ...extend);
  }

  static get builderInfo() {
    return {
      title: 'Şehir Seçici',
      group: 'dscomponents',
      icon: 'location_city',
      weight: 37,
      documentation: '/userguide/#city-select',
      schema: DSCitySelectComponent.schema()
    };
  }

  attach(element) {
    const promise = super.attach(element);
    this.loadCities();
    return promise;
  }

  async loadCities() {
    this.component.dataSrc = 'values';
    this.component.data = {
      values: [
        { label: 'İstanbul', value: 'city-istanbul' },
        { label: 'Ankara', value: 'city-ankara' },
        { label: 'İzmir', value: 'city-izmir' },
        { label: 'Bursa', value: 'city-bursa' },
        { label: 'Antalya', value: 'city-antalya' },
        { label: 'Adana', value: 'city-adana' },
        { label: 'Gaziantep', value: 'city-gaziantep' },
        { label: 'Konya', value: 'city-konya' },
        { label: 'Kayseri', value: 'city-kayseri' },
        { label: 'Mersin', value: 'city-mersin' },
        { label: 'Eskişehir', value: 'city-eskisehir' },
        { label: 'Diyarbakır', value: 'city-diyarbakir' },
        { label: 'Samsun', value: 'city-samsun' },
        { label: 'Denizli', value: 'city-denizli' },
        { label: 'Şanlıurfa', value: 'city-sanliurfa' },
        { label: 'Kocaeli', value: 'city-kocaeli' },
        { label: 'Malatya', value: 'city-malatya' },
        { label: 'Trabzon', value: 'city-trabzon' }
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
      return value.map(v => this.getCityLabel(v)).filter(Boolean).join(', ');
    }
    return this.getCityLabel(value) || value;
  }

  getCityLabel(cityId) {
    if (!this.component.data?.values) return cityId;
    const city = this.component.data.values.find(c => c.value === cityId);
    return city ? city.label : cityId;
  }
}

DSCitySelectComponent.editForm = (...args) => {
  const editForm = SelectComponent.editForm(...args);
  editForm.components.unshift(
    { type: 'checkbox', key: 'customBooleanProp', label: 'Grid Üzerinde Gösterilsin', input: true, weight: 15 },
    { type: 'checkbox', key: 'workFlowProp', label: 'İş Akışı Üzerinde Gösterilsin', input: true, weight: 15 },
    { type: 'checkbox', key: 'multiple', label: 'Çoklu Şehir Seçimi', input: true, weight: 15, defaultValue: false }
  );
  return editForm;
};

Formio.Components.addComponent('dscityselect', DSCitySelectComponent);


