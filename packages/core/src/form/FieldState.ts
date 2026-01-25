import { StandardSchemaV1 } from "@standard-schema/spec";
import { Field } from "../form/Field";
import { FormController } from "../form/FormController";
import { deepEquals } from "../utils/deep.util";
import { createNanoEvents } from "nanoevents";

export class FieldState<
  TShape extends object,
  TPath extends Field.Paths<TShape>,
> {
  protected target?: HTMLElement;

  protected _isTouched = false;
  protected _isDirty = false;

  protected _issues: StandardSchemaV1.Issue[] = [];

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
    return this._issues;
  }

  get isTouched() {
    return this._isTouched;
  }

  get isDirty() {
    return this._isDirty;
  }

  get isValid() {
    return this._issues.length === 0;
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

  modifyValue(
    modifier: (
      currentValue: Field.GetValue<TShape, TPath>,
      field: this,
    ) => Field.GetValue<TShape, TPath>,
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

    Field.modifyValue<TShape, TPath>(
      this.control._data as TShape,
      this.path,
      (oldValue) => modifier(oldValue, this),
    );

    const currentValue = Field.getValue<TShape, TPath>(
      this.control._data as TShape,
      this.path,
    );

    const valueChanged = !deepEquals(initialValue, currentValue);

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

  setIssues(issues: StandardSchemaV1.Issue[]) {
    this._issues = issues;
  }

  resetState() {
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
