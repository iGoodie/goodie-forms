import { FormController } from "../form/FormController";
import { deepEquals } from "../utils/deep.util";
import {
  ExtractPaths,
  getByPath,
  setByPath,
  ValueByPath,
} from "../utils/path.utils";

export class FieldState<
  TShape extends object,
  TPath extends ExtractPaths<TShape>,
> {
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

    const initialValue = getByPath(this.control.config.initialData, this.path);

    this.isDirty = !deepEquals(initialValue as any, value as any);

    setByPath(this.control._data, this.path, value);
  }

  reset() {
    this.isTouched = false;
    this.isDirty = false;
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
