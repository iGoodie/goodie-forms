import type { Field } from "@goodie-forms/core";
import type { UseForm } from "../hooks/useForm";

export function useFormErrors<TShape extends object>(
  form: UseForm<TShape>,
  options?: {
    include?: Field.Paths<TShape>[];
  }
) {
  // TODO: Impl; ability to watch form errors, optionally by field path
  console.log(form);
  console.log(options);
}
