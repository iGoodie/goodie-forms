import { immerable, produce } from "immer";
import { createNanoEvents } from "nanoevents";
import { Field } from "../form/Field";
import { FormController } from "../form/FormController";

export class FieldState<
  TShape extends object,
  TPath extends Field.Paths<TShape>,
> {
  protected target?: HTMLElement;

  protected _isTouched = false;
  protected _isDirty = false;

  public readonly events = createNanoEvents<{
    elementBound(el: HTMLElement): void;
    elementUnbound(): void;
    touch(isTouched: boolean): void;
    dirty(isDirty: boolean): void;
    valueChanged(
      oldValue: Field.GetValue<TShape, TPath> | undefined,
      newValue: Field.GetValue<TShape, TPath> | undefined,
    ): void;
  }>();

  constructor(
    protected control: FormController<TShape>,
    protected path: TPath,
  ) {}

  get value() {
    return Field.getValue<TShape, TPath>(
      this.control._data as TShape,
      this.path,
    );
  }

  get boundElement() {
    return this.target;
  }

  get issues() {
    return this.control._issues.filter(
      (issue) => issue.path?.join(".") === this.path,
    );
  }

  get isTouched() {
    return this._isTouched;
  }

  get isDirty() {
    return this._isDirty;
  }

  get isValid() {
    return this.issues.length === 0;
  }

  protected _setTouched(isTouched: boolean) {
    const changed = this._isTouched !== isTouched;
    this._isTouched = isTouched;
    if (changed) this.events.emit("touch", isTouched);
  }

  protected _setDirty(isDirty: boolean) {
    const changed = this._isDirty !== isDirty;
    this._isDirty = isDirty;
    if (changed) this.events.emit("dirty", isDirty);
  }

  bindElement(el: HTMLElement) {
    if (el != null) this.events.emit("elementBound", el);
    else this.events.emit("elementUnbound");
    this.target = el;
  }

  protected static ensureImmerability(value: any) {
    if (typeof value !== "object" || value === null) return;

    // Skip plain objects
    const proto = Object.getPrototypeOf(value);
    if (proto === Object.prototype || proto === null) return;

    const ctor = proto.constructor;
    if (typeof ctor !== "function") return;

    // Skip known built-ins
    if (
      value instanceof Date ||
      value instanceof RegExp ||
      value instanceof Map ||
      value instanceof Set ||
      value instanceof WeakMap ||
      value instanceof WeakSet ||
      ArrayBuffer.isView(value)
    ) {
      return;
    }

    if (ctor[immerable] === true) return;

    // Define non-enumerable immerable flag
    ctor[immerable] = true;
  }

  modifyValue(
    modifier: (
      currentValue: Field.GetValue<TShape, TPath>,
      field: this,
    ) => Field.GetValue<TShape, TPath> | void,
    opts?: {
      shouldTouch?: boolean;
      shouldMarkDirty?: boolean;
    },
  ) {
    if (opts?.shouldTouch == null || opts?.shouldTouch) {
      this.touch();
    }

    const initialValue = Field.getValue<TShape, TPath>(
      this.control._initialData as TShape,
      this.path,
    );

    FieldState.ensureImmerability(initialValue);

    this.control._data = produce(this.control._data, (draft) => {
      Field.modifyValue<TShape, TPath>(draft as TShape, this.path, (oldValue) =>
        modifier(oldValue, this),
      );
    });

    const currentValue = Field.getValue<TShape, TPath>(
      this.control._data as TShape,
      this.path,
    );

    FieldState.ensureImmerability(currentValue);

    const valueChanged = initialValue !== currentValue;

    if (valueChanged) {
      this.events.emit("valueChanged", initialValue, currentValue);
    }

    if (opts?.shouldMarkDirty == null || opts?.shouldMarkDirty) {
      this._setDirty(valueChanged);
    }
  }

  setValue(
    value: Field.GetValue<TShape, TPath>,
    opts?: { shouldTouch?: boolean },
  ) {
    return this.modifyValue(() => value, opts);
  }

  reset() {
    this._isTouched = false;
    this._isDirty = false;
  }

  touch() {
    this._setTouched(true);
  }

  markDirty() {
    this.touch();
    this._setDirty(true);
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
