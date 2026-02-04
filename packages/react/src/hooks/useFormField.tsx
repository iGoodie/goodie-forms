import { FieldPath } from "@goodie-forms/core";
import { useEffect, useState } from "react";
import { UseForm } from "../hooks/useForm";
import { useRenderControl } from "../hooks/useRenderControl";
import { composeFns } from "../utils/composeFns";

export function useFormField<
  TOutput extends object,
  TPath extends FieldPath.Segments,
>(
  form: UseForm<TOutput>,
  path: TPath,
  bindingConfig?: Parameters<typeof form.controller.bindField<TPath>>[1],
) {
  const renderControl = useRenderControl();

  const [field, setField] = useState(() => {
    let field = form.controller.getField(path);
    if (field == null && bindingConfig != null) {
      field = form.controller.bindField(path, bindingConfig);
    }
    return field;
  });

  useEffect(() => {
    const { events } = form.controller;

    setField(form.controller.getField(path));

    const stringPath = FieldPath.toStringPath(path);

    return composeFns(
      events.on("fieldBound", (_path) => {
        if (!FieldPath.equals(_path, path)) return;
        setField(form.controller.getField(path));
      }),
      events.on("fieldUnbound", (_path) => {
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
