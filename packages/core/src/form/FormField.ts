import { immerable, produce } from "immer";
import { getId } from "../utils/getId";
import { Field } from "./Field";
import { FormController } from "./FormController";

export class FormField<
  TShape extends object,
  TPath extends Field.Paths<TShape>,
> {
  public readonly id = getId();

  protected target?: HTMLElement;

  protected _isTouched = false;
  protected _isDirty = false;

  constructor(
    public readonly controller: FormController<TShape>,
    public readonly path: TPath,
  ) {}

  get value(): Field.GetValue<TShape, TPath> | undefined {
    return Field.getValue<TShape, TPath>(
      this.controller._data as TShape,
      this.path,
    );
  }

  get initialValue(): Field.GetValue<TShape, TPath> | undefined {
    return Field.getValue<TShape, TPath>(
      this.controller._initialData as TShape,
      this.path,
    );
  }

  get boundElement() {
    return this.target;
  }

  get issues() {
    return this.controller._issues.filter(
      (issue) => Field.parsePath(issue.path ?? []) === this.path,
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
    if (changed) this.controller.events.emit("fieldTouchUpdated", this.path);
  }

  protected _setDirty(isDirty: boolean) {
    const changed = this._isDirty !== isDirty;
    this._isDirty = isDirty;
    if (changed) this.controller.events.emit("fieldDirtyUpdated", this.path);
  }

  bindElement(el: HTMLElement | undefined) {
    if (el != null) this.controller.events.emit("elementBound", this.path, el);
    else this.controller.events.emit("elementUnbound", this.path);
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

  setValue(
    value: Field.GetValue<TShape, TPath>,
    opts?: Parameters<typeof this.modifyValue>[1],
  ) {
    return this.modifyValue(() => value, opts);
  }

  modifyValue(
    modifier: (
      currentValue: Field.GetValue<TShape, TPath> | undefined,
    ) => Field.GetValue<TShape, TPath> | void,
    opts?: {
      shouldTouch?: boolean;
      shouldMarkDirty?: boolean;
    },
  ): void {
    if (opts?.shouldTouch == null || opts?.shouldTouch) {
      this.touch();
    }

    const ascendantFields = this.controller.getAscendantFields(this.path);

    const initialValues = ascendantFields.map((field) => field?.initialValue);
    initialValues.forEach((v) => FormField.ensureImmerability(v));

    const oldValues = ascendantFields.map((field) => field?.value);
    oldValues.forEach((v) => FormField.ensureImmerability(v));

    this.controller._data = produce(this.controller._data, (draft) => {
      Field.modifyValue(draft as TShape, this.path, (oldValue) =>
        modifier(oldValue),
      );
    });

    const newValues = ascendantFields.map((field) => field?.value);
    newValues.forEach((v) => FormField.ensureImmerability(v));

    const compareCustom = (a: any, b: any) => {
      if (typeof a !== "object") return;
      if (typeof b !== "object") return;
      const ctorA = a.constructor;
      const ctorB = b.constructor;
      if (ctorA !== ctorB) return;
      return this.controller.equalityComparators?.[ctorA]?.(a, b);
    };

    const valueChanged = !Field.deepEqual(
      oldValues[oldValues.length - 1],
      newValues[newValues.length - 1],
      compareCustom,
    );

    if (valueChanged) {
      for (let i = ascendantFields.length - 1; i >= 0; i--) {
        const field = ascendantFields[i];
        if (field == null) continue;
        this.controller.events.emit(
          "valueChanged",
          field.path,
          newValues[i],
          oldValues[i],
        );
      }
    }

    if (opts?.shouldMarkDirty == null || opts?.shouldMarkDirty) {
      const gotDirty = !Field.deepEqual(
        initialValues[initialValues.length - 1],
        newValues[newValues.length - 1],
        compareCustom,
      );
      this._setDirty(gotDirty);
    }
  }

  reset() {
    this._setTouched(false);
    this._setDirty(false);
  }

  touch() {
    this._setTouched(true);
  }

  markDirty() {
    this.touch();
    this._setDirty(true);
  }

  triggerValidation() {
    this.controller.validateField(this.path);
  }

  focus(opts?: { shouldTouch?: boolean }) {
    if (opts?.shouldTouch == null || opts.shouldTouch) {
      this.target?.addEventListener("focus", () => this.touch(), {
        once: true,
      });
    }

    this.target?.scrollIntoView();
    this.target?.focus();
  }
}
