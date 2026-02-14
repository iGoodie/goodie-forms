import { FormController } from "@goodie-forms/core";
import { useCallback, useState, useSyncExternalStore } from "react";
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

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const noop = () => {};

      return composeFns(
        controller.events.on("submissionStatusChange", onStoreChange),
        hookConfigs?.watchIssues
          ? controller.events.on("fieldIssuesUpdated", onStoreChange)
          : noop,
        hookConfigs?.watchValues
          ? controller.events.on("valueChanged", onStoreChange)
          : noop,
      );
    },
    [controller, hookConfigs?.watchIssues, hookConfigs?.watchValues],
  );

  useSyncExternalStore(
    subscribe,
    () => controller,
    () => controller,
  );

  const useWatchValues = () =>
    useSyncExternalStore(
      (onStoreChange) => controller.events.on("valueChanged", onStoreChange),
      () => controller.data,
      () => controller.data,
    );

  const useWatchIssues = () =>
    useSyncExternalStore(
      (onStoreChange) =>
        controller.events.on("fieldIssuesUpdated", onStoreChange),
      () => controller.issues,
      () => controller.issues,
    );

  return {
    formConfigs,
    hookConfigs,
    controller,
    path: controller.path,
    watchValues: useWatchValues,
    watchIssues: useWatchIssues,
  };
}

export type UseForm<TOutput extends object> = ReturnType<
  typeof useForm<TOutput>
>;
