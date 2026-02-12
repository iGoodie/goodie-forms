import { StandardSchemaV1 } from "@standard-schema/spec";
import { produce } from "immer";
import { createNanoEvents } from "nanoevents";
import { FieldPath } from "../field/FieldPath";
import { FieldPathBuilder } from "../field/FieldPathBuilder";
import { Reconcile } from "../field/Reconcile";
import { FormField } from "../form/FormField";
import { DeepPartial, DeepReadonly } from "../types/DeepHelpers";
import { Suppliable, supply } from "../types/Suppliable";
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
    TEvent extends PreventableEvent | null | undefined,
  > = (data: DeepReadonly<TOutput>, event: TEvent) => void | Promise<void>;

  export type SubmitErrorHandler<
    TEvent extends PreventableEvent | null | undefined,
  > = (issues: StandardSchemaV1.Issue[], event: TEvent) => void | Promise<void>;
}

export class FormController<TOutput extends object> {
  private _isValidating = false;
  private _isSubmitting = false;
  private _triedSubmitting = false;

  private pathBuilder = new FieldPathBuilder<TOutput>();

  /** @internal use `this.data` instead */
  _fields = new Map<string, FormField<TOutput, any>>();
  /** @internal use `this.initialData` instead */
  _initialData: DeepPartial<TOutput>;
  /** @internal use `this.data` instead */
  _data: DeepPartial<TOutput>;
  /** @internal use `this.issues` instead */
  _issues: StandardSchemaV1.Issue[] = [];

  equalityComparators?: Record<any, (a: any, b: any) => boolean>;
  validationSchema?: StandardSchemaV1<unknown, TOutput>;

  public readonly events = createNanoEvents<{
    submissionStatusChange(isSubmitting: boolean): void;
    validationStatusChange(isValidating: boolean): void;

    fieldRegistered(fieldPath: FieldPath.Segments): void;
    fieldUnregistered(fieldPath: FieldPath.Segments): void;
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

  get data(): DeepReadonly<DeepPartial<TOutput>> {
    return this._data;
  }

  get initialData(): DeepReadonly<DeepPartial<TOutput>> {
    return this._initialData;
  }

  get issues(): readonly StandardSchemaV1.Issue[] {
    return this._issues;
  }

  get path() {
    return this.pathBuilder;
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

  get triedSubmitting() {
    return this._triedSubmitting;
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

  registerField<TPath extends FieldPath.Segments>(
    path: TPath,
    config?: {
      /**
       * Used to set value at **path** in **data**, if it's missing.
       */
      defaultValue?: Suppliable<FieldPath.Resolve<TOutput, TPath>>;
      /**
       * Whether value in **initialData** should also be changed, if **defaultValue** is used or not
       *
       * If this is set to `true` and **defaultValue** is used; **initialData** will be modified
       */
      overrideInitialValue?: boolean;
    },
  ) {
    let currentValue = FieldPath.getValue(this._data as TOutput, path);

    if (currentValue == null && config?.defaultValue != null) {
      const defaultValue = supply(config.defaultValue);

      ensureImmerability(defaultValue);

      if (config?.overrideInitialValue === true) {
        this._initialData = produce(this._initialData, (draft) => {
          FieldPath.setValue(draft as TOutput, path, defaultValue);
        });
      }

      this._data = produce(this._data, (draft) => {
        FieldPath.setValue(draft as TOutput, path, defaultValue);
      });

      currentValue = FieldPath.getValue(this._data as TOutput, path);
    }

    const initialValue = FieldPath.getValue(this._initialData as TOutput, path);

    const valueChanged = !Reconcile.deepEqual(currentValue, initialValue);

    const field = new FormField(this, path, config?.defaultValue, {
      isDirty: valueChanged,
    });

    this._fields.set(field.stringPath, field);
    this.events.emit("fieldRegistered", field.path);

    if (valueChanged) {
      this.events.emit("valueChanged", field.path, currentValue, initialValue);
    }

    return field as FormField<TOutput, FieldPath.Resolve<TOutput, TPath>>;
  }

  unregisterField(path: FieldPath.Segments) {
    const stringPath = FieldPath.toStringPath(path);
    this._fields.delete(stringPath);
    this.events.emit("fieldUnregistered", path);
  }

  // TODO: Add an option to keep dirty/touched fields as they are
  reset(newInitialData?: DeepPartial<TOutput>) {
    this._data = this._initialData;
    this._issues = [];
    this._triedSubmitting = false;

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
    const diff = Reconcile.arrayDiff(
      this._issues,
      _result.issues ?? [],
      Reconcile.deepEqual,
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

    if (this.getField(path) == null) this.registerField(path);

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
    const diff = Reconcile.arrayDiff(
      this._issues,
      result.issues ?? [],
      Reconcile.deepEqual,
    );
    diff.added.forEach((issue) => this._issues.push(issue));

    this.setValidating(false);
  }

  createSubmitHandler<
    TEvent extends FormController.PreventableEvent | null | undefined,
  >(
    onSuccess?: FormController.SubmitSuccessHandler<TOutput, TEvent>,
    onError?: FormController.SubmitErrorHandler<TEvent>,
  ) {
    return async (event: TEvent) => {
      if (event != null) {
        event.preventDefault();
      }

      if (this._isValidating) return;
      if (this._isSubmitting) return;

      this._triedSubmitting = true;

      await this.validateForm();

      if (this._issues.length === 0) {
        this.setSubmitting(true);
        await onSuccess?.(this._data as TOutput, event);
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
      await onError?.(this._issues, event);
      this.setSubmitting(false);
    };
  }
}

// TODO: Move to a proper test file
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
