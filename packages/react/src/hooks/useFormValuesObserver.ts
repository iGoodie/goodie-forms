import { Field } from "@goodie-forms/core";
import { useEffect } from "react";
import { composeFns } from "../utils/composeFns";
import type { UseForm } from "./useForm";
import { useRenderControl } from "./useRenderControl";

export function useFormValuesObserver<
  TShape extends object,
  TPaths extends Field.Paths<TShape>[] | undefined = undefined
>(
  form: UseForm<TShape>,
  options?: {
    include?: TPaths;
  }
) {
  const renderControl = useRenderControl();

  const observedValues =
    options?.include == null
      ? form.controller._data
      : options.include.reduce((data, path) => {
          const value = Field.getValue(form.controller._data as TShape, path)!;
          Field.setValue(data, path, value);
          return data;
        }, {} as TShape);

  useEffect(() => {
    const { events } = form.controller;

    return composeFns(
      events.on("valueChanged", (changedPath) => {
        const watchingChange =
          options?.include == null
            ? true
            : options.include.some(
                (path) =>
                  path === changedPath || Field.isDescendant(path, changedPath)
              );
        if (watchingChange) renderControl.forceRerender();
      })
    );
  }, []);

  return observedValues;
}
