import { FieldPath } from "@goodie-forms/core";
import { UseForm } from "packages/react/src/hooks/useForm";
import { useRenderControl } from "packages/react/src/hooks/useRenderControl";
import { composeFns } from "packages/react/src/utils/composeFns";
import { useEffect } from "react";

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
