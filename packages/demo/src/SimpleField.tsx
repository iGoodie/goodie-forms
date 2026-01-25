/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/refs */

import {
  FieldState,
  type Field,
  type FormController,
} from "@goodie-forms/core";
import flow from "lodash.flow";
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

  const elementRef = useRef<HTMLElement>(null);

  const [, rerender] = useState(0);

  const [fieldState, setFieldState] = useState(() =>
    props.form.bindField(props.name, {
      defaultValue: props.defaultValue,
    }),
  );

  const fieldError = props.form.getFieldState(props.name)?.issues.at(0);

  const _field: RenderParams<TShape, TPath>["field"] = {
    ref: elementRef,
    value: fieldState?.value,
  };

  useEffect(() => {
    const { events } = props.form;

    return flow(
      events.on("valueChanged", () => rerender((i) => i + 1)),
      events.on("fieldUpdated", () => rerender((i) => i + 1)),
      events.on("validationTriggered", (path) => {
        console.log(path, props.name);
        if (path === props.name) rerender((i) => i + 1);
      }),
    );
  }, []);

  useEffect(() => {
    if (props.form.getFieldState(props.name) != null) {
      fieldState.bindElement(elementRef.current!);
    } else {
      const fieldState = props.form.bindField(props.name, {
        defaultValue: props.defaultValue,
        domElement: elementRef.current!,
      });

      setFieldState(fieldState);
    }

    return () => {
      console.log("Unbinding", props.name);
      props.form.unbindField(props.name);
    };
  }, []);

  return (
    <div className="flex flex-col gap-2 items-start">
      <label htmlFor={id}>{props.label}</label>

      <div className="flex w-full *:w-full">
        {props.render({
          field: _field,
          fieldState,
        })}
      </div>

      {fieldError && (
        <span className="text-red-400 text-xs text-left">
          {fieldError.message}
        </span>
      )}
    </div>
  );
}
