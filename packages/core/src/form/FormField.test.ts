import { Equal, Expect } from "type-testing";
import { test } from "vitest";
import { FieldPath } from "../field/FieldPath";
import { FormField } from "./FormField";

test("provides generic type extraction utilities", () => {
  type TOutput = { a: 1; b: 2; c: 3 };

  const fieldA: FormField<TOutput, FieldPath.Resolve<TOutput, ["a"]>> = null!;
  const fieldB: FormField<TOutput, FieldPath.Resolve<TOutput, ["b"]>> = null!;
  const fieldC: FormField<TOutput, FieldPath.Resolve<TOutput, ["c"]>> = null!;

  type typeTests = [
    Expect<Equal<FormField.Output<typeof fieldA>, TOutput>>,
    Expect<Equal<FormField.Output<typeof fieldB>, TOutput>>,
    Expect<Equal<FormField.Output<typeof fieldC>, TOutput>>,
    Expect<Equal<FormField.Value<typeof fieldA>, 1>>,
    Expect<Equal<FormField.Value<typeof fieldB>, 2>>,
    Expect<Equal<FormField.Value<typeof fieldC>, 3>>,
  ];
});
