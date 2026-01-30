import type { Field } from "@goodie-forms/core";
import type { UseForm } from "../hooks/useForm";
import { useRenderControl } from "../hooks/useRenderControl";
import flow from "lodash.flow";
import { useEffect } from "react";
import { groupBy } from "remeda";

export function useFormErrors<TShape extends object>(
  form: UseForm<TShape>,
  options?: {
    include?: Field.Paths<TShape>[];
  },
) {
  const renderControl = useRenderControl();

  useEffect(() => {
    const { events } = form.controller;

    return flow(
      events.on("validationIssuesUpdated", (path) => {
        if (options?.include?.includes?.(path) ?? true) {
          renderControl.forceRerender();
        }
      }),
    );
  }, []);

  const filteredIssues = form.controller._issues.filter((issue) => {
    if (options?.include == null) return true;
    const path = issue.path?.join(".") as Field.Paths<TShape>;
    return options.include.includes(path);
  });

  return groupBy(filteredIssues, (issue) =>
    issue.path?.join("."),
  ) as unknown as Partial<
    Record<Field.Paths<TShape>, typeof form.controller._issues>
  >;
}
