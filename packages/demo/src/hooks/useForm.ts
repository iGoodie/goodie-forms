import { FormController, type Form } from "@goodie-forms/core";
import flow from "lodash.flow";
import { useRenderControl } from "../hooks/useRenderControl";
import { useEffect, useState } from "react";

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

  const [, setIsSubmitting] = useState(() => controller.isSubmitting);

  useEffect(() => {
    const noop = () => {};

    return flow(
      controller.events.on("statusChanged", (state) => {
        // Only re-render when submission state changes
        setIsSubmitting(state === "submitting");
      }),
      hookConfigs?.watchIssues
        ? controller.events.on("validationIssuesUpdated", () =>
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
