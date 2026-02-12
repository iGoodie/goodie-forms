import { FormController } from "@goodie-forms/core";
import { useEffect, useState } from "react";
import { useRenderControl } from "../hooks/useRenderControl";
import { composeFns } from "../utils/composeFns";

export function useForm<TOutput extends object>(
  formConfigs: FormController.Configs<TOutput>,
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
    path: controller.path,
  };
}

export type UseForm<TOutput extends object> = ReturnType<
  typeof useForm<TOutput>
>;
