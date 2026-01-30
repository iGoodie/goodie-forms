import { FormController, type Form } from "@goodie-forms/core";
import { useState } from "react";

export function useForm<TShape extends object>(
  formConfigs: Form.FormConfigs<TShape>,
  hookConfigs?: {
    validateMode?: "onChange" | "onBlur" | "onSubmit";
    revalidateMode?: "onChange" | "onBlur" | "onSubmit";
  }
) {
  const [controller] = useState(() => new FormController(formConfigs));

  return {
    formConfigs,
    hookConfigs,
    controller,
  };
}

export type UseForm<TShape extends object> = ReturnType<typeof useForm<TShape>>;
