/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/refs */

import { type Field } from "@goodie-forms/core";
import {
  FieldRenderer,
  useFormField,
  type FieldRendererProps,
} from "@goodie-forms/react";
import { useId, useRef } from "react";

type Props<
  TShape extends object,
  TPath extends Field.Paths<TShape>,
> = FieldRendererProps<TShape, TPath> & {
  label: string;
};

export function SimpleField<
  TShape extends object,
  TPath extends Field.Paths<TShape>,
>(props: Props<TShape, TPath>) {
  const id = useId();

  const field = useFormField(props.form, props.path);
  const fieldError = field?.issues.at(0);

  const renderCount = useRef(0);
  renderCount.current++;

  return (
    <FieldRenderer
      {...props}
      render={(renderParams) => {
        return (
          <div className="flex flex-col gap-2 items-start">
            <label htmlFor={id}>
              {props.label}{" "}
              <span className="opacity-50">
                (Render #{renderCount.current})
              </span>
            </label>

            <div className="flex w-full *:w-full">
              {props.render(renderParams)}
            </div>

            {fieldError && (
              <span className="text-red-400 text-xs text-left">
                {fieldError.message}
              </span>
            )}
          </div>
        );
      }}
    />
  );
}
