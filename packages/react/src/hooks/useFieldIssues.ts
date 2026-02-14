import { FieldPath } from "@goodie-forms/core";
import { useCallback, useSyncExternalStore } from "react";
import { composeFns } from "../utils/composeFns";
import { UseForm } from "./useForm";

export function useFieldIssues<
  TOutput extends object,
  TPath extends FieldPath.Segments,
>(form: UseForm<TOutput>, path: TPath) {
  const { controller } = form;

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const { events } = controller;

      return composeFns(
        events.on("fieldRegistered", (fieldPath) => {
          if (FieldPath.equals(path, fieldPath)) {
            onStoreChange();
          }
        }),
        events.on("fieldUnregistered", (fieldPath) => {
          if (FieldPath.equals(path, fieldPath)) {
            onStoreChange();
          }
        }),
        events.on("fieldIssuesUpdated", (fieldPath) => {
          if (FieldPath.equals(path, fieldPath)) {
            onStoreChange();
          }
        }),
      );
    },
    [controller, path],
  );

  const getSnapshot = useCallback(() => {
    return controller.getField(path)?.issues;
  }, [controller, path]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
