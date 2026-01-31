import { Field } from "@goodie-forms/core";
import { useEffect, useState } from "react";
import { UseForm } from "../hooks/useForm";
import { useRenderControl } from "../hooks/useRenderControl";
import { composeFns } from "../utils/composeFns";

export function useFormField<
  TShape extends object,
  TPath extends Field.Paths<TShape>,
>(
  form: UseForm<TShape>,
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

    return composeFns(
      events.on("fieldBound", (_path) => {
        if (_path === path) setField(form.controller.getField(path));
      }),
      events.on("fieldUnbound", (_path) => {
        if (_path === path) setField(undefined);
      }),
      events.on("valueChanged", (_path) => {
        if (_path === path) renderControl.forceRerender();
      }),
      events.on("fieldTouchUpdated", (_path) => {
        if (_path === path) renderControl.forceRerender();
      }),
      events.on("fieldDirtyUpdated", (_path) => {
        if (_path === path) renderControl.forceRerender();
      }),
      events.on("validationIssuesUpdated", (_path) => {
        if (_path === path) renderControl.forceRerender();
      }),
    );
  }, []);

  return field;
}
