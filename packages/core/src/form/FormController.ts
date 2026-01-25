import { StandardSchemaV1 } from "@standard-schema/spec";
import { Field } from "../form/Field";
import { FieldState } from "../form/FieldState";
import { NativeFormObject } from "../types/NativeForm";
import { deepClone } from "../utils/deep.util";
import { DeepPartial } from "../types/DeepPartial";

export namespace Form {
  export type Status = "idle" | "validating" | "submitting";
}

export class FormController<TShape extends object = NativeFormObject> {
  _status: Form.Status = "idle";
  _fields = new Map<Field.Paths<TShape>, FieldState<TShape, any>>();
  _initialData: DeepPartial<TShape>;
  _data: DeepPartial<TShape>;
  _issues: StandardSchemaV1.Issue[] = [];

  validationSchema?: StandardSchemaV1<TShape, TShape>;

  get isDirty() {
    for (const fieldState of this._fields.values()) {
      if (fieldState.isDirty) return true;
    }
    return false;
  }

  get isValid() {
    return this._issues.length === 0;
  }

  constructor(config: {
    initialData?: DeepPartial<TShape>;
    validationSchema?: StandardSchemaV1<TShape, TShape>;
  }) {
    this._initialData = config.initialData ?? ({} as DeepPartial<TShape>);
    this._data = deepClone(this._initialData);

    if (config.initialData != null) {
    } else {
      this._data = {} as TShape;
    }

    this.validationSchema = config.validationSchema;
  }

  bindField<TPath extends Field.Paths<TShape>>(
    path: TPath,
    config?: {
      defaultValue?: Field.GetValue<TShape, TPath>;
      domElement?: HTMLElement;
    },
  ) {
    const fieldState = new FieldState(this, path);
    this._fields.set(path, fieldState);

    if (config?.defaultValue != null) {
      Field.setValue<TShape, TPath>(
        this._initialData as TShape,
        path,
        config.defaultValue,
      );
      Field.setValue<TShape, TPath>(
        this._data as TShape,
        path,
        config.defaultValue,
      );
    }

    if (config?.domElement != null) {
      fieldState.bindElement(config.domElement);
    }

    const issues = this._issues.filter((issue) => {
      if (issue.path == null) return false;
      const issuePath = issue.path.join(".");
      return issuePath === path;
    });

    fieldState.setIssues(issues);

    return fieldState;
  }

  unbindField(path: Field.Paths<TShape>) {
    this._fields.delete(path);
  }

  reset() {
    this._data = deepClone(this._initialData as any);

    for (const fieldState of this._fields.values()) {
      fieldState.resetState();
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
    const fieldState = this._fields.get(path);

    if (fieldState == null && config?.bindIfMissing) {
      this.bindField(path);
      return this.getFieldState(path);
    }

    return fieldState;
  }

  async validateField<TPath extends Field.Paths<TShape>>(path: TPath) {
    // TODO: Support native HTML validation, if no schema is provided
    if (this.validationSchema == null) return;

    const fieldState = this.getFieldState(path, { bindIfMissing: true });

    const result = await this.validationSchema["~standard"].validate(
      this._data,
    );

    this._issues = this._issues.filter((issue) => {
      if (issue.path == null) return true;
      const issuePath = issue.path.join(".");
      return issuePath !== path;
    });

    if ("value" in result) {
      fieldState.setIssues([]);
    } else {
      this._issues.push(...result.issues);
    }
  }

  async validateForm() {
    // TODO: Support native HTML validation, if no schema is provided
    if (this.validationSchema == null) return;

    const result = await this.validationSchema["~standard"].validate(
      this._data,
    );

    if ("value" in result) {
      this._issues = [];
    } else {
      this._issues = [...result.issues];
    }

    this._fields.forEach((fieldState, fieldPath) => {
      const issues = this._issues.filter((issue) => {
        if (issue.path == null) return false;
        const issuePath = issue.path.join(".");
        return issuePath === fieldPath;
      });
      fieldState.setIssues(issues);
    });
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
