import { Draft, produce } from "immer";
import { FieldPath } from "../field/FieldPath";
import { Reconcile } from "../field/Reconcile";
import { FormController } from "../form/FormController";
import { DeepReadonly } from "../types/DeepHelpers";
import { Suppliable, supply } from "../types/Suppliable";
import { ensureImmerability } from "../utils/ensureImmerability";
import { getId } from "../utils/getId";

export class FormField<TOutput extends object, TValue> {
  public readonly id = getId();

  protected target?: HTMLElement;

  protected _isTouched = false;
  protected _isDirty = false;

  /** @internal register via `FormController::registerField` instead */
  constructor(
    public readonly controller: FormController<TOutput>,
    public readonly path: FieldPath.Segments,
    public readonly defaultValue?: Suppliable<TValue>,
    initialState?: {
      isTouched?: boolean;
      isDirty?: boolean;
    },
  ) {
    if (initialState?.isTouched) this._setTouched(true);
    if (initialState?.isDirty) this._setDirty(true);
  }

  get stringPath() {
    return FieldPath.toStringPath(this.path);
  }

  get value(): DeepReadonly<TValue> | undefined {
    return FieldPath.getValue(this.controller.data, this.path);
  }

  get initialValue(): DeepReadonly<TValue> | undefined {
    return FieldPath.getValue(this.controller.initialData, this.path);
  }

  get boundElement() {
    return this.target;
  }

  get issues() {
    return this.controller._issues.filter((issue) =>
      FieldPath.equals(FieldPath.normalize(issue.path), this.path),
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

  ensureDefault(opts?: Parameters<typeof this.modifyData>[1]) {
    if (this.value == null && this.defaultValue != null) {
      const defaultValue = supply(this.defaultValue);

      if (defaultValue != null) {
        this.setValue(defaultValue, opts);
      }
    }
  }

  protected _setTouched(isTouched: boolean) {
    const changed = this._isTouched !== isTouched;
    this._isTouched = isTouched;

    if (changed) {
      const ascendantFields = this.controller.getAscendantFields(this.path);
      for (let i = ascendantFields.length - 1; i >= 0; i--) {
        const field = ascendantFields[i];
        if (field == null) continue;
        this.controller.events.emit("fieldTouchUpdated", field.path);
      }
    }
  }

  protected _setDirty(isDirty: boolean) {
    const changed = this._isDirty !== isDirty;
    this._isDirty = isDirty;

    if (changed) {
      const ascendantFields = this.controller.getAscendantFields(this.path);
      for (let i = ascendantFields.length - 1; i >= 0; i--) {
        const field = ascendantFields[i];
        if (field == null) continue;
        this.controller.events.emit("fieldDirtyUpdated", field.path);
      }
    }
  }

  bindElement(el: HTMLElement | undefined) {
    if (el != null) {
      this.target = el;
      this.controller.events.emit("elementBound", this.path, el);
    } else {
      this.unbindElement();
    }
  }

  unbindElement() {
    if (this.target != null) {
      this.target = undefined;
      this.controller.events.emit("elementUnbound", this.path);
    }
  }

  clearIssues() {
    return this.controller.clearFieldIssues(this.path);
  }

  private modifyData(
    draftConsumer: (draft: Draft<typeof this.controller.data>) => void,
    opts?: {
      shouldTouch?: boolean;
      shouldMarkDirty?: boolean;
    },
  ) {
    if (opts?.shouldTouch == null || opts?.shouldTouch === true) {
      this.touch();
    }

    const ascendantFields = this.controller.getAscendantFields(this.path);

    const initialValues = ascendantFields.map((field) => field?.initialValue);
    initialValues.forEach((v) => ensureImmerability(v));

    const oldValues = ascendantFields.map((field) => field?.value);
    oldValues.forEach((v) => ensureImmerability(v));

    this.controller._data = produce(this.controller._data, draftConsumer);

    const newValues = ascendantFields.map((field) => field?.value);
    newValues.forEach((v) => ensureImmerability(v));

    const compareCustom = (a: any, b: any) => {
      if (typeof a !== "object") return;
      if (typeof b !== "object") return;
      const ctorA = a.constructor;
      const ctorB = b.constructor;
      if (ctorA !== ctorB) return;
      return this.controller.equalityComparators?.get(ctorA)?.(a, b);
    };

    const valueChanged = !Reconcile.deepEqual(
      oldValues[oldValues.length - 1],
      newValues[newValues.length - 1],
      compareCustom,
    );

    if (valueChanged) {
      for (let i = ascendantFields.length - 1; i >= 0; i--) {
        const field = ascendantFields[i];
        this.controller.events.emit(
          "valueChanged",
          field.path,
          newValues[i],
          oldValues[i],
        );
      }
    }

    if (opts?.shouldMarkDirty == null || opts?.shouldMarkDirty) {
      const gotDirty = !Reconcile.deepEqual(
        initialValues[initialValues.length - 1],
        newValues[newValues.length - 1],
        compareCustom,
      );
      this._setDirty(gotDirty);
    }
  }

  setValue(value: TValue, opts?: Parameters<typeof this.modifyData>[1]) {
    return this.modifyData((data) => {
      FieldPath.setValue(data as TOutput, this.path, value as never);
    }, opts);
  }

  modifyValue(
    modifier: (currentValue: TValue) => undefined,
    opts?: Parameters<typeof this.modifyData>[1],
  ): void {
    return this.modifyData((data) => {
      FieldPath.modifyValue(data as TOutput, this.path, (oldValue) => {
        modifier(oldValue as TValue);
      });
    }, opts);
  }

  reset() {
    this._setTouched(false);
    this._setDirty(false);
  }

  touch() {
    this._setTouched(true);
  }

  markDirty() {
    this._setDirty(true);
  }

  triggerValidation() {
    this.controller.validateField(this.path);
  }

  focus(opts?: {
    shouldTouch?: boolean;
    scrollOptions?: ScrollIntoViewOptions;
  }) {
    if (opts?.shouldTouch == null || opts.shouldTouch) {
      this.target?.addEventListener("focus", () => this.touch(), {
        once: true,
      });
    }

    this.target?.scrollIntoView(opts?.scrollOptions);
    this.target?.focus();
  }
}
