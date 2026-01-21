import { StandardSchemaV1 } from "@standard-schema/spec";
import { FieldState } from "../form/FieldState";
import { NativeFormObject } from "../types/NativeForm";
import { deepClone } from "../utils/deep.util";
import { ExtractPaths, setByPath, ValueByPath } from "../utils/path.utils";

export class FormController<TShape extends object = NativeFormObject> {
  _fields = new Map<ExtractPaths<TShape>, FieldState<TShape, any>>();
  _data: TShape;
  _issues: readonly StandardSchemaV1.Issue[] = [];

  constructor(
    public readonly config: {
      initialData: TShape;
      validationSchema?: StandardSchemaV1<TShape, TShape>;
    },
  ) {
    this._data = deepClone(
      config.initialData as any satisfies NativeFormObject,
    );
  }

  registerField<TPath extends ExtractPaths<TShape>>(
    fieldPath: TPath,
    defaultValue?: ValueByPath<TShape, TPath>,
  ) {
    const fieldState = new FieldState(this, fieldPath);
    this._fields.set(fieldPath, fieldState);

    if (defaultValue != null) {
      setByPath(this.config.initialData, fieldPath, defaultValue);
      setByPath(this._data, fieldPath, defaultValue);
    }

    const issues = this._issues.filter((issue) => {
      if (issue.path == null) return false;
      const issueFieldPath = issue.path.join(".");
      return issueFieldPath === fieldPath;
    });

    fieldState.setIssues(issues);
  }

  unregisterField(fieldPath: ExtractPaths<TShape>) {
    this._fields.delete(fieldPath);
  }

  reset() {
    this._data = deepClone(this.config.initialData as any);

    for (const fieldState of this._fields.values()) {
      fieldState.reset();
    }
  }

  getFieldState<TPath extends ExtractPaths<TShape>>(fieldPath: TPath) {
    return this._fields.get(fieldPath) as FieldState<TShape, TPath> | undefined;
  }

  setValue<TPath extends ExtractPaths<TShape>>(
    path: TPath,
    ...args: [...Parameters<FieldState<TShape, TPath>["setValue"]>]
  ) {
    const fieldState = this.getFieldState(path);
    fieldState?.setValue(...args);
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
