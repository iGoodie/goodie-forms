import { StandardSchemaV1 } from "@standard-schema/spec";
import { DeepPartial } from "../types/DeepPartial";
import { Field } from "../form/Field";

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
              path: i.path.split("."),
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
