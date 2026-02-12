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
      form.controller.events.on("fieldRegistered", (fieldPath) => {
        if (FieldPath.equals(path, fieldPath)) {
          renderControl.forceRerender();
        }
      }),
      form.controller.events.on("valueChanged", (changedPath) => {
        if (
          FieldPath.equals(changedPath, path) ||
          FieldPath.isDescendant(changedPath, path)
        ) {
          renderControl.forceRerender();
        }
      }),
    );
  }, []);

  return value;
}
