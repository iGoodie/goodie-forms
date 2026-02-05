import { StandardSchemaV1 } from "@standard-schema/spec";
import { produce } from "immer";
import { createNanoEvents } from "nanoevents";
import { FieldPath } from "../field/FieldPath";
import { FieldPathBuilder } from "../field/FieldPathBuilder";
import { Reconsile } from "../field/Reconcile";
import { FormField } from "../form/FormField";
import { DeepPartial } from "../types/DeepPartial";
import { ensureImmerability } from "../utils/ensureImmerability";
import { removeBy } from "../utils/removeBy";

export namespace FormController {
  export type Configs<TOutput extends object> = {
    initialData?: DeepPartial<TOutput>;
    validationSchema?: StandardSchemaV1<unknown, TOutput>;
    equalityComparators?: Record<any, (a: any, b: any) => boolean>;
  };

  export interface PreventableEvent {
    preventDefault(): void;
  }

  export type SubmitSuccessHandler<
    TOutput extends object,
    TEvent extends PreventableEvent,
  > = (
    data: TOutput,
    event: TEvent,
    abortSignal: AbortSignal,
  ) => void | Promise<void>;

  export type SubmitErrorHandler<TEvent extends PreventableEvent> = (
    issues: StandardSchemaV1.Issue[],
    event: TEvent,
    abortSignal: AbortSignal,
  ) => void | Promise<void>;
}

export class FormController<TOutput extends object> {
  _isValidating = false;
  _isSubmitting = false;

  _fields = new Map<string, FormField<TOutput, any>>();
  _initialData: DeepPartial<TOutput>;
  _data: DeepPartial<TOutput>;
  _issues: StandardSchemaV1.Issue[] = [];

  equalityComparators?: Record<any, (a: any, b: any) => boolean>;
  validationSchema?: StandardSchemaV1<unknown, TOutput>;

  public readonly events = createNanoEvents<{
    submissionStatusChange(isSubmitting: boolean): void;
    validationStatusChange(isValidating: boolean): void;

    fieldBound(fieldPath: FieldPath.Segments): void;
    fieldUnbound(fieldPath: FieldPath.Segments): void;
    fieldTouchUpdated(path: FieldPath.Segments): void;
    fieldDirtyUpdated(path: FieldPath.Segments): void;
    fieldIssuesUpdated(fieldPath: FieldPath.Segments): void;
    elementBound(fieldPath: FieldPath.Segments, el: HTMLElement): void;
    elementUnbound(fieldPath: FieldPath.Segments): void;
    validationTriggered(fieldPath: FieldPath.Segments): void;
    valueChanged(
      fieldPath: FieldPath.Segments,
      newValue: {} | undefined,
      oldValue: {} | undefined,
    ): void;
  }>();

  constructor(config: FormController.Configs<TOutput>) {
    this.validationSchema = config.validationSchema;
    this.equalityComparators = config.equalityComparators;
    this._initialData = config.initialData ?? ({} as DeepPartial<TOutput>);
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

  _unsafeSetFieldValue<TPath extends FieldPath.Segments>(
    path: TPath,
    value: FieldPath.Resolve<TOutput, TPath>,
    config?: { updateInitialValue?: boolean },
  ) {
    ensureImmerability(value);

    if (config?.updateInitialValue === true) {
      this._initialData = produce(this._initialData, (draft) => {
        FieldPath.setValue(draft as TOutput, path, value);
      });
    }

    this._data = produce(this._data, (draft) => {
      FieldPath.setValue(draft as TOutput, path, value);
    });
  }

  // TODO: Rename to "register" ??
  bindField<TPath extends FieldPath.Segments>(
    path: TPath,
    config?: {
      defaultValue?: FieldPath.Resolve<TOutput, TPath>;
      domElement?: HTMLElement;
      overrideInitialValue?: boolean;
    },
  ) {
    let currentValue = FieldPath.getValue(this._data as TOutput, path);

    if (currentValue == null && config?.defaultValue != null) {
      this._unsafeSetFieldValue(path, config.defaultValue, {
        updateInitialValue: config.overrideInitialValue,
      });
      currentValue = FieldPath.getValue(this._data as TOutput, path);
    }

    const initialValue = FieldPath.getValue(this._initialData as TOutput, path);

    const valueChanged = !Reconsile.deepEqual(currentValue, initialValue);

    const field = new FormField(this, path, {
      isDirty: valueChanged,
    });

    if (config?.domElement != null) {
      field.bindElement(config.domElement);
    }

    this._fields.set(field.stringPath, field);
    this.events.emit("fieldBound", field.path);

    if (valueChanged) {
      this.events.emit("valueChanged", field.path, currentValue, initialValue);
    }

    return field as FormField<TOutput, FieldPath.Resolve<TOutput, TPath>>;
  }

  unbindField(path: FieldPath.Segments) {
    const stringPath = FieldPath.toStringPath(path);
    this._fields.delete(stringPath);
    this.events.emit("fieldUnbound", path);
  }

  // TODO: Add an option to keep dirty/touched fields as they are
  reset(newInitialData?: DeepPartial<TOutput>) {
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

  getAscendantFields<TPath extends FieldPath.Segments>(path: TPath) {
    const paths = path.map((_, i) => {
      return path.slice(0, i + 1);
    });

    return paths.map((path) => this.getField(path)).filter((field) => !!field);
  }

  getField<TPath extends FieldPath.Segments>(path: TPath) {
    const stringPath = FieldPath.toStringPath(path);
    return this._fields.get(stringPath) as
      | FormField<TOutput, FieldPath.Resolve<TOutput, TPath>>
      | undefined;
  }

  clearFieldIssues<TPath extends FieldPath.Segments>(path: TPath) {
    this._issues = this._issues.filter((issue) => {
      return !FieldPath.equals(FieldPath.normalize(issue.path), path);
    });
  }

  private async applyValidation<TPath extends FieldPath.Segments>(
    _result: StandardSchemaV1.Result<TOutput>,
    path: TPath,
  ) {
    const diff = Reconsile.diff(
      this._issues,
      _result.issues ?? [],
      Reconsile.deepEqual,
      (issue) => {
        if (issue.path == null) return false;
        const issuePath = FieldPath.normalize(issue.path);
        return (
          FieldPath.equals(issuePath, path) ||
          FieldPath.isDescendant(path, issuePath)
        );
      },
    );

    removeBy(this._issues, (issue) => diff.removed.includes(issue));

    diff.added.forEach((issue) => this._issues.push(issue));

    if (diff.added.length !== 0 || diff.removed.length !== 0) {
      this.events.emit("fieldIssuesUpdated", path);
    }
  }

  async validateField<TPath extends FieldPath.Segments>(path: TPath) {
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

    for (const stringPath of this._fields.keys()) {
      const path = FieldPath.fromStringPath(stringPath);
      this.events.emit("validationTriggered", path);
      this.applyValidation(result, path);
    }

    // Append non-registered issues too
    const diff = Reconsile.diff(
      this._issues,
      result.issues ?? [],
      Reconsile.deepEqual,
    );
    diff.added.forEach((issue) => this._issues.push(issue));

    this.setValidating(false);
  }

  createSubmitHandler<TEvent extends FormController.PreventableEvent>(
    onSuccess?: FormController.SubmitSuccessHandler<TOutput, TEvent>,
    onError?: FormController.SubmitErrorHandler<TEvent>,
  ) {
    return async (event: TEvent) => {
      if (event != null) {
        event.preventDefault();
      }

      if (this._isValidating) return;
      if (this._isSubmitting) return;

      // TODO? impl or cancel
      const abortController = new AbortController();

      await this.validateForm();

      if (this._issues.length === 0) {
        this.setSubmitting(true);
        await onSuccess?.(this._data as TOutput, event, abortController.signal);
        this.setSubmitting(false);
        return;
      }

      for (const issue of this._issues) {
        if (issue.path == null) continue;
        const issuePath = FieldPath.normalize(issue.path);
        const field = this.getField(issuePath);
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

/* ---- TESTS ---------------- */

// interface User {
//   name: string;
//   address: {
//     city: string;
//     street: string;
//   };
//   friends: {
//     name: string;
//     tags: string[];
//   }[];
//   coords: [100, 200];
// }

// const formController = new FormController<User>({});
// const fieldPathBuilder = new FieldPathBuilder<User>();

// formController.events.on("valueChanged", (fieldPath, value) => {
//   //                                                 ^?
// });

// const path1 = fieldPathBuilder.fromProxy((data) => data.friends[0].tags[99]);
// const field1 = formController.getField(path1);

// const path2 = fieldPathBuilder.fromStringPath("coords[1]");
// const field2 = formController.getField(path2);
