import { Formio } from '@formio/react';
const SelectComponent = Formio.Components.components.select;

export class DSProjectSelectComponent extends SelectComponent {
  static schema(...extend) {
    return SelectComponent.schema({
      label: 'Proje Seçimi',
      type: 'dsprojectselect',
      key: 'projectSelect',
      dataSrc: 'custom',
      data: { custom: 'values = [];' },
      valueProperty: 'value',
      template: '<span>{{ item.label }}</span>',
      disableLimit: true,
      searchEnabled: true,
      searchField: 'label',
      minSearch: 0,
      placeholder: 'Proje seçiniz...',
      validate: { required: false },
      customBooleanProp: false,
      multiple: false,
      widget: 'choicesjs'
    }, ...extend);
  }

  static get builderInfo() {
    return {
      title: 'Proje Seçici',
      group: 'dscomponents',
      icon: 'folder_special',
      weight: 31,
      documentation: '/userguide/#project-select',
      schema: DSProjectSelectComponent.schema()
    };
  }

  attach(element) {
    const promise = super.attach(element);
    this.loadProjects();
    return promise;
  }

  async loadProjects() {
    this.component.dataSrc = 'values';
    this.component.data = {
      values: [
        { label: 'FormNeo Platform Geliştirme', value: 'proj-formneo' },
        { label: 'Müşteri Portalı', value: 'proj-customer-portal' },
        { label: 'Mobil Uygulama', value: 'proj-mobile-app' },
        { label: 'ERP Entegrasyonu', value: 'proj-erp' },
        { label: 'Workflow Engine', value: 'proj-workflow' },
        { label: 'Raporlama Modülü', value: 'proj-reporting' },
        { label: 'API Gateway', value: 'proj-api-gateway' },
        { label: 'Mikroservis Mimarisi', value: 'proj-microservices' }
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
      return value.map(v => this.getProjectLabel(v)).filter(Boolean).join(', ');
    }
    return this.getProjectLabel(value) || value;
  }

  getProjectLabel(projId) {
    if (!this.component.data?.values) return projId;
    const proj = this.component.data.values.find(p => p.value === projId);
    return proj ? proj.label : projId;
  }
}

DSProjectSelectComponent.editForm = (...args) => {
  const editForm = SelectComponent.editForm(...args);
  editForm.components.unshift(
    { type: 'checkbox', key: 'customBooleanProp', label: 'Grid Üzerinde Gösterilsin', input: true, weight: 15 },
    { type: 'checkbox', key: 'workFlowProp', label: 'İş Akışı Üzerinde Gösterilsin', input: true, weight: 15 },
    { type: 'checkbox', key: 'multiple', label: 'Çoklu Proje Seçimi', input: true, weight: 15, defaultValue: false }
  );
  return editForm;
};

Formio.Components.addComponent('dsprojectselect', DSProjectSelectComponent);


