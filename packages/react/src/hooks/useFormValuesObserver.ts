import { Field } from "@goodie-forms/core";
import { useEffect } from "react";
import { composeFns } from "../utils/composeFns";
import type { UseForm } from "./useForm";
import { useRenderControl } from "./useRenderControl";

export function useFormValuesObserver<TShape extends object>(
  form: UseForm<TShape>,
  options?: {
    include?: Field.Paths<TShape>[];
  },
) {
  const renderControl = useRenderControl();

  useEffect(() => {
    const { events } = form.controller;

    return composeFns(
      events.on("valueChanged", (path) => {
        if (
          !options?.include?.some((include) =>
            Field.isDescendant(path, include),
          )
        )
          return;
        renderControl.forceRerender();
      }),
    );
  }, []);

  return options?.include == null
    ? form.controller._data
    : options.include.reduce((data, path) => {
        const value = Field.getValue(form.controller._data as TShape, path)!;
        Field.setValue(data, path, value);
        return data;
      }, {} as TShape);
}
