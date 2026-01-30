import { FormController, type Form } from "@goodie-forms/core";
import flow from "lodash.flow";
import { useEffect, useState } from "react";

export function useForm<TShape extends object>(
  formConfigs: Form.FormConfigs<TShape>,
  hookConfigs?: {
    validateMode?: "onChange" | "onBlur" | "onSubmit";
    revalidateMode?: "onChange" | "onBlur" | "onSubmit";
  }
) {
  const [controller] = useState(() => new FormController(formConfigs));

  const [, setIsSubmitting] = useState(() => controller.isSubmitting);

  useEffect(() => {
    return flow(
      controller.events.on("statusChanged", (state) => {
        // Only re-render when submission state changes
        setIsSubmitting(state === "submitting");
      })
    );
  }, [controller]);

  return {
    formConfigs,
    hookConfigs,
    controller,
  };
}

export type UseForm<TShape extends object> = ReturnType<typeof useForm<TShape>>;
