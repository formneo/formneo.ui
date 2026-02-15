"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PathSelector = void 0;
var react_1 = __importDefault(require("react"));
var react_2 = require("@designable/react");
var antd_1 = require("antd");
var transformDataSource = function (node) {
    var currentNode = node;
    var dots = function (count) {
        var dots = '';
        for (var i = 0; i < count; i++) {
            dots += '.';
        }
        return dots;
    };
    var targetPath = function (parentNode, targetNode) {
        var path = [];
        var transform = function (node) {
            if (node && node !== parentNode) {
                path.push(node.props.name || node.id);
            }
            else {
                transform(node.parent);
            }
        };
        transform(targetNode);
        return path.reverse().join('.');
    };
    var hasNoVoidChildren = function (node) {
        var _a;
        return (_a = node.children) === null || _a === void 0 ? void 0 : _a.some(function (node) {
            if (node.props.type !== 'void' && node !== currentNode)
                return true;
            return hasNoVoidChildren(node);
        });
    };
    var findRoot = function (node) {
        var _a;
        if (!(node === null || node === void 0 ? void 0 : node.parent))
            return node;
        if (((_a = node === null || node === void 0 ? void 0 : node.parent) === null || _a === void 0 ? void 0 : _a.componentName) !== node.componentName)
            return node.parent;
        return findRoot(node.parent);
    };
    var findArrayParent = function (node) {
        if (!(node === null || node === void 0 ? void 0 : node.parent))
            return;
        if (node.parent.props.type === 'array')
            return node.parent;
        if (node.parent === root)
            return;
        return findArrayParent(node.parent);
    };
    var transformRelativePath = function (arrayNode, targetNode) {
        if (targetNode.depth === currentNode.depth)
            return ".".concat(targetNode.props.name || targetNode.id);
        return "".concat(dots(currentNode.depth - arrayNode.depth), "[].").concat(targetPath(arrayNode, targetNode));
    };
    var transformChildren = function (children, path) {
        if (path === void 0) { path = []; }
        return children.reduce(function (buf, node) {
            var _a;
            if (node === currentNode)
                return buf;
            // Array alanları (ArrayTable, ArrayCards) Source Field listesinde göster
            // if (node.props.type === 'array' && !node.contains(currentNode)) return buf; // KALDIRILDI
            if (node.props.type === 'void' && !hasNoVoidChildren(node))
                return buf;
            var currentPath = path.concat(node.props.name || node.id);
            var arrayNode = findArrayParent(node);
            var label = node.props.title ||
                ((_a = node.props['x-component-props']) === null || _a === void 0 ? void 0 : _a.title) ||
                node.props.name ||
                node.designerProps.title;
            var value = arrayNode
                ? transformRelativePath(arrayNode, node)
                : currentPath.join('.');
            return buf.concat({
                label: label,
                value: value,
                node: node,
                children: transformChildren(node.children, currentPath),
            });
        }, []);
    };
    var root = findRoot(node);
    if (root) {
        return transformChildren(root.children);
    }
    return [];
};
var PathSelector = function (props) {
    var baseNode = (0, react_2.useSelectedNode)();
    var dataSource = transformDataSource(baseNode);
    var findNode = function (dataSource, value) {
        var _a;
        for (var i = 0; i < dataSource.length; i++) {
            var item = dataSource[i];
            if (item.value === value)
                return item.node;
            if ((_a = item.children) === null || _a === void 0 ? void 0 : _a.length) {
                var fondedChild = findNode(item.children, value);
                if (fondedChild)
                    return fondedChild;
            }
        }
    };
    return (react_1.default.createElement(antd_1.TreeSelect, __assign({}, props, { onChange: function (value) {
            props.onChange(value, findNode(dataSource, value));
        }, treeDefaultExpandAll: true, treeData: dataSource })));
};
exports.PathSelector = PathSelector;
