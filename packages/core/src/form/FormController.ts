import { StandardSchemaV1 } from "@standard-schema/spec";
import { enableArrayMethods, enableMapSet, produce } from "immer";
import { createNanoEvents } from "nanoevents";
import { Field } from "../form/Field";
import { DeepPartial } from "../types/DeepPartial";
import { removeBy } from "../utils/removeBy";
import { FormField } from "./FormField";

enableMapSet();
enableArrayMethods();

export namespace Form {
  export type Status = "idle" | "validating" | "submitting";

  export type FormConfigs<TShape extends object> = ConstructorParameters<
    typeof FormController<TShape>
  >[0];

  export interface PreventableEvent {
    preventDefault(): void;
  }

  export type SubmitSuccessHandler<
    TShape extends object,
    TEvent extends PreventableEvent,
  > = (
    data: TShape,
    event: TEvent,
    abortSignal: AbortSignal,
  ) => void | Promise<void>;

  export type SubmitErrorHandler<TEvent extends PreventableEvent> = (
    issues: StandardSchemaV1.Issue[],
    event: TEvent,
    abortSignal: AbortSignal,
  ) => void | Promise<void>;
}

export class FormController<TShape extends object = object> {
  _status: Form.Status = "idle";
  _fields = new Map<Field.Paths<TShape>, FormField<TShape, any>>();
  _initialData: DeepPartial<TShape>;
  _data: DeepPartial<TShape>;
  _issues: StandardSchemaV1.Issue[] = [];

  equalityComparators?: Record<any, (a: any, b: any) => boolean>;
  validationSchema?: StandardSchemaV1<TShape, TShape>;

  public readonly events = createNanoEvents<{
    statusChanged(newStatus: Form.Status, oldStatus: Form.Status): void;
    fieldBound(fieldPath: Field.Paths<TShape>): void;
    fieldUnbound(fieldPath: Field.Paths<TShape>): void;
    fieldTouchUpdated(path: Field.Paths<TShape>): void;
    fieldDirtyUpdated(path: Field.Paths<TShape>): void;
    elementBound(fieldPath: Field.Paths<TShape>, el: HTMLElement): void;
    elementUnbound(fieldPath: Field.Paths<TShape>): void;
    validationTriggered(fieldPath: Field.Paths<TShape>): void;
    validationIssuesUpdated(fieldPath: Field.Paths<TShape>): void;
    valueChanged(
      path: Field.Paths<TShape>,
      newValue: Field.GetValue<TShape, Field.Paths<TShape>> | undefined,
      oldValue: Field.GetValue<TShape, Field.Paths<TShape>> | undefined,
    ): void;
  }>();

  constructor(config: {
    initialData?: DeepPartial<TShape>;
    validationSchema?: StandardSchemaV1<TShape, TShape>;
    equalityComparators?: Record<any, (a: any, b: any) => boolean>;
  }) {
    this.validationSchema = config.validationSchema;
    this.equalityComparators = config.equalityComparators;
    this._initialData = config.initialData ?? ({} as DeepPartial<TShape>);
    this._data = produce(this._initialData, () => {});
  }

  get isDirty() {
    for (const field of this._fields.values()) {
      if (field.isDirty) return true;
    }
    return false;
  }

  get isValid() {
    return this._issues.length === 0;
  }

  get isSubmitting() {
    return this._status === "submitting";
  }

  protected setStatus(newStatus: Form.Status) {
    if (newStatus === this._status) return;
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
    const field = new FormField(this, path);

    this._fields.set(path, field);
    this.events.emit("fieldBound", path);

    if (config?.defaultValue != null) {
      this._unsafeSetFieldValue(path, config.defaultValue, {
        updateInitialValue: true,
      });
    }

    if (config?.domElement != null) {
      field.bindElement(config.domElement);
    }

    return field;
  }

  unbindField(path: Field.Paths<TShape>) {
    this._fields.delete(path);
    this.events.emit("fieldUnbound", path);
  }

  // TODO: Add an option to keep dirty/touched fields as they are
  reset(newInitialData?: DeepPartial<TShape>) {
    this.setStatus("idle");
    this._data = this._initialData;
    this._issues = [];

    for (const field of this._fields.values()) {
      field.reset();
    }

    if (newInitialData != null) {
      this._initialData = newInitialData;
      this._data = produce(this._initialData, () => {});
    }
  }

  getField<TPath extends Field.Paths<TShape>>(path: TPath) {
    return this._fields.get(path) as FormField<TShape, TPath> | undefined;
  }

  clearFieldIssues<TPath extends Field.Paths<TShape>>(path: TPath) {
    this._issues = this._issues.filter((issue) => {
      if (issue.path == null) return true;
      const issuePath = issue.path.join(".");
      return issuePath !== path;
    });
  }

  private async applyValidation<TPath extends Field.Paths<TShape>>(
    _result: StandardSchemaV1.Result<TShape>,
    path: TPath,
  ) {
    const diff = Field.diff(
      this._issues,
      _result.issues ?? [],
      Field.deepEqual,
      (issue) => {
        if (issue.path == null) return false;
        const issuePath = issue.path.join(".");
        return issuePath === path;
      },
    );

    removeBy(this._issues, (issue) => diff.removed.includes(issue));

    diff.added.forEach((issue) => this._issues.push(issue));

    if (diff.added.length !== 0 || diff.removed.length !== 0) {
      this.events.emit("validationIssuesUpdated", path);
    }
  }

  async validateField<TPath extends Field.Paths<TShape>>(path: TPath) {
    if (this._status !== "idle") return;

    if (this.validationSchema == null) return;

    this.setStatus("validating");

    if (this.getField(path) == null) this.bindField(path);

    const result = await this.validationSchema["~standard"].validate(
      this._data,
    );

    this.events.emit("validationTriggered", path);
    this.applyValidation(result, path);

    this.setStatus("idle");
  }

  async validateForm() {
    if (this._status !== "idle") return;

    if (this.validationSchema == null) return;

    this.setStatus("validating");

    const result = await this.validationSchema["~standard"].validate(
      this._data,
    );

    for (const path of this._fields.keys()) {
      this.events.emit("validationTriggered", path);
      this.applyValidation(result, path);
    }

    // Append non-registered issues too
    const diff = Field.diff(this._issues, result.issues ?? [], Field.deepEqual);
    diff.added.forEach((issue) => this._issues.push(issue));

    this.setStatus("idle");
  }

  createSubmitHandler<TEvent extends Form.PreventableEvent>(
    onSuccess?: Form.SubmitSuccessHandler<TShape, TEvent>,
    onError?: Form.SubmitErrorHandler<TEvent>,
  ) {
    return async (event: TEvent) => {
      if (event != null) {
        event.preventDefault();
      }

      if (this._status !== "idle") return;

      const abortController = new AbortController();

      await this.validateForm();

      if (this._issues.length === 0) {
        this.setStatus("submitting");
        await onSuccess?.(this._data as TShape, event, abortController.signal);
        this.setStatus("idle");
        return;
      }

      for (const issue of this._issues) {
        if (issue.path == null) continue;
        const fieldPath = issue.path.join(".") as Field.Paths<TShape>;
        const field = this.getField(fieldPath);
        if (field == null) continue;
        if (field.boundElement == null) continue;
        field.focus();
        break;
      }
      await onError?.(this._issues, event, abortController.signal);
      this.setStatus("idle");
    };
  }
}
