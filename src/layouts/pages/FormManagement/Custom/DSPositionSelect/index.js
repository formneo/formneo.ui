import { Formio } from '@formio/react';
const SelectComponent = Formio.Components.components.select;

export class DSPositionSelectComponent extends SelectComponent {
  static schema(...extend) {
    return SelectComponent.schema({
      label: 'Pozisyon Seçimi',
      type: 'dspositionselect',
      key: 'positionSelect',
      dataSrc: 'custom',
      data: { custom: 'values = [];' },
      valueProperty: 'value',
      template: '<span>{{ item.label }}</span>',
      disableLimit: true,
      searchEnabled: true,
      searchField: 'label',
      minSearch: 0,
      placeholder: 'Pozisyon seçiniz...',
      validate: { required: false },
      customBooleanProp: false,
      multiple: false,
      widget: 'choicesjs'
    }, ...extend);
  }

  static get builderInfo() {
    return {
      title: 'Pozisyon Seçici',
      group: 'dscomponents',
      icon: 'badge',
      weight: 28,
      documentation: '/userguide/#position-select',
      schema: DSPositionSelectComponent.schema()
    };
  }

  attach(element) {
    const promise = super.attach(element);
    this.loadPositions();
    return promise;
  }

  async loadPositions() {
    this.component.dataSrc = 'values';
    this.component.data = {
      values: [
        { label: 'Yazılım Geliştirici', value: 'pos-developer' },
        { label: 'Proje Yöneticisi', value: 'pos-pm' },
        { label: 'İş Analisti', value: 'pos-analyst' },
        { label: 'Sistem Yöneticisi', value: 'pos-sysadmin' },
        { label: 'Veri Bilimcisi', value: 'pos-datascientist' },
        { label: 'UI/UX Tasarımcı', value: 'pos-designer' },
        { label: 'DevOps Mühendisi', value: 'pos-devops' },
        { label: 'Ürün Sahibi', value: 'pos-po' },
        { label: 'Scrum Master', value: 'pos-scrum' },
        { label: 'QA Tester', value: 'pos-qa' },
        { label: 'Müdür', value: 'pos-manager' },
        { label: 'Direktör', value: 'pos-director' },
        { label: 'Genel Müdür', value: 'pos-ceo' }
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
      return value.map(v => this.getPositionLabel(v)).filter(Boolean).join(', ');
    }
    return this.getPositionLabel(value) || value;
  }

  getPositionLabel(posId) {
    if (!this.component.data?.values) return posId;
    const pos = this.component.data.values.find(p => p.value === posId);
    return pos ? pos.label : posId;
  }
}

DSPositionSelectComponent.editForm = (...args) => {
  const editForm = SelectComponent.editForm(...args);
  editForm.components.unshift(
    { type: 'checkbox', key: 'customBooleanProp', label: 'Grid Üzerinde Gösterilsin', input: true, weight: 15 },
    { type: 'checkbox', key: 'workFlowProp', label: 'İş Akışı Üzerinde Gösterilsin', input: true, weight: 15 },
    { type: 'checkbox', key: 'multiple', label: 'Çoklu Pozisyon Seçimi', input: true, weight: 15, defaultValue: false }
  );
  return editForm;
};

Formio.Components.addComponent('dspositionselect', DSPositionSelectComponent);


