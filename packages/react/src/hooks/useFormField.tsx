import { FieldPath, FormField } from "@goodie-forms/core";
import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { UseForm } from "../hooks/useForm";
import { composeFns } from "../utils/composeFns";

export function useFormField<
  TOutput extends object,
  TPath extends FieldPath.Segments,
>(
  form: UseForm<TOutput>,
  path: TPath,
): FormField<TOutput, FieldPath.Resolve<TOutput, TPath>> | undefined;

export function useFormField<
  TOutput extends object,
  TPath extends FieldPath.Segments,
>(
  form: UseForm<TOutput>,
  path: TPath,
  bindingConfig: Parameters<typeof form.controller.registerField<TPath>>[1],
): FormField<TOutput, FieldPath.Resolve<TOutput, TPath>>;

export function useFormField<
  TOutput extends object,
  TPath extends FieldPath.Segments,
>(
  form: UseForm<TOutput>,
  path: TPath,
  bindingConfig?: Parameters<typeof form.controller.registerField<TPath>>[1],
) {
  const { controller } = form;

  const version = useRef(0);

  useState(() => {
    let existing = controller.getField(path);

    if (!existing && bindingConfig) {
      controller.registerField(path, bindingConfig);
    }

    return null;
  });

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const { events } = controller;

      return composeFns(
        events.on("fieldRegistered", (_path) => {
          if (FieldPath.equals(_path, path)) {
            version.current++;
            onStoreChange();
          }
        }),
        events.on("fieldUnregistered", (_path) => {
          if (FieldPath.equals(_path, path)) {
            version.current++;
            onStoreChange();
          }
        }),
        events.on("fieldValueChanged", (changedPath) => {
          if (
            FieldPath.equals(changedPath, path) ||
            FieldPath.isDescendant(changedPath, path)
          ) {
            version.current++;
            onStoreChange();
          }
        }),
        events.on("fieldTouchUpdated", (_path) => {
          if (FieldPath.equals(_path, path)) {
            version.current++;
            onStoreChange();
          }
        }),
        events.on("fieldDirtyUpdated", (_path) => {
          if (FieldPath.equals(_path, path)) {
            version.current++;
            onStoreChange();
          }
        }),
        events.on("fieldIssuesUpdated", (_path) => {
          if (FieldPath.equals(_path, path)) {
            version.current++;
            onStoreChange();
          }
        }),
      );
    },
    [controller, path],
  );

  const getSnapshot = useCallback(() => version.current, [controller, path]);

  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return controller.getField(path);
}
