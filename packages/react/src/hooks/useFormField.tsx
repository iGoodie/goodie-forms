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
  defaultValue?: Field.GetValue<TShape, TPath>,
) {
  const renderControl = useRenderControl();

  const [field] = useState(() => {
    return (
      form.controller.getField(path) ??
      form.controller.bindField(path, {
        defaultValue: defaultValue,
      })
    );
  });

  useEffect(() => {
    const { events } = form.controller;

    return composeFns(
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
