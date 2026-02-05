import { FieldPath, FormField, NonnullFormField } from "@goodie-forms/core";
import { ChangeEvent, ReactNode, Ref, useEffect, useRef } from "react";
import { UseForm } from "../hooks/useForm";
import { useFormField } from "../hooks/useFormField";
import { composeFns } from "../utils/composeFns";

export interface RenderParams<TOutput extends object, TValue> {
  ref: Ref<any | null>;

  value: TValue | undefined;

  handlers: {
    onChange: (event: ChangeEvent<EventTarget> | TValue) => void;
    onFocus: () => void;
    onBlur: () => void;
  };

  field: undefined extends TValue
    ? FormField<TOutput, TValue>
    : NonnullFormField<TOutput, TValue>;

  form: UseForm<TOutput>;
}

type DefaultValueProps<TValue> = undefined extends TValue
  ? { defaultValue?: TValue | (() => TValue) }
  : { defaultValue: TValue | (() => TValue) };

export type FieldRendererProps<
  TOutput extends object,
  TPath extends FieldPath.Segments,
> = {
  form: UseForm<TOutput>;
  path: TPath;
  overrideInitialValue?: boolean;
  unbindOnUnmount?: boolean;
  render: (
    params: RenderParams<TOutput, FieldPath.Resolve<TOutput, NoInfer<TPath>>>,
  ) => ReactNode;
} & DefaultValueProps<FieldPath.Resolve<TOutput, NoInfer<TPath>>>;

export function FieldRenderer<
  TOutput extends object,
  const TPath extends FieldPath.Segments,
>(props: FieldRendererProps<TOutput, TPath>) {
  type TValue = FieldPath.Resolve<TOutput, TPath>;

  const elementRef = useRef<HTMLElement>(null);

  const field = useFormField(props.form, props.path, {
    overrideInitialValue: props.overrideInitialValue ?? true,
    defaultValue:
      typeof props.defaultValue === "function"
        ? (props.defaultValue as any)()
        : props.defaultValue,
  })!;

  const handlers: RenderParams<TOutput, TValue>["handlers"] = {
    onChange(arg) {
      let newValue: TValue;

      if ("target" in arg) {
        const { target } = arg;
        if (target !== field.boundElement) return;
        if (!("value" in target)) return;
        if (typeof target.value !== "string") return;
        newValue = target.value as TValue;
      } else {
        newValue = arg;
      }

      field.setValue(newValue, {
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
      events.on("valueChanged", (_path) => {
        if (
          !FieldPath.equals(_path, props.path) &&
          !FieldPath.isDescendant(_path, props.path)
        ) {
          return;
        }

        if (props.form.hookConfigs?.validateMode === "onChange") {
          props.form.controller.validateField(props.path);
        }
      }),
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
        form: props.form,
      })}
    </>
  );
}

/* ---- TESTS ---------------- */

// function TestComp() {
//   const form = useForm<{ a?: { b: 99 } }>({});

//   const jsx = (
//     <>
//       <FieldRenderer
//         form={form}
//         path={form.paths.fromProxy((data) => data.a.b)}
//         defaultValue={() => 99 as const}
//         render={({ ref, value, handlers, field }) => {
//           //            ^?
//           return <></>;
//         }}
//       />

//       {/* defaultField olmayabilir, çünkü "a" nullable */}
//       <FieldRenderer
//         form={form}
//         path={form.paths.fromProxy((data) => data.a)}
//         render={({ ref, value, handlers, field }) => {
//           //            ^?
//           return <></>;
//         }}
//       />

//       <FieldRenderer
//         form={form}
//         path={form.paths.fromStringPath("a.b")}
//         defaultValue={() => 99 as const}
//         render={({ ref, value, handlers, field }) => {
//           //            ^?
//           return <></>;
//         }}
//       />
//     </>
//   );
// }
