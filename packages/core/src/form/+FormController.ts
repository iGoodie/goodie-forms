import { StandardSchemaV1 } from "@standard-schema/spec";
import { enableArrayMethods, enableMapSet, produce } from "immer";
import { createNanoEvents } from "nanoevents";
import { Field } from "./Field";
import { DeepPartial } from "../types/DeepPartial";
import { removeBy } from "../utils/removeBy";
import { FormField } from "./+FormField";
import { ensureImmerability } from "../utils/ensureImmerability";

enableMapSet();
enableArrayMethods();

export namespace Form {
  export type FormConfigs<TShape extends object> = {
    initialData?: DeepPartial<TShape>;
    validationSchema?: StandardSchemaV1<unknown, TShape>;
    equalityComparators?: Record<any, (a: any, b: any) => boolean>;
  };

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

// TODO: Rename TShape to TOutput, as it represents the targetted data shape on successful submission cb
export class FormController<TShape extends object> {
  _isValidating = false;
  _isSubmitting = false;

  _fields = new Map<Field.Paths<TShape>, FormField<TShape, any>>();
  _initialData: DeepPartial<TShape>;
  _data: DeepPartial<TShape>;
  _issues: StandardSchemaV1.Issue[] = [];

  equalityComparators?: Record<any, (a: any, b: any) => boolean>;
  validationSchema?: StandardSchemaV1<unknown, TShape>;

  public readonly events = createNanoEvents<{
    submissionStatusChange(isSubmitting: boolean): void;
    validationStatusChange(isValidating: boolean): void;

    fieldBound(fieldPath: Field.Paths<TShape>): void;
    fieldUnbound(fieldPath: Field.Paths<TShape>): void;
    fieldTouchUpdated(path: Field.Paths<TShape>): void;
    fieldDirtyUpdated(path: Field.Paths<TShape>): void;
    fieldIssuesUpdated(fieldPath: Field.Paths<TShape>): void;
    elementBound(fieldPath: Field.Paths<TShape>, el: HTMLElement): void;
    elementUnbound(fieldPath: Field.Paths<TShape>): void;
    validationTriggered(fieldPath: Field.Paths<TShape>): void;
    valueChanged(
      fieldPath: Field.Paths<TShape>,
      newValue: Field.GetValue<TShape, Field.Paths<TShape>> | undefined,
      oldValue: Field.GetValue<TShape, Field.Paths<TShape>> | undefined,
    ): void;
  }>();

  constructor(config: Form.FormConfigs<TShape>) {
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
    // TODO: Does it still count valid while validating?
    return this._issues.length === 0;
  }

  get isValidating() {
    return this._isValidating;
  }

  get isSubmitting() {
    return this._isSubmitting;
  }

  protected setValidating(newStatus: boolean) {
    if (this._isValidating === newStatus) return;
    this._isValidating = newStatus;
    this.events.emit("validationStatusChange", newStatus);
  }

  protected setSubmitting(newStatus: boolean) {
    if (this._isSubmitting === newStatus) return;
    this._isSubmitting = newStatus;
    this.events.emit("submissionStatusChange", newStatus);
  }

  _unsafeSetFieldValue<TPath extends Field.Paths<TShape>>(
    path: TPath,
    value: Field.GetValue<TShape, TPath>,
    config?: { updateInitialValue?: boolean },
  ) {
    ensureImmerability(value);

    if (config?.updateInitialValue === true) {
      this._initialData = produce(this._initialData, (draft) => {
        Field.setValue(draft as TShape, path, value);
      });
    }
    this._data = produce(this._data, (draft) => {
      Field.setValue(draft as TShape, path, value);
    });
  }

  // TODO: Rename to "register" ??
  bindField<TPath extends Field.Paths<TShape>>(
    path: TPath,
    config?: {
      defaultValue?: Field.GetValue<TShape, TPath>;
      domElement?: HTMLElement;
      overrideInitialValue?: boolean;
    },
  ) {
    let currentValue = Field._getValue(this._data as TShape, path);

    if (currentValue == null && config?.defaultValue != null) {
      this._unsafeSetFieldValue(path, config.defaultValue, {
        updateInitialValue: config.overrideInitialValue,
      });
      currentValue = Field._getValue(this._data as TShape, path);
    }

    const initialValue = Field._getValue(this._initialData as TShape, path);

    const field = new FormField(this, path, {
      isDirty: !Field.deepEqual(currentValue, initialValue),
    });

    if (config?.domElement != null) {
      field.bindElement(config.domElement);
    }

    this._fields.set(path, field);
    this.events.emit("fieldBound", path);

    return field;
  }

  unbindField(path: Field.Paths<TShape>) {
    this._fields.delete(path);
    this.events.emit("fieldUnbound", path);
  }

  // TODO: Add an option to keep dirty/touched fields as they are
  reset(newInitialData?: DeepPartial<TShape>) {
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

  getAscendantFields<TPath extends Field.Paths<TShape>>(path: TPath) {
    const pathFragments = Field.parsePathFragments(path);

    const paths = pathFragments.map((_, i) => {
      return Field.parsePath(
        pathFragments.slice(0, i + 1),
      ) as Field.Paths<TShape>;
    });

    return paths.map((path) => this.getField(path)).filter((field) => !!field);
  }

  getField<TPath extends Field.Paths<TShape>>(path: TPath) {
    return this._fields.get(path) as FormField<TShape, TPath> | undefined;
  }

  clearFieldIssues<TPath extends Field.Paths<TShape>>(path: TPath) {
    this._issues = this._issues.filter((issue) => {
      if (issue.path == null) return true;
      const issuePath = Field.parsePath(issue.path);
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
        const issuePath = Field.parsePath(issue.path);
        return issuePath === path || Field.isDescendant(path, issuePath);
      },
    );

    removeBy(this._issues, (issue) => diff.removed.includes(issue));

    diff.added.forEach((issue) => this._issues.push(issue));

    if (diff.added.length !== 0 || diff.removed.length !== 0) {
      this.events.emit("fieldIssuesUpdated", path);
    }
  }

  async validateField<TPath extends Field.Paths<TShape>>(path: TPath) {
    if (this._isValidating) return;

    if (this.validationSchema == null) return;

    this.setValidating(true);

    if (this.getField(path) == null) this.bindField(path);

    const result = await this.validationSchema["~standard"].validate(
      this._data,
    );

    this.events.emit("validationTriggered", path);
    this.applyValidation(result, path);

    this.setValidating(false);
  }

  async validateForm() {
    if (this._isValidating) return;

    if (this.validationSchema == null) return;

    this.setValidating(true);

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

    this.setValidating(false);
  }

  createSubmitHandler<TEvent extends Form.PreventableEvent>(
    onSuccess?: Form.SubmitSuccessHandler<TShape, TEvent>,
    onError?: Form.SubmitErrorHandler<TEvent>,
  ) {
    return async (event: TEvent) => {
      if (event != null) {
        event.preventDefault();
      }

      if (this._isValidating) return;
      if (this._isSubmitting) return;

      const abortController = new AbortController();

      await this.validateForm();

      if (this._issues.length === 0) {
        this.setSubmitting(true);
        await onSuccess?.(this._data as TShape, event, abortController.signal);
        this.setSubmitting(false);
        return;
      }

      for (const issue of this._issues) {
        if (issue.path == null) continue;
        const fieldPath = Field.parsePath(issue.path) as Field.Paths<TShape>;
        const field = this.getField(fieldPath);
        if (field == null) continue;
        if (field.boundElement == null) continue;
        field.focus();
        break;
      }
      await onError?.(this._issues, event, abortController.signal);
      this.setSubmitting(false);
    };
  }
}
