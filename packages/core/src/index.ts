import { NativeFormObject } from "./types/NativeForm";
import { deepClone, deepEquals } from "./utils/deep.util";
import {
  ExtractPaths,
  getByPath,
  setByPath,
  ValueByPath,
} from "./utils/path.utils";

export type * from "./types/NativeForm";

class FieldState<TShape extends object, TPath extends ExtractPaths<TShape>> {
  protected target?: HTMLElement;

  protected isTouched = false;
  protected isDirty = false;

  protected error?: string;

  constructor(
    protected control: FormController<TShape>,
    protected path: TPath,
  ) {}

  get value() {
    return getByPath(this.control._data, this.path);
  }

  bindElement(el: HTMLElement) {
    this.target = el;
  }

  setValue(
    value: ValueByPath<TShape, TPath>,
    opts?: { shouldTouch?: boolean },
  ) {
    if (opts?.shouldTouch == null || opts?.shouldTouch) this.touch();

    const initialValue = getByPath(this.control._initialData, this.path);

    this.isDirty = !deepEquals(initialValue as any, value as any);

    setByPath(this.control._data, this.path, value);
  }

  touch() {
    this.isTouched = true;
  }

  focus(opts?: { shouldTouch?: boolean }) {
    if (opts?.shouldTouch == null || opts.shouldTouch) {
      this.target?.addEventListener("focus", () => this.touch(), {
        once: true,
      });
    }

    this.target?.focus();
  }
}

export class FormController<TShape extends object = NativeFormObject> {
  _fields = new Map<ExtractPaths<TShape>, FieldState<TShape, any>>();
  _initialData: TShape;
  _data: TShape;

  constructor(initialData: TShape) {
    this._initialData = initialData;
    this._data = deepClone(initialData as any satisfies NativeFormObject);
  }

  registerField<TPath extends ExtractPaths<TShape>>(
    fieldPath: TPath,
    defaultValue?: ValueByPath<TShape, TPath>,
  ) {
    const fieldState = new FieldState(this, fieldPath);
    this._fields.set(fieldPath, fieldState);

    if (defaultValue != null) {
      setByPath(this._initialData, fieldPath, defaultValue);
      setByPath(this._data, fieldPath, defaultValue);
    }
  }

  unregisterField(fieldPath: ExtractPaths<TShape>) {
    this._fields.delete(fieldPath);
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
