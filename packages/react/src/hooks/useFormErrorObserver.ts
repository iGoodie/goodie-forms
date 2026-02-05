import { FieldPath } from "@goodie-forms/core";
import { groupBy } from "../utils/groupBy";
import { useEffect } from "react";
import { composeFns } from "../utils/composeFns";
import type { UseForm } from "./useForm";
import { useRenderControl } from "./useRenderControl";

/** @deprecated */
export function useFormErrorObserver<
  TOutput extends object,
  TInclude extends FieldPath.Segments[] | undefined = undefined,
>(
  form: UseForm<TOutput>,
  options?: {
    include?: TInclude;
  },
) {
  const renderControl = useRenderControl();

  const observedIssues = form.controller._issues.filter((issue) => {
    if (options?.include == null) return true;
    const normalizedIssuePath = FieldPath.normalize(issue.path);
    return options.include.some((path) =>
      FieldPath.equals(path, normalizedIssuePath),
    );
  });

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

  return groupBy(observedIssues, (issue) =>
    issue.path == null
      ? "$"
      : FieldPath.toStringPath(FieldPath.normalize(issue.path)),
  );
}
