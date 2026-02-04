import { StandardSchemaV1 } from "@standard-schema/spec";
import { DeepPartial } from "../types/DeepPartial";
import { FieldPath } from "../field/FieldPath";

export type CustomValidationIssue<TOutput extends object> = {
  path: FieldPath.StringPaths<TOutput>;
  message: string;
};

export type CustomValidationStrategy<TOutput extends object> = (
  data: DeepPartial<TOutput>,
) =>
  | void
  | CustomValidationIssue<TOutput>[]
  | Promise<CustomValidationIssue<TOutput>[] | void>;

export function customValidation<TOutput extends object>(
  strategy: CustomValidationStrategy<TOutput>,
) {
  return {
    "~standard": {
      version: 1 as const,

      vendor: "goodie-forms/custom" as const,

      validate: async (input: unknown) => {
        try {
          const customIssues = await strategy(input as DeepPartial<TOutput>);

          if (customIssues == null) {
            return { value: input as TOutput };
          }

          return {
            issues: customIssues.map((i) => ({
              path: FieldPath.fromStringPath(i.path as string),
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
  } as StandardSchemaV1<TOutput, TOutput>;
}
