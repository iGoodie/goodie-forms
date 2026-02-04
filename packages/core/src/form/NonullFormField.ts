import { Field } from "../form/Field";
import { FormField } from "./+FormField";
import { Mixin } from "../types/Mixin";

export type NonnullFormField<
  TShape extends object,
  TPath extends Field.Paths<TShape>,
> = Mixin<
  FormField<TShape, TPath>,
  {
    modifyValue: (
      modifier: (
        currentValue: Field.GetValue<TShape, TPath>,
      ) => Field.GetValue<TShape, TPath> | void,
      opts?: {
        shouldTouch?: boolean;
        shouldMarkDirty?: boolean;
      },
    ) => void;
  }
>;
