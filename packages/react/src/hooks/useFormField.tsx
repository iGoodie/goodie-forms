import { FieldPath, FormField } from "@goodie-forms/core";
import { useEffect, useState } from "react";
import { UseForm } from "../hooks/useForm";
import { useRenderControl } from "../hooks/useRenderControl";
import { composeFns } from "../utils/composeFns";

/** TODO: doc */
export function useFormField<
  TOutput extends object,
  TPath extends FieldPath.Segments,
>(
  form: UseForm<TOutput>,
  path: TPath,
): FormField<TOutput, FieldPath.Resolve<TOutput, TPath>> | undefined;

/** TODO: doc */
export function useFormField<
  TOutput extends object,
  TPath extends FieldPath.Segments,
>(
  form: UseForm<TOutput>,
  path: TPath,
  bindingConfig: Parameters<typeof form.controller.registerField<TPath>>[1],
): FormField<TOutput, FieldPath.Resolve<TOutput, TPath>>;

/* --------------------------------- */

export function useFormField<
  TOutput extends object,
  TPath extends FieldPath.Segments,
>(
  form: UseForm<TOutput>,
  path: TPath,
  bindingConfig?: Parameters<typeof form.controller.registerField<TPath>>[1],
) {
  const renderControl = useRenderControl();

  const [field, setField] = useState(() => {
    let field = form.controller.getField(path);
    if (field == null && bindingConfig != null) {
      field = form.controller.registerField(path, bindingConfig);
    }
    return field;
  });

  useEffect(() => {
    const { events } = form.controller;

    setField(form.controller.getField(path));

    return composeFns(
      events.on("fieldRegistered", (_path) => {
        if (!FieldPath.equals(_path, path)) return;
        setField(form.controller.getField(path));
      }),
      events.on("fieldUnregistered", (_path) => {
        if (!FieldPath.equals(_path, path)) return;
        setField(undefined);
      }),
      events.on("valueChanged", (changedPath) => {
        if (
          FieldPath.equals(changedPath, path) ||
          FieldPath.isDescendant(changedPath, path)
        ) {
          renderControl.forceRerender();
        }
      }),
      events.on("fieldTouchUpdated", (_path) => {
        if (!FieldPath.equals(_path, path)) return;
        renderControl.forceRerender();
      }),
      events.on("fieldDirtyUpdated", (_path) => {
        if (!FieldPath.equals(_path, path)) return;
        renderControl.forceRerender();
      }),
      events.on("fieldIssuesUpdated", (_path) => {
        if (!FieldPath.equals(_path, path)) return;
        renderControl.forceRerender();
      }),
    );
  }, []);

  return field;
}
