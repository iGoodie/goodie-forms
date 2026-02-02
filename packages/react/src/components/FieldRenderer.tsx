import { Field, FormField, NonnullFormField } from "@goodie-forms/core";
import {
  ChangeEvent,
  FocusEvent,
  ReactNode,
  Ref,
  useEffect,
  useRef,
} from "react";
import { UseForm } from "../hooks/useForm";
import { useFormField } from "../hooks/useFormField";
import { composeFns } from "../utils/composeFns";

export interface RenderParams<
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

  field: undefined extends Field.GetValue<TShape, TPath>
    ? FormField<TShape, TPath>
    : NonnullFormField<TShape, TPath>;
}

type DefaultValueProps<TValue> = undefined extends TValue
  ? { defaultValue?: TValue | (() => TValue) }
  : { defaultValue: TValue | (() => TValue) };

export type FieldRendererProps<
  TShape extends object,
  TPath extends Field.Paths<TShape>
> = {
  form: UseForm<TShape>;
  path: TPath;
  overrideInitialValue?: boolean;
  unbindOnUnmount?: boolean;
  render: (params: RenderParams<TShape, TPath>) => ReactNode;
} & DefaultValueProps<Field.GetValue<TShape, TPath>>;

export function FieldRenderer<
  TShape extends object,
  TPath extends Field.Paths<TShape>
>(props: FieldRendererProps<TShape, TPath>) {
  const elementRef = useRef<HTMLElement>(null);

  const field = useFormField(props.form, props.path, {
    overrideInitialValue: props.overrideInitialValue ?? true,
    defaultValue:
      typeof props.defaultValue === "function"
        ? (props.defaultValue as any)()
        : props.defaultValue,
  })!;

  const handlers: RenderParams<TShape, TPath>["handlers"] = {
    onChange(event) {
      const { target } = event;
      if (target !== field.boundElement) return;
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
    onBlur() {
      if (
        props.form.hookConfigs?.validateMode === "onBlur" ||
        props.form.hookConfigs?.validateMode === "onChange"
      ) {
        props.form.controller.validateField(props.path);
      }
    },
  };

  useEffect(() => {
    const { events } = props.form.controller;

    return composeFns(
      events.on("valueChanged", (path) => {
        if (path !== props.path && !Field.isDescendant(path, props.path))
          return;
        if (props.form.hookConfigs?.validateMode === "onChange") {
          props.form.controller.validateField(props.path);
        }
      })
    );
  }, []);

  useEffect(() => {
    field.bindElement(elementRef.current!);

    return () => {
      if (props.unbindOnUnmount) {
        props.form.controller.unbindField(props.path);
      }
    };
  }, []);

  return (
    <>
      {props.render({
        ref: elementRef,
        value: field.value,
        handlers: handlers,
        field: field as any,
      })}
    </>
  );
}
