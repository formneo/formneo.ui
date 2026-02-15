/**
 * Formily ReactionsSetter with Designer Context
 * Nested schema desteği + Tree debug
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Designer, Workspace, useOperation } from "@designable/react";
import { createDesigner, GlobalRegistry } from "@designable/core";
import { transformToTreeNode } from "@designable/formily-transformer";
import { ReactionsSetter } from "@designable/formily-setters";
import { Spin, Alert } from "antd";
import "@designable/react/dist/designable.react.umd.production.css";

const FormTaskReactionsSetter = ({ formDesign, value, onChange }) => {
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  GlobalRegistry.setDesignerLanguage("en-US");

  const engine = useMemo(
    () =>
      createDesigner({
        rootComponentName: "Form",
      }),
    []
  );

  const loadedSchemaRef = useRef(null);

  const TreeLoader = () => {
    const operation = useOperation();

    useEffect(() => {
      if (!formDesign || !operation) {
        setStatus('error');
        setError('Form design veya operation yok');
        return;
      }

      try {
        let schema = formDesign?.schema;
        const form = formDesign?.form || {};

        if (!schema && formDesign && typeof formDesign === "object") {
          schema = formDesign;
        }

        if (!schema) {
          setStatus('error');
          setError('Schema bulunamadı');
          return;
        }

        if (!schema.properties || Object.keys(schema.properties).length === 0) {
          setStatus('error');
          setError('Schema properties boş - form alanı yok');
          return;
        }

        // Aynı schema daha önce yüklendiyse tekrar yükleme - sürekli render loop'unu önle
        const schemaKey = JSON.stringify(Object.keys(schema.properties));
        if (loadedSchemaRef.current === schemaKey) {
          setStatus('ready');
          return;
        }
        loadedSchemaRef.current = schemaKey;

        // Tree oluştur
        const design = { schema, form };
        const root = transformToTreeNode(design);

        if (!root) {
          setStatus('error');
          setError('Tree node oluşturulamadı');
          return;
        }

        // Card içindeki field'ları çıkar (flatten)
        const flattenTree = (node) => {
          if (!node.children) return;

          const newChildren = [];
          
          node.children.forEach(child => {
            // Eğer Card veya void container ise, children'ını al
            if (
              child.componentName === 'Card' || 
              child.componentName === 'FormGrid' ||
              child.componentName === 'FormLayout' ||
              (child.props?.type === 'void' && child.children?.length > 0)
            ) {
              // Card'ın children'ını ekle
              if (child.children) {
                newChildren.push(...child.children);
                // Recursive: nested Card'lar için
                child.children.forEach(c => flattenTree(c));
              }
            } else {
              // Normal field, olduğu gibi ekle
              newChildren.push(child);
              flattenTree(child);
            }
          });

          node.children = newChildren;
        };

        flattenTree(root);

        // Tree'yi yükle
        operation.tree.from(root);

        // İlk gerçek field'ı seç
        const findFirstRealField = (node) => {
          if (!node?.children?.length) return node;
          
          for (const child of node.children) {
            // Void olmayan, component'i olan field
            if (
              child.props?.['x-component'] && 
              child.props?.type !== 'void' &&
              child.componentName !== 'Card'
            ) {
              return child;
            }
          }
          
          // Bulunamadıysa ilk child
          return node.children[0];
        };

        const toSelect = findFirstRealField(root) || root;
        operation.selection.select(toSelect);

        setStatus('ready');
      } catch (e) {
        console.error('❌ Tree yükleme hatası:', e);
        setStatus('error');
        setError(e instanceof Error ? e.message : 'Bilinmeyen hata');
      }
    }, [formDesign, operation]);

    return null;
  };

  if (!formDesign) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin tip="Form şeması yükleniyor..." />
      </div>
    );
  }

  return (
    <Designer engine={engine}>
      <Workspace id="form-task-reactions-workspace">
        <TreeLoader />

        {status === 'loading' && (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <Spin tip="Tree yükleniyor..." />
          </div>
        )}

        {status === 'error' && (
          <div style={{ padding: 24 }}>
            <Alert
              type="error"
              message="Hata"
              description={error}
              showIcon
            />
          </div>
        )}

        {status === 'ready' && (
          <div style={{ padding: 16 }}>
            <ReactionsSetter
              value={value}
              onChange={onChange}
            />
          </div>
        )}
      </Workspace>
    </Designer>
  );
};

export default FormTaskReactionsSetter;