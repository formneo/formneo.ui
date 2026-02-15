/**
 * Formily SchemaField scope helper - workflow step ve diğer sistem değişkenleri.
 * x-reactions ifadelerinde {{ $step }} kullanılabilir.
 */
import { useMemo } from "react";
import type { Form } from "@formily/core";

export type FormWorkflowScope = {
  /** Mevcut workflow adımı (form.values.__system.workflowStep) */
  $step: () => string | undefined;
};

/**
 * Form instance'dan workflow scope oluşturur.
 * SchemaField scope prop'una geçirilebilir.
 *
 * @example
 * const scope = createFormWorkflowScope(form);
 * <SchemaField schema={schema} scope={{ ...scope, ...otherScope }} />
 *
 * @example x-reactions'ta kullanım
 * visible: "{{ $step === 'form_step_1' }}"
 * disabled: "{{ $step !== 'approval_step' }}"
 */
export function createFormWorkflowScope(form: Form | null | undefined): FormWorkflowScope {
  return {
    $step: () => form?.values?.__system?.workflowStep,
  };
}

/**
 * React hook - form değişse bile scope referansı korunur.
 *
 * @example
 * const scope = useFormWorkflowScope(form);
 * return (
 *   <FormProvider form={form}>
 *     <SchemaField schema={schema} scope={{ $step: scope.$step }} />
 *   </FormProvider>
 * );
 */
export function useFormWorkflowScope(form: Form | null | undefined): FormWorkflowScope {
  return useMemo(
    () => createFormWorkflowScope(form),
    [form]
  );
}
