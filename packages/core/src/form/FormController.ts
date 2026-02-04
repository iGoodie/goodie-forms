import { getId } from "../utils/getId";

export class FormController<TOutput extends object> {
  _isValidating = false;
  _isSubmitting = false;
}

export class FormField<TOutput extends object, TValue> {
  public readonly id = getId();

  protected target?: HTMLElement;

  protected _isTouched = false;
  protected _isDirty = false;

  constructor(
    public readonly controller: FormController<TOutput>,
    public readonly path: PropertyKey[],
    initialState?: {
      isTouched?: boolean;
      isDirty?: boolean;
    },
  ) {
    if (initialState?.isTouched) this._setTouched(true);
    if (initialState?.isDirty) this._setDirty(true);
  }
}
