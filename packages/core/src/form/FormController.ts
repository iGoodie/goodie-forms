import { FieldState } from "../form/FieldState";
import { NativeFormObject } from "../types/NativeForm";
import { deepClone } from "../utils/deep.util";
import { ExtractPaths, setByPath, ValueByPath } from "../utils/path.utils";

export class FormController<TShape extends object = NativeFormObject> {
  _fields = new Map<ExtractPaths<TShape>, FieldState<TShape, any>>();
  _data: TShape;

  constructor(
    public readonly config: {
      initialData: TShape;
      validator?: any; // TODO <-- StandardSchema
    },
  ) {
    this._data = deepClone(
      config.initialData as any satisfies NativeFormObject,
    );
  }

  registerField<TPath extends ExtractPaths<TShape>>(
    fieldPath: TPath,
    defaultValue?: ValueByPath<TShape, TPath>,
  ) {
    const fieldState = new FieldState(this, fieldPath);
    this._fields.set(fieldPath, fieldState);

    if (defaultValue != null) {
      setByPath(this.config.initialData, fieldPath, defaultValue);
      setByPath(this._data, fieldPath, defaultValue);
    }
  }

  unregisterField(fieldPath: ExtractPaths<TShape>) {
    this._fields.delete(fieldPath);
  }

  reset() {
    this._data = deepClone(this.config.initialData as any);

    for (const fieldState of this._fields.values()) {
      fieldState.reset();
    }
  }

  getFieldState<TPath extends ExtractPaths<TShape>>(fieldPath: TPath) {
    return this._fields.get(fieldPath) as FieldState<TShape, TPath>;
  }

  setValue<TPath extends ExtractPaths<TShape>>(
    path: TPath,
    ...args: [...Parameters<FieldState<TShape, TPath>["setValue"]>]
  ) {
    const fieldState = this.getFieldState(path);
    fieldState?.setValue(...args);
    return fieldState;
  }
}
