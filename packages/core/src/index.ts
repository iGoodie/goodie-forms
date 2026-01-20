import { deepClone, deepEquals } from "./utils/deep.util";
import { NativeFormValue, NativeFormObject } from "./types/NativeForm";
import { getByKey } from "./utils/obj.utils";
import { ExtractKeys } from "./utils/type.utils";

export type * from "./types/NativeForm";

class FieldState<TData extends NativeFormValue> {
  protected target?: HTMLElement;

  protected value: TData;
  protected error?: string;
  protected isTouched = false;
  protected isDirty = false;

  constructor(protected initialValue: TData) {
    this.value = deepClone(initialValue);
  }

  bindElement(el: HTMLElement) {
    console.log("Binding", el);
    this.target = el;
  }

  update(value: TData) {
    this.isDirty = !deepEquals(this.initialValue, value);
    this.value = value;
  }

  touch() {
    this.isTouched = true;
  }

  focus() {
    console.log("Focusingi", this.target);
    this.target?.focus();
  }
}

export class FormController<TShape extends NativeFormObject> {
  protected fields = new Map<ExtractKeys<TShape>, FieldState<any>>();

  constructor(protected initialData: TShape) {}

  registerField(
    fieldName: ExtractKeys<TShape>,
    initialValue?: NativeFormValue,
  ) {
    this.fields.set(
      fieldName,
      new FieldState(
        initialValue /*?? getByKey(this.initialData, fieldName) */,
      ),
    );
  }

  uregisterField(fieldName: ExtractKeys<TShape>) {
    this.fields.delete(fieldName);
  }

  getFieldState(fieldName: ExtractKeys<TShape>) {
    return this.fields.get(fieldName);
  }
}
