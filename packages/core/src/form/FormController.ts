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
  _issues: readonly StandardSchemaV1.Issue[] = [];

  get isDirty() {
    for (const fieldState of this._fields.values()) {
      if (fieldState.isDirty) return true;
    }
    return false;
  }

  constructor(
    public readonly config: {
      initialData?: DeepPartial<TShape>;
      validationSchema?: StandardSchemaV1<TShape, TShape>;
    },
  ) {
    this._initialData = config.initialData ?? ({} as DeepPartial<TShape>);
    this._data = deepClone(this._initialData);

    if (config.initialData != null) {
    } else {
      this._data = {} as TShape;
    }
  }

  bindField<TPath extends Field.Paths<TShape>>(
    path: TPath,
    defaultValue?: Field.GetValue<TShape, TPath>,
  ) {
    const fieldState = new FieldState(this, path);
    this._fields.set(path, fieldState);

    if (defaultValue != null) {
      Field.setValue<TShape, TPath>(
        this._initialData as TShape,
        path,
        defaultValue,
      );
      Field.setValue<TShape, TPath>(this._data as TShape, path, defaultValue);
    }

    const issues = this._issues.filter((issue) => {
      if (issue.path == null) return false;
      const issuePath = issue.path.join(".");
      return issuePath === path;
    });

    fieldState.setIssues(issues);
  }

  unbindField(path: Field.Paths<TShape>) {
    this._fields.delete(path);
  }

  reset() {
    this._data = deepClone(this.config.initialData as any);

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
    const fieldState = this._fields.get(path);

    if (fieldState == null && config?.bindIfMissing) {
      this.bindField(path);
      return this.getFieldState(path);
    }

    return fieldState;
  }

  async triggerValidation() {
    if (this.config.validationSchema == null) return;

    const result = await this.config.validationSchema["~standard"].validate(
      this._data,
    );

    if ("value" in result) {
      this._issues = [];
    } else {
      this._issues = result.issues;
    }

    this._fields.forEach((fieldState, fieldPath) => {
      const issues = this._issues.filter((issue) => {
        if (issue.path == null) return false;
        const issueFieldPath = issue.path.join(".");
        return issueFieldPath === fieldPath;
      });
      fieldState.setIssues(issues);
    });
  }
}
