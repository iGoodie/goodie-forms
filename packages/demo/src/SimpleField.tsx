/* eslint-disable react-hooks/refs */

import type { FieldPath } from "@goodie-forms/core";
import {
  FieldRenderer,
  useFormField,
  type FieldRendererProps,
} from "@goodie-forms/react";
import { useId, useRef } from "react";

type Props<
  TOutput extends object,
  TPath extends FieldPath.Segments,
> = FieldRendererProps<TOutput, TPath> & {
  label: string;
};

export function SimpleField<
  TOutput extends object,
  const TPath extends FieldPath.Segments,
>(props: Props<TOutput, TPath>) {
  const id = useId();

  const field = useFormField(props.form, props.path);
  const fieldError = field?.issues.at(0);

  const renderCount = useRef(0);
  renderCount.current++;

  return (
    <div className="flex flex-col gap-2 items-start">
      <label
        htmlFor={id}
        className={
          field == null
            ? ""
            : !field.isValid
              ? "text-red-400"
              : field.isDirty
                ? "text-orange-300"
                : field.isTouched
                  ? "text-blue-200"
                  : ""
        }
      >
        {props.label}{" "}
        <span className="opacity-50">(Render #{renderCount.current})</span>
      </label>

      <FieldRenderer
        form={props.form}
        path={props.path}
        defaultValue={props.defaultValue!}
        overrideInitialValue={props.overrideInitialValue}
        unbindOnUnmount={props.unbindOnUnmount}
        // {...props} // TODO <-- Why won't this work?
        render={(renderParams) => {
          return (
            <div className="flex w-full *:w-full">
              {props.render(renderParams)}
            </div>
          );
        }}
      />

      {fieldError && (
        <span className="text-red-400 text-xs text-left">
          {fieldError.message}
        </span>
      )}
    </div>
  );
}
