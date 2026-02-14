import { FieldPath, type FormController } from "@goodie-forms/core";
import { useRenderControl } from "@goodie-forms/react";
import flow from "lodash.flow";
import { useEffect } from "react";

export function FormDebug<TOutput extends object>(props: {
  formController: FormController<TOutput>;
}) {
  const renderControl = useRenderControl();

  useEffect(() => {
    const { events } = props.formController;

    return flow(
      events.on("submissionStatusChange", () => renderControl.forceRerender()),
      events.on("validationStatusChange", () => renderControl.forceRerender()),
      events.on("fieldValueChanged", () => renderControl.forceRerender()),
      events.on("fieldRegistered", () => renderControl.forceRerender()),
      events.on("fieldUnregistered", () => renderControl.forceRerender()),
      events.on("fieldTouchUpdated", () => renderControl.forceRerender()),
      events.on("fieldDirtyUpdated", () => renderControl.forceRerender()),
    );
  }, []);

  return (
    <div className="h-fit col-span-3 grid grid-cols-3 gap-6">
      <span className="text-left underline opacity-60 col-span-full">
        Indicator Render #{renderControl.renderCount}
      </span>

      <div className="text-left flex flex-col gap-3">
        <span className="opacity-60 font-bold">Form data</span>
        <pre className="text-left">
          {JSON.stringify(props.formController._data, null, 2)}
        </pre>
      </div>

      <div className="text-left flex flex-col gap-3">
        <span className="opacity-60 font-bold">Initial data</span>
        <pre className="text-left">
          {JSON.stringify(props.formController._initialData, null, 2)}
        </pre>
      </div>

      <pre className="text-left flex flex-col">
        <span className="opacity-50">Form State</span>
        <span>
          isValidating = {props.formController.isValidating.toString()}
        </span>
        <span>
          isSubmitting = {props.formController.isSubmitting.toString()}
        </span>

        <hr className="my-10" />

        <span className="opacity-50">Registered Fields</span>
        {[...props.formController._fields.values()].map((field, i) => (
          <span key={i}>{field.stringPath}</span>
        ))}

        <hr className="my-10" />

        <span className="opacity-50">Touched Fields</span>
        {[...props.formController._fields.values()]
          .filter((field) => field.isTouched)
          .map((field, i) => (
            <span key={i}>{field.stringPath}</span>
          ))}

        <hr className="my-10" />

        <span className="opacity-50">Dirty Fields</span>
        {[...props.formController._fields.values()]
          .filter((field) => field.isDirty)
          .map((field, i) => (
            <span key={i}>{field.stringPath}</span>
          ))}

        <hr className="my-10" />

        <span className="opacity-50">Errors</span>
        {props.formController._issues.map((issue) => (
          <p
            key={FieldPath.toStringPath(FieldPath.normalize(issue.path))}
            className="inline text-wrap"
          >
            <span className="mr-1">
              {FieldPath.toStringPath(FieldPath.normalize(issue.path))}
            </span>
            <span className="text-xs opacity-30">({issue.message})</span>
          </p>
        ))}
      </pre>
    </div>
  );
}
