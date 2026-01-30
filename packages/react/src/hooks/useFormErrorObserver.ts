import type { Field } from "@goodie-forms/core";
import { useEffect } from "react";
import { composeFns } from "../utils/composeFns";
import { groupBy } from "../utils/groupBy";
import type { UseForm } from "./useForm";
import { useRenderControl } from "./useRenderControl";

export function useFormErrorObserver<TShape extends object>(
  form: UseForm<TShape>,
  options?: {
    include?: Field.Paths<TShape>[];
  },
) {
  const renderControl = useRenderControl();

  useEffect(() => {
    const { events } = form.controller;

    return composeFns(
      events.on("validationIssuesUpdated", (path) => {
        if (options?.include?.includes?.(path) ?? true) {
          renderControl.forceRerender();
        }
      }),
    );
  }, []);

  const filteredIssues = form.controller._issues.filter((issue) => {
    if (options?.include == null) return true;
    const path = issue.path!.join(".") as Field.Paths<TShape>;
    return options.include.includes(path);
  });

  return groupBy(
    filteredIssues,
    (issue) => issue.path!.join(".") as Field.Paths<TShape>,
  );
}
