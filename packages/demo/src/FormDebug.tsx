import type { FormController } from "@goodie-forms/core";
import flow from "lodash.flow";
import { useEffect } from "react";
import { useRenderControl } from "./hooks/useRenderControl";

export function FormDebug<TShape extends object>(props: {
  formController: FormController<TShape>;
}) {
  const renderControl = useRenderControl();

  useEffect(() => {
    const { events } = props.formController;

    return flow(
      events.on("statusChanged", () => renderControl.forceRerender()),
      events.on("valueChanged", () => renderControl.forceRerender()),
      events.on("fieldBound", () => renderControl.forceRerender()),
      events.on("fieldUnbound", () => renderControl.forceRerender()),
      events.on("fieldStateUpdated", () => renderControl.forceRerender())
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
        <span className="opacity-60 font-bold">Initial/Rollback data</span>
        <pre className="text-left">
          {JSON.stringify(props.formController._initialData, null, 2)}
        </pre>
      </div>

      <pre className="text-left flex flex-col">
        <span className="opacity-50">Fields</span>
        {[...props.formController._fields.values()].map((field, i) => (
          <span key={i}>{field.path}</span>
        ))}

        <hr className="my-10" />

        <span className="opacity-50">Touched Fields</span>
        {[...props.formController._fields.values()]
          .filter((field) => field.isTouched)
          .map((field, i) => (
            <span key={i}>{field.path}</span>
          ))}

        <hr className="my-10" />

        <span className="opacity-50">Dirty Fields</span>
        {[...props.formController._fields.values()]
          .filter((field) => field.isDirty)
          .map((field, i) => (
            <span key={i}>{field.path}</span>
          ))}

        <hr className="my-10" />

        <span className="opacity-50">Errors</span>
        {props.formController._issues.map((issue) => (
          <p className="inline text-wrap">
            <span className="mr-1">{issue.path?.join(".")}</span>
            <span className="text-xs opacity-30">({issue.message})</span>
          </p>
        ))}
      </pre>
    </div>
  );
}
