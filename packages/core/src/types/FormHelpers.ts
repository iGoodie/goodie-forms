import { FormField } from "packages/core/src/form/FormField";

// TODO: Consider
export type FieldValue<T extends FormField<any, any>> =
  NonNullable<T> extends { value: infer V } ? NonNullable<V> : never;

// TODO: Move to a proper test file
// declare const x: FormField<{ a: 1; b: 2 }, number>;

// type X0 = FieldValue<typeof x>;
// //   ^?
// type X1 = (typeof x)["value"];
// //   ^?
