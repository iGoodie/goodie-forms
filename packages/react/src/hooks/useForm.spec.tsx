import { customValidation } from "@goodie-forms/core";
import { FieldRenderer, useForm, UseForm } from "@goodie-forms/react";
import { render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { describe, expect, it } from "vitest";

interface FormData {
  connectionType: "WIFI" | "CELLULAR";
  requiresAuthentication: boolean;
  wifiSsid: string;
  wifiPassword: string;
}

function TestModal(props: { renderContent: () => ReactNode }) {
  return createPortal(
    <div className="modal">{props.renderContent()}</div>,
    document.body,
  );
}

function TestComponent(props: { form: UseForm<FormData> }) {
  const { form } = props;

  const [open, setOpen] = useState(false);

  const formValues = form.watchValues();

  // console.log(formValues);

  document.documentElement.dataset.formValues = JSON.stringify(formValues);

  useEffect(() => {
    const id = setTimeout(() => setOpen(true), 0);
    return () => clearTimeout(id);
  }, []);

  return (
    <main>
      <h1>Main App</h1>
      {open && (
        <TestModal
          renderContent={() => (
            <>
              <FieldRenderer
                form={form}
                path={form.path.of("connectionType")}
                defaultValue="WIFI"
                render={({ fieldProps }) => (
                  <select {...fieldProps} data-testid="connection-type-input">
                    <option value="WIFI">WIFI</option>
                    <option value="CELLULAR">CELLULAR</option>
                  </select>
                )}
              />

              {formValues.connectionType === "WIFI" && (
                <>
                  <FieldRenderer
                    form={form}
                    path={form.path.of("requiresAuthentication")}
                    defaultValue={false}
                    render={({ fieldProps }) => (
                      <label>
                        <input
                          {...fieldProps}
                          type="checkbox"
                          value={undefined}
                          checked={fieldProps.value}
                          onChange={(e) =>
                            fieldProps.onChange(e.target.checked)
                          }
                          data-testid="requires-authentication-input"
                        />
                        Requires Authentication
                      </label>
                    )}
                  />

                  <FieldRenderer
                    form={form}
                    path={form.path.of("wifiSsid")}
                    defaultValue={""}
                    render={({ fieldProps }) => (
                      <input
                        {...fieldProps}
                        type="text"
                        disabled={formValues.requiresAuthentication === false}
                        data-testid="wifi-ssid-input"
                      />
                    )}
                  />

                  <FieldRenderer
                    form={form}
                    path={form.path.of("wifiPassword")}
                    defaultValue={""}
                    render={({ fieldProps }) => (
                      <input
                        {...fieldProps}
                        type="password"
                        disabled={formValues.requiresAuthentication === false}
                        data-testid="wifi-password-input"
                      />
                    )}
                  />
                </>
              )}
            </>
          )}
        />
      )}
    </main>
  );
}

describe("useForm() hook", () => {
  it("should trigger re-render on watchValues once a field is registered with defaultValue via FieldRenderer", () => {
    const user = userEvent.setup();

    const { result: form } = renderHook(() =>
      useForm(
        { validationSchema: customValidation<FormData>(() => {}) },
        {
          validateMode: "onSubmit",
          revalidateMode: "onChange",
        },
      ),
    );

    const rehydrateValues = () =>
      JSON.parse(
        document.documentElement.dataset.formValues as string,
      ) as Partial<FormData>;

    const getInput = (testId: string) =>
      screen.getByTestId(testId) as HTMLInputElement | HTMLSelectElement;

    render(<TestComponent form={form.current} />);
    // ^ Render 0; mounted with value {}
    // ^ Render 1; "connectionType" field registered with defaultValue "WIFI", value changed to { connectionType: "WIFI" }
    // ^ Render 2; "connectionType" made the fragment render, causing 3 more fields to be registered with their defaultValues

    // expect(getInput("connection-type-input")).toBeDefined();
    // expect(getInput("connection-type-input").value).toBe("WIFI");
    // expect(getInput("wifi-ssid-input").disabled).toBeTruthy();
    // expect(getInput("wifi-password-input").disabled).toBeTruthy();
    // expect(rehydrateValues()).toEqual({
    //   connectionType: "WIFI",
    //   requiresAuthentication: false,
    //   wifiSsid: "",
    //   wifiPassword: "",
    // });
  });
});
