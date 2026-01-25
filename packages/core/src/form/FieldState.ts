import { StandardSchemaV1 } from "@standard-schema/spec";
import { Field } from "../form/Field";
import { FormController } from "../form/FormController";
import { deepEquals } from "../utils/deep.util";

export class FieldState<
  TShape extends object,
  TPath extends Field.Paths<TShape>,
> {
  protected target?: HTMLElement;

  protected _isTouched = false;
  protected _isDirty = false;

  protected issues: StandardSchemaV1.Issue[] = [];

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

  get isTouched() {
    return this._isTouched;
  }

  get isDirty() {
    return this._isDirty;
  }

  bindElement(el: HTMLElement) {
    this.target = el;
  }

  modifyValue(
    modifier: (
      currentValue: Field.GetValue<TShape, TPath>,
      field: this,
    ) => Field.GetValue<TShape, TPath>,
    opts?: { shouldTouch?: boolean },
  ) {
    if (opts?.shouldTouch == null || opts?.shouldTouch) this.touch();

    const initialValue = Field.getValue<TShape, TPath>(
      this.control.config.initialData as TShape,
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

    this._isDirty = !deepEquals(initialValue as any, currentValue as any);
  }

  setValue(
    value: Field.GetValue<TShape, TPath>,
    opts?: { shouldTouch?: boolean },
  ) {
    return this.modifyValue(() => value, opts);
  }

  setIssues(issues: StandardSchemaV1.Issue[]) {
    this.issues = issues;
  }

  markDirty() {
    this._isDirty = true;
  }

  reset() {
    this._isTouched = false;
    this._isDirty = false;
  }

  touch() {
    this._isTouched = true;
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
