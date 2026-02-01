import { Formio } from '@formio/react';
const SelectComponent = Formio.Components.components.select;

export class DSApproverSelectComponent extends SelectComponent {
  static schema(...extend) {
    return SelectComponent.schema({
      label: 'Onaylayıcı Seçimi',
      type: 'dsapproverselect',
      key: 'approverSelect',
      dataSrc: 'custom',
      data: { custom: 'values = [];' },
      valueProperty: 'value',
      template: '<span>{{ item.label }}</span>',
      disableLimit: true,
      searchEnabled: true,
      searchField: 'label',
      minSearch: 0,
      placeholder: 'Onaylayıcı seçiniz...',
      validate: { required: false },
      customBooleanProp: false,
      multiple: false,
      widget: 'choicesjs'
    }, ...extend);
  }

  static get builderInfo() {
    return {
      title: 'Onaylayıcı Seçici',
      group: 'dscomponents',
      icon: 'verified_user',
      weight: 38,
      documentation: '/userguide/#approver-select',
      schema: DSApproverSelectComponent.schema()
    };
  }

  attach(element) {
    const promise = super.attach(element);
    this.loadApprovers();
    return promise;
  }

  async loadApprovers() {
    try {
      // Kullanıcı listesini API'den çekip onaylayıcı olarak kullan
      const getConfiguration = (await import('../../../../../confiuration')).default;
      const { UserApi } = await import('../../../../../api/generated');
      
      
      
      const conf = getConfiguration();
      const api = new UserApi(conf);
      
      const response = await api.apiUserGetAllUsersNameIdOnlyGet();
      
      if (response.data && Array.isArray(response.data)) {
        const users = response.data;
        
        
        this.component.dataSrc = 'values';
        this.component.data = {
          values: users.map(user => ({
            label: `${user.name || user.userName || 'İsimsiz'} (Onaylayıcı)`,
            value: user.id
          }))
        };
        
        this.triggerUpdate();
        
        if (this.choices) {
          this.choices.clearStore();
          this.choices.setChoices(this.component.data.values, 'value', 'label', true);
        } else {
          this.redraw();
        }
        
        
      } else {
        this.loadFallbackApprovers();
      }
    } catch (error) {
      console.error('❌ Onaylayıcı listesi yüklenirken hata:', error);
      this.loadFallbackApprovers();
    }
  }

  loadFallbackApprovers() {
    
    
    this.component.dataSrc = 'values';
    this.component.data = {
      values: [
        { label: 'Ahmet Yılmaz (Müdür)', value: 'approver-1' },
        { label: 'Ayşe Demir (Direktör)', value: 'approver-2' },
        { label: 'Mehmet Kaya (Genel Müdür)', value: 'approver-3' },
        { label: 'Fatma Şahin (Bölüm Şefi)', value: 'approver-4' },
        { label: 'Ali Öztürk (Koordinatör)', value: 'approver-5' }
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
      return value.map(v => this.getApproverLabel(v)).filter(Boolean).join(', ');
    }
    return this.getApproverLabel(value) || value;
  }

  getApproverLabel(approverId) {
    if (!this.component.data?.values) return approverId;
    const approver = this.component.data.values.find(a => a.value === approverId);
    return approver ? approver.label : approverId;
  }
}

DSApproverSelectComponent.editForm = (...args) => {
  const editForm = SelectComponent.editForm(...args);
  editForm.components.unshift(
    { type: 'checkbox', key: 'customBooleanProp', label: 'Grid Üzerinde Gösterilsin', input: true, weight: 15 },
    { type: 'checkbox', key: 'workFlowProp', label: 'İş Akışı Üzerinde Gösterilsin', input: true, weight: 15 },
    { type: 'checkbox', key: 'multiple', label: 'Çoklu Onaylayıcı Seçimi', input: true, weight: 15, defaultValue: false }
  );
  return editForm;
};

Formio.Components.addComponent('dsapproverselect', DSApproverSelectComponent);


