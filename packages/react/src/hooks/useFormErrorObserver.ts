import { Field } from "@goodie-forms/core";
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

  const filteredIssues = form.controller._issues.filter((issue) => {
    if (options?.include == null) return true;
    const path = Field.parsePath(issue.path!) as Field.Paths<TShape>;
    return options.include.includes(path);
  });

  const observedIssues = groupBy(
    filteredIssues,
    (issue) => Field.parsePath(issue.path!) as Field.Paths<TShape>,
  );

  useEffect(() => {
    const { events } = form.controller;

    return composeFns(
      events.on("fieldIssuesUpdated", (path) => {
        if (options?.include?.includes?.(path) ?? true) {
          renderControl.forceRerender();
        }
      }),
    );
  }, []);

  return observedIssues;
}
