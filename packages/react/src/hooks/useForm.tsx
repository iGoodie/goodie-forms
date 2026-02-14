import { FormController } from "@goodie-forms/core";
import { useCallback, useState, useSyncExternalStore } from "react";
import { useSyncMutableStore } from "../hooks/useSyncMutableStore";
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
    (onVersionChange: () => void) => {
      const noop = () => {};

      return composeFns(
        controller.events.on("submissionStatusChange", onVersionChange),
        hookConfigs?.watchIssues
          ? controller.events.on("fieldIssuesUpdated", onVersionChange)
          : noop,
        hookConfigs?.watchValues
          ? controller.events.on("fieldValueChanged", onVersionChange)
          : noop,
      );
    },
    [controller, hookConfigs?.watchIssues, hookConfigs?.watchValues],
  );

  useSyncMutableStore(subscribe, () => controller);

  const useWatchValues = () => {
    return useSyncExternalStore(
      (onStoreChange) =>
        controller.events.on("fieldValueChanged", onStoreChange),
      () => controller.data,
      () => controller.data,
    );
  };

  const useWatchIssues = () => {
    return useSyncExternalStore(
      (onStoreChange) =>
        controller.events.on("fieldIssuesUpdated", onStoreChange),
      () => controller.issues,
      () => controller.issues,
    );
  };

  const useWatchEvent = <E extends keyof typeof controller.events.events>(
    eventName: E,
    listener?: NonNullable<(typeof controller.events.events)[E]>[number],
  ) => {
    return useSyncMutableStore(
      (onVersionChange) =>
        controller.events.on(eventName, (...args: any[]) => {
          (listener as any)?.(...args);
          onVersionChange();
        }),
      () => undefined,
    );
  };

  return {
    formConfigs,
    hookConfigs,
    controller,
    path: controller.path,
    watchValues: useWatchValues,
    watchIssues: useWatchIssues,
    watchEvent: useWatchEvent,
  };
}

export type UseForm<TOutput extends object> = ReturnType<
  typeof useForm<TOutput>
>;
