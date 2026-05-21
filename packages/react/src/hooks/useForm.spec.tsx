import { customValidation } from "@goodie-forms/core";
import { FieldRenderer, useForm, UseForm } from "@goodie-forms/react";
import { render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactNode, useState } from "react";
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

  document.documentElement.dataset.formValues = JSON.stringify(formValues);

  return (
    <main>
      <h1>Main App</h1>

      <button data-testid="show-modal-button" onClick={() => setOpen(true)}>
        Show Modal
      </button>

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
  it("should trigger re-render on watchValues once a field is registered with defaultValue via FieldRenderer", async () => {
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

    let fieldsRegistered = 0;
    let valuesChanged = 0;

    form.current.controller.events.on(
      "fieldRegistered",
      () => fieldsRegistered++,
    );
    form.current.controller.events.on(
      "fieldValueChanged",
      () => valuesChanged++,
    );

    const rehydrateValues = () =>
      JSON.parse(
        document.documentElement.dataset.formValues as string,
      ) as Partial<FormData>;

    render(<TestComponent form={form.current} />);
    // ^ Render 0; mounted with value {}

    expect(rehydrateValues()).toEqual({});
    expect(fieldsRegistered).toBe(0);
    expect(valuesChanged).toBe(0);

    user.click(screen.getByTestId<HTMLButtonElement>("show-modal-button"));
    // ^ Render 1; "connectionType" field registered with defaultValue "WIFI", value changed to { connectionType: "WIFI" }
    // ^ Render 2; "connectionType" made the fragment render, causing 3 more fields to be registered with their defaultValues

    await waitFor(() => {
      expect(screen.getByTestId("connection-type-input")).toBeDefined();
    });

    const connectionTypeSelect = screen.getByTestId<HTMLSelectElement>(
      "connection-type-input",
    );
    const wifiSsidInput =
      screen.getByTestId<HTMLInputElement>("wifi-ssid-input");
    const wifiPasswordInput = screen.getByTestId<HTMLInputElement>(
      "wifi-password-input",
    );

    expect(fieldsRegistered).toBe(4);
    expect(valuesChanged).toBe(4);
    expect(connectionTypeSelect.value).toBe("WIFI");
    expect(wifiSsidInput.disabled).toBe(true);
    expect(wifiPasswordInput.disabled).toBe(true);
    expect(rehydrateValues()).toEqual({
      connectionType: "WIFI",
      requiresAuthentication: false,
      wifiSsid: "",
      wifiPassword: "",
    });
  });
});
