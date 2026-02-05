import { FieldPath } from "@goodie-forms/core";
import { useEffect } from "react";
import { UseForm } from "../hooks/useForm";
import { useRenderControl } from "../hooks/useRenderControl";
import { composeFns } from "../utils/composeFns";

export function useFieldValue<
  TOutput extends object,
  TPath extends FieldPath.Segments,
>(form: UseForm<TOutput>, path: TPath) {
  const renderControl = useRenderControl();

  const value = form.controller.getField(path)?.value;

  useEffect(() => {
    return composeFns(
      form.controller.events.on("fieldBound", (fieldPath) => {
        if (FieldPath.equals(path, fieldPath)) {
          renderControl.forceRerender();
        }
      }),
      form.controller.events.on("valueChanged", (fieldPath) => {
        if (FieldPath.equals(path, fieldPath)) {
          renderControl.forceRerender();
        }
      }),
    );
  }, []);

  return value;
}
