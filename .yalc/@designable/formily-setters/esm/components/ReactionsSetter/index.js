var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
import React, { useEffect, useMemo, useState } from 'react';
import { clone, uid } from '@formily/shared';
import { createForm, isVoidField } from '@formily/core';
import { createSchemaField } from '@formily/react';
import { GlobalRegistry } from '@designable/core';
import { requestIdle } from '@designable/shared';
import { usePrefix, TextWidget } from '@designable/react';
import { MonacoInput } from '@designable/react-settings-form';
import { Form, ArrayTable, Input, Select, FormItem, FormCollapse, } from '@formily/antd';
import { Modal, Card, Button, Tag, Tooltip } from 'antd';
import { PathSelector } from './PathSelector';
import { FieldPropertySetter } from './FieldPropertySetter';

// Modal içindeki dropdown'ların tıklanabilir olması için - focus trap sorununu önler
var getPopupContainerForModal = function (triggerNode) {
  return (triggerNode === null || triggerNode === void 0 ? void 0 : triggerNode.closest('.ant-modal-body')) || document.body;
};
import { FulfillRunHelper } from './helpers';
import { initDeclaration } from './declarations';
import './styles.less';
var TypeView = function (_a) {
    var value = _a.value;
    var text = String(value);
    if (text.length <= 26)
        return React.createElement(Tag, null, text);
    return (React.createElement(Tag, null,
        React.createElement(Tooltip, { title: React.createElement("div", { style: { fontSize: 12 } },
                React.createElement("code", null,
                    React.createElement("pre", { style: { whiteSpace: 'pre-wrap', padding: 0, margin: 0 } }, text))) },
            text.substring(0, 24),
            "...")));
};
var SchemaField = createSchemaField({
    components: {
        Card: Card,
        FormCollapse: FormCollapse,
        Input: Input,
        TypeView: TypeView,
        Select: Select,
        FormItem: FormItem,
        PathSelector: PathSelector,
        FieldPropertySetter: FieldPropertySetter,
        ArrayTable: ArrayTable,
        MonacoInput: MonacoInput,
    },
});
var FieldStateProperties = [
    'value',
    'initialValue',
    'inputValue',
    'inputValues',
    'modified',
    'initialized',
    'title',
    'description',
    'mounted',
    'unmounted',
    'active',
    'visited',
    'loading',
    'errors',
    'warnings',
    'successes',
    'feedbacks',
    'valid',
    'invalid',
    'pattern',
    'display',
    'disabled',
    'readOnly',
    'readPretty',
    'visible',
    'hidden',
    'editable',
    'validateStatus',
    'validating',
];
var FieldStateValueTypes = {
    modified: 'boolean',
    initialized: 'boolean',
    title: 'string',
    description: 'string',
    mounted: 'boolean',
    unmounted: 'boolean',
    active: 'boolean',
    visited: 'boolean',
    loading: 'boolean',
    errors: 'string[]',
    warnings: 'string[]',
    successes: 'string[]',
    feedbacks: "Array<\n  triggerType?: 'onInput' | 'onFocus' | 'onBlur'\n  type?: 'error' | 'success' | 'warning'\n  code?:\n    | 'ValidateError'\n    | 'ValidateSuccess'\n    | 'ValidateWarning'\n    | 'EffectError'\n    | 'EffectSuccess'\n    | 'EffectWarning'\n  messages?: string[]\n>\n",
    valid: 'boolean',
    invalid: 'boolean',
    pattern: "'editable' | 'disabled' | 'readOnly' | 'readPretty'",
    display: "'visible' | 'hidden' | 'none'",
    disabled: 'boolean',
    readOnly: 'boolean',
    readPretty: 'boolean',
    visible: 'boolean',
    hidden: 'boolean',
    editable: 'boolean',
    validateStatus: "'error' | 'warning' | 'success' | 'validating'",
    validating: 'boolean',
};
export var ReactionsSetter = function (props) {
    var _a = __read(useState(false), 2), modalVisible = _a[0], setModalVisible = _a[1];
    var _b = __read(useState(false), 2), innerVisible = _b[0], setInnerVisible = _b[1];
    var prefix = usePrefix('reactions-setter');
    var form = useMemo(function () {
        return createForm({
            values: clone(props.value),
        });
    }, [modalVisible, props.value]);
    var formCollapse = useMemo(function () { return FormCollapse.createFormCollapse(['deps', 'state']); }, [modalVisible]);
    var openModal = function () { return setModalVisible(true); };
    var closeModal = function () { return setModalVisible(false); };
    useEffect(function () {
        if (modalVisible) {
            requestIdle(function () {
                initDeclaration().then(function () {
                    setInnerVisible(true);
                });
            }, {
                timeout: 400,
            });
        }
        else {
            setInnerVisible(false);
        }
    }, [modalVisible]);
    return (React.createElement(React.Fragment, null,
        React.createElement(Button, { block: true, onClick: openModal },
            React.createElement(TextWidget, { token: "SettingComponents.ReactionsSetter.configureReactions" })),
        React.createElement(Modal, { title: GlobalRegistry.getDesignerMessage('SettingComponents.ReactionsSetter.configureReactions'), width: "70%", centered: true, bodyStyle: { padding: 10 }, transitionName: "", maskTransitionName: "", visible: modalVisible, onCancel: closeModal, destroyOnClose: true, onOk: function () {
                form.submit(function (values) {
                    var _a;
                    (_a = props.onChange) === null || _a === void 0 ? void 0 : _a.call(props, values);
                });
                closeModal();
            } },
            React.createElement("div", { className: prefix }, innerVisible && (React.createElement(Form, { form: form },
                React.createElement(SchemaField, null,
                    React.createElement(SchemaField.Void, { "x-component": "FormCollapse", "x-component-props": {
                            formCollapse: formCollapse,
                            defaultActiveKey: ['deps', 'state'],
                            style: { marginBottom: 10 },
                        } },
                        React.createElement(SchemaField.Void, { "x-component": "FormCollapse.CollapsePanel", "x-component-props": {
                                key: 'deps',
                                header: GlobalRegistry.getDesignerMessage('SettingComponents.ReactionsSetter.relationsFields'),
                            } },
                            React.createElement(SchemaField.Array, { name: "dependencies", default: [{}], "x-component": "ArrayTable" },
                                React.createElement(SchemaField.Object, null,
                                    React.createElement(SchemaField.Void, { "x-component": "ArrayTable.Column", "x-component-props": {
                                            title: GlobalRegistry.getDesignerMessage('SettingComponents.ReactionsSetter.sourceField'),
                                            width: 240,
                                        } },
                                        React.createElement(SchemaField.String, { name: "source", "x-decorator": "FormItem", "x-component": "PathSelector", "x-component-props": {
                                                placeholder: GlobalRegistry.getDesignerMessage('SettingComponents.ReactionsSetter.pleaseSelect'),
                                                getPopupContainer: getPopupContainerForModal,
                                            } })),
                                    React.createElement(SchemaField.Void, { "x-component": "ArrayTable.Column", "x-component-props": {
                                            title: GlobalRegistry.getDesignerMessage('SettingComponents.ReactionsSetter.sourceProperty'),
                                            width: 200,
                                        } },
                                        React.createElement(SchemaField.String, { name: "property", default: "value", "x-decorator": "FormItem", "x-component": "Select", "x-component-props": { showSearch: true, getPopupContainer: getPopupContainerForModal }, enum: FieldStateProperties })),
                                    React.createElement(SchemaField.Void, { "x-component": "ArrayTable.Column", "x-component-props": {
                                            title: GlobalRegistry.getDesignerMessage('SettingComponents.ReactionsSetter.variableName'),
                                            width: 200,
                                        } },
                                        React.createElement(SchemaField.String, { name: "name", "x-decorator": "FormItem", "x-validator": {
                                                pattern: /^[$_a-zA-Z]+[$_a-zA-Z0-9]*$/,
                                                message: GlobalRegistry.getDesignerMessage('SettingComponents.ReactionsSetter.variableNameValidateMessage'),
                                            }, "x-component": "Input", "x-component-props": {
                                                addonBefore: '$deps.',
                                                placeholder: GlobalRegistry.getDesignerMessage('SettingComponents.ReactionsSetter.pleaseInput'),
                                            }, "x-reactions": function (field) {
                                                if (isVoidField(field))
                                                    return;
                                                field.query('.source').take(function (source) {
                                                    var _a, _b;
                                                    if (isVoidField(source))
                                                        return;
                                                    if (source.value &&
                                                        !field.value &&
                                                        !field.modified) {
                                                        field.value =
                                                            ((_b = (_a = source.inputValues[1]) === null || _a === void 0 ? void 0 : _a.props) === null || _b === void 0 ? void 0 : _b.name) ||
                                                                "v_".concat(uid());
                                                    }
                                                });
                                            } })),
                                    React.createElement(SchemaField.Void, { "x-component": "ArrayTable.Column", "x-component-props": {
                                            title: GlobalRegistry.getDesignerMessage('SettingComponents.ReactionsSetter.variableType'),
                                            ellipsis: {
                                                showTitle: false,
                                            },
                                            width: 200,
                                            align: 'center',
                                        } },
                                        React.createElement(SchemaField.String, { name: "type", default: "any", "x-decorator": "FormItem", "x-component": "TypeView", "x-reactions": function (field) {
                                                if (isVoidField(field))
                                                    return;
                                                var property = field
                                                    .query('.property')
                                                    .get('inputValues');
                                                if (!property)
                                                    return;
                                                property[0] = property[0] || 'value';
                                                field.query('.source').take(function (source) {
                                                    var _a, _b;
                                                    if (isVoidField(source))
                                                        return;
                                                    if (source.value) {
                                                        if (property[0] === 'value' ||
                                                            property[0] === 'initialValue' ||
                                                            property[0] === 'inputValue') {
                                                            field.value =
                                                                ((_b = (_a = source.inputValues[1]) === null || _a === void 0 ? void 0 : _a.props) === null || _b === void 0 ? void 0 : _b.type) ||
                                                                    'any';
                                                        }
                                                        else if (property[0] === 'inputValues') {
                                                            field.value = "any[]";
                                                        }
                                                        else if (property[0]) {
                                                            field.value =
                                                                FieldStateValueTypes[property[0]];
                                                        }
                                                        else {
                                                            field.value = 'any';
                                                        }
                                                    }
                                                });
                                            } })),
                                    React.createElement(SchemaField.Void, { "x-component": "ArrayTable.Column", "x-component-props": {
                                            title: GlobalRegistry.getDesignerMessage('SettingComponents.ReactionsSetter.operations'),
                                            align: 'center',
                                            width: 80,
                                        } },
                                        React.createElement(SchemaField.Markup, { type: "void", "x-component": "ArrayTable.Remove" }))),
                                React.createElement(SchemaField.Void, { title: GlobalRegistry.getDesignerMessage('SettingComponents.ReactionsSetter.addRelationField'), "x-component": "ArrayTable.Addition", "x-component-props": { style: { marginTop: 8 } } }))),
                        React.createElement(SchemaField.Void, { "x-component": "FormCollapse.CollapsePanel", "x-component-props": {
                                header: GlobalRegistry.getDesignerMessage('SettingComponents.ReactionsSetter.propertyReactions'),
                                key: 'state',
                                className: 'reaction-state',
                            } },
                            React.createElement(SchemaField.Markup, { name: "fulfill.state", "x-component": "FieldPropertySetter" })),
                        React.createElement(SchemaField.Void, { "x-component": "FormCollapse.CollapsePanel", "x-component-props": {
                                key: 'run',
                                header: GlobalRegistry.getDesignerMessage('SettingComponents.ReactionsSetter.actionReactions'),
                                className: 'reaction-runner',
                            } },
                            React.createElement(SchemaField.String, { name: "fulfill.run", "x-component": "MonacoInput", "x-component-props": {
                                    width: '100%',
                                    height: 400,
                                    language: 'typescript',
                                    helpCode: FulfillRunHelper,
                                    options: {
                                        minimap: {
                                            enabled: false,
                                        },
                                    },
                                }, "x-reactions": function (field) {
                                    var deps = field.query('dependencies').value();
                                    if (Array.isArray(deps)) {
                                        field.componentProps.extraLib = "\n                          declare var $deps : {\n                            ".concat(deps.map(function (_a) {
                                            var name = _a.name, type = _a.type;
                                            if (!name)
                                                return '';
                                            return "".concat(name, "?:").concat(type || 'any', ",");
                                        }), "\n                          }\n                          ");
                                    }
                                } }))))))))));
};
