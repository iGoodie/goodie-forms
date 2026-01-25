/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/refs */

import type { Field, FieldState, FormController } from "@goodie-forms/core";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";

interface RenderParams<
  TShape extends object,
  TPath extends Field.Paths<TShape>,
> {
  field: {
    ref: Ref<any | null>;
    value: Field.GetValue<TShape, TPath> | undefined;
    defaultValue?: Field.GetValue<TShape, TPath>;
  };

  fieldState: FieldState<TShape, TPath>;
}

interface Props<TShape extends object, TPath extends Field.Paths<TShape>> {
  form: FormController<TShape>;
  name: TPath;
  label: string;
  defaultValue?: Field.GetValue<TShape, TPath>;
  render: (params: RenderParams<TShape, TPath>) => ReactNode;
}

export function SimpleField<
  TShape extends object,
  TPath extends Field.Paths<TShape>,
>(props: Props<TShape, TPath>) {
  const id = useId();

  const ref = useRef<HTMLElement>(null);

  const [, rerender] = useState(0);

  const [fieldState] = useState(() => {
    return props.form.bindField(props.name, {
      defaultValue: props.defaultValue,
    });
  });

  const fieldError = props.form.getFieldState(props.name)?.issues.at(0);

  const _field: RenderParams<TShape, TPath>["field"] = {
    ref,

    // ref: (domElement: HTMLElement | null) => {
    //   if (domElement == null) return;
    //   if (ref.current != null) return;

    //   props.form.bindField(props.name, {
    //     defaultValue: props.defaultValue,
    //     domElement,
    //   });

    //   ref.current = domElement;
    // },

    value: props.form.getFieldState(props.name)?.value,

    defaultValue: props.defaultValue,
  };

  useEffect(() => {
    const fieldState = props.form.bindField(props.name);

    return fieldState.events.on("valueChanged", () => {
      rerender((i) => i + 1);
    });
  }, []);

  useEffect(() => {
    fieldState.bindElement(ref.current!);

    return () => {
      console.log("Unbinding");
      props.form.unbindField(props.name);
      ref.current = null;
    };
  }, []);

  return (
    <div className="flex flex-col gap-2 items-start">
      <label htmlFor={id}>{props.label}</label>

      {props.render({
        field: _field,
        fieldState,
      })}

      {fieldError && (
        <span className="text-red-400 text-xs">{fieldError.message}</span>
      )}
    </div>
  );
}
