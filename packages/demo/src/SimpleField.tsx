/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/refs */

import { FormField, type Field, type FormController } from "@goodie-forms/core";
import flow from "lodash.flow";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type ReactNode,
  type Ref,
} from "react";
import { useRenderControl } from "./hooks/useRenderControl";

interface RenderParams<
  TShape extends object,
  TPath extends Field.Paths<TShape>
> {
  ref: Ref<any | null>;

  value: Field.GetValue<TShape, TPath> | undefined;

  handlers: {
    onChange: (event: ChangeEvent<EventTarget>) => void;
    onFocus: (event: FocusEvent) => void;
    onBlur: (event: FocusEvent) => void;
  };

  field: FormField<TShape, TPath>;
}

interface Props<TShape extends object, TPath extends Field.Paths<TShape>> {
  form: FormController<TShape>;
  name: TPath;
  label: string;
  defaultValue?: Field.GetValue<TShape, TPath>;
  render: (params: RenderParams<TShape, TPath>) => ReactNode;
}

// TODO: impl validationMode and revalidationMode when extracted to a FormController wrapping hook
export function SimpleField<
  TShape extends object,
  TPath extends Field.Paths<TShape>
>(props: Props<TShape, TPath>) {
  const id = useId();

  const renderCount = useRef(0);
  renderCount.current++;

  const elementRef = useRef<HTMLElement>(null);

  const renderControl = useRenderControl();

  const [field, setField] = useState(() =>
    props.form.bindField(props.name, {
      defaultValue: props.defaultValue,
    })
  );

  const fieldError = field.issues.at(0);

  const handlers: RenderParams<TShape, TPath>["handlers"] = {
    onChange(event) {
      const { target } = event;
      if (!("value" in target)) return;
      if (typeof target.value !== "string") return;
      field.setValue(target.value as Field.GetValue<TShape, TPath>, {
        shouldTouch: true,
        shouldMarkDirty: true,
      });
    },
    onFocus() {
      field.touch();
    },
    onBlur(event) {
      console.log("Blur", props.name, event.target);
      props.form.validateField(props.name);
    },
  };

  useEffect(() => {
    const { events } = props.form;

    return flow(
      events.on("valueChanged", (path) => {
        if (path === props.name) renderControl.forceRerender();
      }),
      events.on("fieldStateUpdated", (path) => {
        if (path === props.name) renderControl.forceRerender();
      }),
      events.on("validationTriggered", (path) => {
        if (path === props.name) renderControl.forceRerender();
      })
    );
  }, []);

  useEffect(() => {
    if (props.form.getField(props.name) != null) {
      field.bindElement(elementRef.current!);
    } else {
      const fieldState = props.form.bindField(props.name, {
        defaultValue: props.defaultValue,
        domElement: elementRef.current!,
      });

      setField(fieldState);
    }

    return () => {
      console.log("Unbinding", props.name);
      props.form.unbindField(props.name);
    };
  }, []);

  return (
    <div className="flex flex-col gap-2 items-start">
      <label htmlFor={id}>
        {props.label}{" "}
        <span className="opacity-50">(Render #{renderCount.current})</span>
      </label>

      <div className="flex w-full *:w-full">
        {props.render({
          ref: elementRef,
          value: field.value,
          handlers: handlers,
          field: field,
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
