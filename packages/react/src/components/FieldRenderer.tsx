import {
  DeepReadonly,
  FieldPath,
  FormField,
  Suppliable,
} from "@goodie-forms/core";
import { ChangeEvent, ReactNode, Ref, useEffect, useRef } from "react";
import { UseForm } from "../hooks/useForm";
import { useFormField } from "../hooks/useFormField";
import { composeFns } from "../utils/composeFns";

export interface RenderParams<TOutput extends object, TValue> {
  fieldProps: {
    ref: Ref<any | null>;

    name: string;

    value: DeepReadonly<TValue> | undefined;

    onChange: (event: ChangeEvent<EventTarget> | TValue) => void;
    onFocus: () => void;
    onBlur: () => void;
  };

  field: FormField<TOutput, TValue>;

  form: UseForm<TOutput>;
}

type DefaultValueProps<TValue> = undefined extends TValue
  ? { defaultValue?: Suppliable<TValue> }
  : { defaultValue: Suppliable<TValue> };

export type FieldRendererProps<
  TOutput extends object,
  TPath extends FieldPath.Segments,
> = DefaultValueProps<FieldPath.Resolve<TOutput, TPath>> & {
  form: UseForm<TOutput>;
  path: TPath;
  overrideInitialValue?: boolean;
  unbindOnUnmount?: boolean;
  render: (
    params: RenderParams<TOutput, FieldPath.Resolve<TOutput, TPath>>,
  ) => ReactNode;
};

export function FieldRenderer<
  TOutput extends object,
  const TPath extends FieldPath.Segments,
>(props: FieldRendererProps<TOutput, TPath>) {
  type TValue = FieldPath.Resolve<TOutput, TPath>;

  const elementRef = useRef<HTMLElement>(null);

  const field = useFormField(props.form, props.path, {
    overrideInitialValue: props.overrideInitialValue ?? true,
    defaultValue: props.defaultValue,
  })!;

  const currentValidateMode = props.form.controller.triedSubmitting
    ? (props.form.hookConfigs?.revalidateMode ??
      props.form.hookConfigs?.validateMode)
    : props.form.hookConfigs?.validateMode;

  const renderedJsx = props.render({
    fieldProps: {
      ref: elementRef,
      name: field.stringPath,
      value: field.value,
      onChange(arg) {
        let newValue: TValue;

        if (typeof arg === "object" && "target" in arg) {
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
          field.issues.length !== 0 ||
          currentValidateMode === "onBlur" ||
          currentValidateMode === "onChange"
        ) {
          props.form.controller.validateField(props.path);
        }
      },
    },
    field: field as any,
    form: props.form,
  });

  useEffect(() => {
    const { events } = props.form.controller;

    return composeFns(
      events.on("fieldValueChanged", (_path) => {
        if (
          !FieldPath.equals(_path, props.path) &&
          !FieldPath.isDescendant(_path, props.path)
        ) {
          return;
        }

        if (field.issues.length !== 0 || currentValidateMode === "onChange") {
          props.form.controller.validateField(props.path);
        }
      }),
    );
  }, [currentValidateMode]);

  useEffect(() => {
    field.bindElement(elementRef.current!);

    return () => {
      if (props.unbindOnUnmount) {
        props.form.controller.unregisterField(props.path);
      }
    };
  }, []);

  return <>{renderedJsx}</>;
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
//         render={({ fieldProps, field }) => {
//           //            ^?
//           return <input {...fieldProps} />;
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
