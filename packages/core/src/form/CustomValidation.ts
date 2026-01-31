import { StandardSchemaV1 } from "@standard-schema/spec";
import { Field } from "../form/Field";
import { DeepPartial } from "../types/DeepPartial";

export type CustomValidationIssue<TShape extends object> = {
  path: Field.Paths<TShape>;
  message: string;
};

export type CustomValidationStrategy<TShape extends object> = (
  data: DeepPartial<TShape>,
) =>
  | void
  | CustomValidationIssue<TShape>[]
  | Promise<CustomValidationIssue<TShape>[] | void>;

export function customValidation<TShape extends object>(
  strategy: CustomValidationStrategy<TShape>,
): StandardSchemaV1<TShape, TShape> {
  return {
    "~standard": {
      version: 1 as const,

      vendor: "goodie-forms/custom" as const,

      validate: async (input: unknown) => {
        try {
          const customIssues = await strategy(input as DeepPartial<TShape>);

          if (customIssues == null) {
            return { value: input as TShape };
          }

          return {
            issues: customIssues.map((i) => ({
              path: Field.parsePathFragments(i.path),
              message: i.message,
            })),
          };
        } catch (err) {
          return {
            issues: [
              {
                message: err instanceof Error ? err.message : "Unknown error",
              },
            ],
          };
        }
      },
    },
  };
}
