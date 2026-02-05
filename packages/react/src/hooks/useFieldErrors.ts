import { FieldPath } from "@goodie-forms/core";
import { useEffect } from "react";
import { UseForm } from "../hooks/useForm";
import { useRenderControl } from "../hooks/useRenderControl";
import { composeFns } from "../utils/composeFns";

export function useFieldErrors<
  TOutput extends object,
  TPath extends FieldPath.Segments,
>(form: UseForm<TOutput>, path: TPath) {
  const renderControl = useRenderControl();

  const issues = form.controller.getField(path)?.issues;

  useEffect(() => {
    return composeFns(
      form.controller.events.on("fieldBound", (fieldPath) => {
        if (FieldPath.equals(path, fieldPath)) {
          renderControl.forceRerender();
        }
      }),
      form.controller.events.on("fieldIssuesUpdated", (fieldPath) => {
        if (FieldPath.equals(path, fieldPath)) {
          renderControl.forceRerender();
        }
      }),
    );
  }, []);

  return issues;
}
