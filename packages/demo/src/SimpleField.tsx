import type { Field, FormController } from "@goodie-forms/core";
import { useEffect, useId, useState, type ReactNode } from "react";

interface Props<TShape extends object> {
  form: FormController<TShape>;
  name: Field.Paths<TShape>;
  label: string;
  render: () => ReactNode;
}

export function SimpleField<TShape extends object>(props: Props<TShape>) {
  const id = useId();

  const [, rerender] = useState(0);

  const fieldError = props.form.getFieldState(props.name)?.issues.at(0);

  useEffect(() => {
    const fieldState = props.form.bindField(props.name);

    return fieldState.events.on("valueChanged", () => {
      rerender((i) => i + 1);
    });
  }, []);

  return (
    <div className="flex flex-col gap-2 items-start">
      <label htmlFor={id}>{props.label}</label>
      {props.render()}
      {fieldError && (
        <span className="text-red-400 text-xs">{fieldError.message}</span>
      )}
    </div>
  );
}
