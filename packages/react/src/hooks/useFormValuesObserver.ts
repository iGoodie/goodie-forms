import { FieldPath } from "@goodie-forms/core";
import { useEffect } from "react";
import { composeFns } from "../utils/composeFns";
import type { UseForm } from "./useForm";
import { useRenderControl } from "./useRenderControl";

/** @deprecated */
export function useFormValuesObserver<
  TOutput extends object,
  TPaths extends FieldPath.Segments[] | undefined = undefined,
>(
  form: UseForm<TOutput>,
  options?: {
    include?: TPaths;
  },
) {
  const renderControl = useRenderControl();

  const observedValues =
    options?.include == null
      ? form.controller._data
      : options.include.reduce((data, path) => {
          const value = FieldPath.getValue(
            form.controller._data as TOutput,
            path,
          )!;
          FieldPath.setValue(data, path, value);
          return data;
        }, {} as TOutput);

  useEffect(() => {
    const { events } = form.controller;

    return composeFns(
      events.on("valueChanged", (changedPath) => {
        const watchingChange =
          options?.include == null
            ? true
            : options.include.some(
                (path) =>
                  FieldPath.equals(path, changedPath) ||
                  FieldPath.isDescendant(path, changedPath),
              );
        if (watchingChange) renderControl.forceRerender();
      }),
    );
  }, []);

  return observedValues;
}
