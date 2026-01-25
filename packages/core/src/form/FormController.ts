import { StandardSchemaV1 } from "@standard-schema/spec";
import { enableArrayMethods, enableMapSet, produce } from "immer";
import { Field } from "../form/Field";
import { FieldState } from "../form/FieldState";
import { DeepPartial } from "../types/DeepPartial";
import { createNanoEvents } from "nanoevents";

enableMapSet();
enableArrayMethods();

export namespace Form {
  export type Status = "idle" | "validating" | "submitting";
}

export class FormController<TShape extends object = object> {
  _status: Form.Status = "idle";
  _fields = new Map<Field.Paths<TShape>, FieldState<TShape, any>>();
  _initialData: DeepPartial<TShape>;
  _data: DeepPartial<TShape>;
  _issues: StandardSchemaV1.Issue[] = [];

  validationSchema?: StandardSchemaV1<TShape, TShape>;
  // TODO: Validation mode, e.g., onChange, onBlur, onSubmit, etc.

  public readonly events = createNanoEvents<{
    statusChanged(newStatus: Form.Status, oldStatus: Form.Status): void;
    fieldBound(fieldPath: Field.Paths<TShape>): void;
    fieldUnbound(fieldPath: Field.Paths<TShape>): void;
    fieldUpdated(path: Field.Paths<TShape>): void;
    elementBound(fieldPath: Field.Paths<TShape>, el: HTMLElement): void;
    elementUnbound(fieldPath: Field.Paths<TShape>): void;
    validationTriggered(fieldPath: Field.Paths<TShape> | null): void;
    valueChanged(
      path: Field.Paths<TShape>,
      newValue: Field.GetValue<TShape, Field.Paths<TShape>> | undefined,
      oldValue: Field.GetValue<TShape, Field.Paths<TShape>> | undefined,
    ): void;
  }>();

  constructor(config: {
    initialData?: DeepPartial<TShape>;
    validationSchema?: StandardSchemaV1<TShape, TShape>;
  }) {
    this.validationSchema = config.validationSchema;
    this._initialData = config.initialData ?? ({} as DeepPartial<TShape>);
    this._data = produce(this._initialData, () => {});
  }

  get isDirty() {
    for (const fieldState of this._fields.values()) {
      if (fieldState.isDirty) return true;
    }
    return false;
  }

  get isValid() {
    return this._issues.length === 0;
  }

  protected setStatus(newStatus: Form.Status) {
    const oldStatus = this._status;
    this._status = newStatus;
    this.events.emit("statusChanged", newStatus, oldStatus);
  }

  _unsafeSetFieldValue<TPath extends Field.Paths<TShape>>(
    path: TPath,
    value: Field.GetValue<TShape, TPath>,
    config?: { updateInitialValue?: boolean },
  ) {
    if (config?.updateInitialValue) {
      this._initialData = produce(this._initialData, (draft) => {
        Field.setValue<TShape, TPath>(draft as TShape, path, value);
      });
    }
    this._data = produce(this._data, (draft) => {
      Field.setValue<TShape, TPath>(draft as TShape, path, value);
    });
  }

  bindField<TPath extends Field.Paths<TShape>>(
    path: TPath,
    config?: {
      defaultValue?: Field.GetValue<TShape, TPath>;
      domElement?: HTMLElement;
    },
  ) {
    const fieldState = new FieldState(this, path);

    console.log("Binding", path, config?.defaultValue);
    this._fields.set(path, fieldState);
    this.events.emit("fieldBound", path);

    if (config?.defaultValue != null) {
      this._unsafeSetFieldValue(path, config.defaultValue, {
        updateInitialValue: true,
      });
    }

    if (config?.domElement != null) {
      fieldState.bindElement(config.domElement);
    }

    return fieldState;
  }

  unbindField(path: Field.Paths<TShape>) {
    this._fields.delete(path);
    this.events.emit("fieldUnbound", path);
  }

  reset() {
    this.setStatus("idle");
    this._data = this._initialData;
    this._issues = [];

    for (const fieldState of this._fields.values()) {
      fieldState.reset();
    }
  }

  getFieldState<TPath extends Field.Paths<TShape>>(
    path: TPath,
    config: { bindIfMissing: true },
  ): FieldState<TShape, TPath>;
  getFieldState<TPath extends Field.Paths<TShape>>(
    path: TPath,
  ): FieldState<TShape, TPath> | undefined;
  getFieldState<TPath extends Field.Paths<TShape>>(
    path: TPath,
    config?: { bindIfMissing?: boolean },
  ) {
    let fieldState = this._fields.get(path);

    if (fieldState == null && config?.bindIfMissing) {
      fieldState = this.bindField(path);
    }

    return fieldState;
  }

  async validateField<TPath extends Field.Paths<TShape>>(path: TPath) {
    if (this._status !== "idle") return;

    // TODO: Support native HTML validation, if no schema is provided
    if (this.validationSchema == null) return;

    this.setStatus("validating");

    this.getFieldState(path, { bindIfMissing: true });

    const result = await this.validationSchema["~standard"].validate(
      this._data,
    );

    this._issues = this._issues.filter((issue) => {
      if (issue.path == null) return true;
      const issuePath = issue.path.join(".");
      return issuePath !== path;
    });

    if (!("value" in result)) {
      this._issues.push(...result.issues);
    }

    this.events.emit("validationTriggered", path);
    this.setStatus("idle");
  }

  async validateForm() {
    if (this._status !== "idle") return;

    // TODO: Support native HTML validation, if no schema is provided
    if (this.validationSchema == null) return;

    this.setStatus("validating");

    const result = await this.validationSchema["~standard"].validate(
      this._data,
    );

    if ("value" in result) {
      this._issues = [];
    } else {
      this._issues = [...result.issues];
    }

    for (const path of this._fields.keys()) {
      console.log([...this._fields.keys()]);
      this.events.emit("validationTriggered", path);
    }

    this.setStatus("idle");
  }

  createSubmitHandler<Ev extends { preventDefault(): void }>(
    onSuccess?: (data: TShape, event: Ev) => void | Promise<void>,
    onError?: (
      issues: StandardSchemaV1.Issue[],
      event: Ev,
    ) => void | Promise<void>,
  ) {
    return async (event: Ev) => {
      await this.validateForm();

      if (event != null) {
        event.preventDefault();
      }

      if (this._issues.length === 0) {
        await onSuccess?.(this._data as TShape, event);
        return;
      }

      for (const issue of this._issues) {
        if (issue.path == null) continue;
        const fieldPath = issue.path.join(".") as Field.Paths<TShape>;
        const fieldState = this.getFieldState(fieldPath);
        if (fieldState == null) continue;
        if (fieldState.boundElement == null) continue;
        fieldState.focus();
        break;
      }
      await onError?.(this._issues, event);
    };
  }
}

/* --------------- */

// class User {
//   protected username: string;

//   constructor(username: string) {
//     this.username = username;
//   }

//   setUsername(username: string) {
//     this.username = username;
//   }
// }

// const initialData = {
//   user: new User("initialUser"),
//   name: "",
//   address: {
//     city: "",
//     street: "",
//   },
// };

// const control = new FormController({
//   initialData,
// });

// const field = control.bindField("user");

// console.log(initialData.user === field.value);

// field.modifyValue((val) => {
//   val.setUsername("newUser");
// });

// console.log(initialData.user === field.value);

// console.log(initialData.user, field.value);
