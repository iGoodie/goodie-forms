import { StandardSchemaV1 } from "@standard-schema/spec";
import { Draft, produce } from "immer";
import { FieldPath } from "../field/FieldPath";
import { Reconcile } from "../field/Reconcile";
import { FormController } from "../form/FormController";
import { DeepReadonly } from "../types/DeepHelpers";
import { Suppliable, supply } from "../types/Suppliable";
import { ensureImmerability } from "../utils/ensureImmerability";
import { generateId } from "../utils/generateId";

const genericTypesMarker: unique symbol = Symbol();

export namespace FormField {
  export interface ModificationOptions {
    shouldTouch?: boolean;
    shouldMarkDirty?: boolean;
  }

  export type Output<TField extends FormField<object, unknown>> =
    TField[typeof genericTypesMarker]["output"];

  export type Value<TField extends FormField<object, unknown>> =
    TField[typeof genericTypesMarker]["value"];
}

export class FormField<TOutput extends object, TValue> {
  /** @internal type-system holder for the generics */
  readonly [genericTypesMarker]!: {
    output: TOutput;
    value: TValue;
  };

  public readonly id = generateId();

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

  applyDefaultValue(
    opts?: FormField.ModificationOptions & { overrideInitialValue?: boolean },
  ) {
    if (this.defaultValue == null) return;

    const defaultValue = supply(this.defaultValue);
    if (defaultValue === undefined) return;

    ensureImmerability(defaultValue);

    if (this.value == null) {
      this.setValue(defaultValue, opts);
    }

    if (opts?.overrideInitialValue === true) {
      this.setInitialValue(defaultValue, opts);
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

  private modifyData(
    draftConsumer: (draft: Draft<typeof this.controller.data>) => void,
    opts?: FormField.ModificationOptions,
  ) {
    if (opts?.shouldTouch == null || opts?.shouldTouch === true) {
      this.touch();
    }

    const ascendantFields = this.controller.getAscendantFields(this.path);

    const initialValues = ascendantFields.map((field) => field?.initialValue);
    initialValues.forEach((v) => ensureImmerability(v));

    const prevValues = ascendantFields.map((field) => field?.value);
    prevValues.forEach((v) => ensureImmerability(v));

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
      prevValues[prevValues.length - 1],
      newValues[newValues.length - 1],
      compareCustom,
    );

    if (valueChanged) {
      for (let i = ascendantFields.length - 1; i >= 0; i--) {
        const field = ascendantFields[i];
        this.controller.events.emit(
          "fieldValueChanged",
          field.path,
          newValues[i],
          prevValues[i],
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

  setValue(value: TValue, opts?: FormField.ModificationOptions) {
    return this.modifyData((data) => {
      FieldPath.setValue(data as TOutput, this.path, value as never);
    }, opts);
  }

  modifyValue(
    modifier: (currentValue: TValue) => undefined,
    opts?: FormField.ModificationOptions,
  ): void {
    return this.modifyData((data) => {
      FieldPath.modifyValue(data as TOutput, this.path, (oldValue) => {
        modifier(oldValue as TValue);
      });
    }, opts);
  }

  private modifyInitialData(
    draftConsumer: (draft: Draft<typeof this.controller.initialData>) => void,
    opts?: FormField.ModificationOptions,
  ) {
    if (opts?.shouldTouch == null || opts?.shouldTouch === true) {
      this.touch();
    }

    const ascendantFields = this.controller.getAscendantFields(this.path);

    const values = ascendantFields.map((field) => field?.value);
    values.forEach((v) => ensureImmerability(v));

    const prevInitialValues = ascendantFields.map(
      (field) => field?.initialValue,
    );
    prevInitialValues.forEach((v) => ensureImmerability(v));

    this.controller._initialData = produce(
      this.controller._initialData,
      draftConsumer,
    );

    const newInitialValues = ascendantFields.map(
      (field) => field?.initialValue,
    );
    newInitialValues.forEach((v) => ensureImmerability(v));

    const compareCustom = (a: any, b: any) => {
      if (typeof a !== "object") return;
      if (typeof b !== "object") return;
      const ctorA = a.constructor;
      const ctorB = b.constructor;
      if (ctorA !== ctorB) return;
      return this.controller.equalityComparators?.get(ctorA)?.(a, b);
    };

    const initialValueChanged = !Reconcile.deepEqual(
      prevInitialValues[prevInitialValues.length - 1],
      newInitialValues[newInitialValues.length - 1],
      compareCustom,
    );

    if (initialValueChanged) {
      for (let i = ascendantFields.length - 1; i >= 0; i--) {
        const field = ascendantFields[i];
        this.controller.events.emit(
          "fieldInitialValueChanged",
          field.path,
          newInitialValues[i],
          prevInitialValues[i],
        );
      }
    }

    if (opts?.shouldMarkDirty == null || opts?.shouldMarkDirty) {
      const gotDirty = !Reconcile.deepEqual(
        values[values.length - 1],
        newInitialValues[newInitialValues.length - 1],
        compareCustom,
      );
      this._setDirty(gotDirty);
    }
  }

  setInitialValue(value: TValue, opts?: FormField.ModificationOptions) {
    return this.modifyInitialData((initialData) => {
      FieldPath.setValue(initialData as TOutput, this.path, value as never);
    }, opts);
  }

  modifyInitialValue(
    modifier: (currentValue: TValue) => undefined,
    opts?: FormField.ModificationOptions,
  ): void {
    return this.modifyInitialData((initialData) => {
      FieldPath.modifyValue(initialData as TOutput, this.path, (oldValue) => {
        modifier(oldValue as TValue);
      });
    }, opts);
  }

  pushIssue(issue: Omit<StandardSchemaV1.Issue, "path">) {
    return this.controller.pushFieldIssue(this.path, issue);
  }

  clearIssues() {
    return this.controller.clearFieldIssues(this.path);
  }

  reset() {
    this._setTouched(false);
    this._setDirty(false);
    this.controller.events.emit("fieldReset", this.path);
  }

  touch() {
    this._setTouched(true);
  }

  markDirty() {
    this._setDirty(true);
  }

  validate() {
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
