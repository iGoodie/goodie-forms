import { FormField } from "./FormField";
import { Mixin } from "../types/Mixin";

export type NonnullFormField<TOutput extends object, TValue> = Mixin<
  FormField<TOutput, TValue>,
  {
    modifyValue: (
      modifier: (currentValue: TValue) => TValue | void,
      opts?: {
        shouldTouch?: boolean;
        shouldMarkDirty?: boolean;
      },
    ) => void;
  }
>;
