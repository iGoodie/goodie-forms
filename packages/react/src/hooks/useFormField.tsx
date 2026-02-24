import { FieldPath, FormField } from "@goodie-forms/core";
import { useCallback, useState } from "react";
import { UseForm } from "../hooks/useForm";
import { useSyncMutableStore } from "../hooks/useSyncMutableStore";
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
  registerConfig: Parameters<typeof form.controller.registerField<TPath>>[1],
): FormField<TOutput, FieldPath.Resolve<TOutput, TPath>>;

export function useFormField<
  TOutput extends object,
  TPath extends FieldPath.Segments,
>(
  form: UseForm<TOutput>,
  path: TPath,
  registerConfig?: Parameters<typeof form.controller.registerField<TPath>>[1],
) {
  const { controller } = form;

  useState(() => {
    let existing = controller.getField(path);

    if (!existing && registerConfig) {
      controller.registerField(path, registerConfig);
    }

    return null;
  });

  const subscribe = useCallback(
    (onVersionChange: () => void) => {
      const { events } = controller;

      return composeFns(
        events.on("fieldRegistered", (_path) => {
          if (FieldPath.equals(_path, path)) {
            onVersionChange();
          }
        }),
        events.on("fieldUnregistered", (_path) => {
          if (FieldPath.equals(_path, path)) {
            onVersionChange();
          }
        }),
        events.on("fieldValueChanged", (changedPath) => {
          if (
            FieldPath.equals(changedPath, path) ||
            FieldPath.isDescendant(changedPath, path)
          ) {
            onVersionChange();
          }
        }),
        events.on("fieldTouchUpdated", (_path) => {
          if (FieldPath.equals(_path, path)) {
            onVersionChange();
          }
        }),
        events.on("fieldDirtyUpdated", (_path) => {
          if (FieldPath.equals(_path, path)) {
            onVersionChange();
          }
        }),
        events.on("fieldIssuesUpdated", (_path) => {
          if (FieldPath.equals(_path, path)) {
            onVersionChange();
          }
        }),
      );
    },
    [controller, path],
  );

  return useSyncMutableStore(subscribe, () => controller.getField(path));
}
