import { FieldPath } from "@goodie-forms/core";
import { useCallback, useSyncExternalStore } from "react";
import { UseForm } from "../hooks/useForm";
import { composeFns } from "../utils/composeFns";

export function useFieldValue<
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
        events.on("fieldValueChanged", (changedPath) => {
          if (
            FieldPath.equals(changedPath, path) ||
            FieldPath.isDescendant(changedPath, path)
          ) {
            onStoreChange();
          }
        }),
      );
    },
    [controller, path],
  );

  const getSnapshot = useCallback(() => {
    return controller.getField(path)?.value;
  }, [controller, path]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
