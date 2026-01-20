export type FieldState = {
  value: unknown;
  dirty: boolean;
};

export class FormController {
  private fields = new Map<string, FieldState>();

  register(name: string, initialValue: unknown) {
    this.fields.set(name, {
      value: initialValue,
      dirty: false,
    });
  }

  setValue(name: string, value: unknown) {
    const field = this.fields.get(name);
    if (!field) return;

    field.value = value;
    field.dirty = true;
  }

  getValue(name: string) {
    return this.fields.get(name)?.value;
  }
}
