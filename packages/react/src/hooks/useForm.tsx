import { FormController, type Form } from "@goodie-forms/core";
import { useEffect, useState } from "react";
import { composeFns } from "../utils/composeFns";
import { useRenderControl } from "../hooks/useRenderControl";

export function useForm<TShape extends object>(
  formConfigs: Form.FormConfigs<TShape>,
  hookConfigs?: {
    validateMode?: "onChange" | "onBlur" | "onSubmit";
    revalidateMode?: "onChange" | "onBlur" | "onSubmit";
    watchIssues?: boolean;
    watchValues?: boolean;
  },
) {
  const [controller] = useState(() => new FormController(formConfigs));

  const renderControl = useRenderControl();

  useEffect(() => {
    const noop = () => {};

    return composeFns(
      controller.events.on("submissionStatusChange", () => {
        renderControl.forceRerender();
      }),
      hookConfigs?.watchIssues
        ? controller.events.on("fieldIssuesUpdated", () =>
            renderControl.forceRerender(),
          )
        : noop,
      hookConfigs?.watchValues
        ? controller.events.on("valueChanged", () =>
            renderControl.forceRerender(),
          )
        : noop,
    );
  }, [controller]);

  return {
    formConfigs,
    hookConfigs,
    controller,
  };
}

export type UseForm<TShape extends object> = ReturnType<typeof useForm<TShape>>;
