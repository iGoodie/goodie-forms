import { describe, expect, it, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, useFormField, FieldRenderer } from "@goodie-forms/react";
import { useRef } from "react";

function TestComponent() {
  type FormData = {
    name: string;
    email: string;
  };

  const form = useForm<FormData>({});

  const renderRef = useRef(0);

  const nameField = useFormField(form, form.path.of("name"));

  document.documentElement.dataset.fieldValue = nameField?.value;
  document.documentElement.dataset.renderCount =
    (renderRef.current++).toString();

  return (
    <FieldRenderer
      form={form}
      path={form.path.of("name")}
      defaultValue={"John"}
      render={({ fieldProps }) => (
        <input {...fieldProps} data-testid="name-input" />
      )}
    />
  );
}

describe("useFormField", () => {
  it("should re-render when the field value changes with user input", async () => {
    const user = userEvent.setup();

    render(<TestComponent />);
    // ^ Render 0; mounted with value undefined
    // ^ Render 1; defaultValue applied, value changed to "John

    expect(document.documentElement.dataset.renderCount).toBe("1");
    expect(document.documentElement.dataset.fieldValue).toBe("John");

    const input = screen.getByTestId<HTMLInputElement>("name-input");

    await user.clear(input);
    // ^ Render 2; "clear" clicks internally isTouched set to true
    // ^ Render 3; value changed to ""

    expect(document.documentElement.dataset.renderCount).toBe("3");
    expect(document.documentElement.dataset.fieldValue).toBe("");

    await user.click(input);
    await user.paste("Jane");
    // ^ Render 4; value changed to "Jane"

    expect(input.value).toBe("Jane");
    expect(document.documentElement.dataset.renderCount).toBe("4");
    expect(document.documentElement.dataset.fieldValue).toBe("Jane");

    await user.clear(input);
    // ^ Render 5; value changed to ""

    expect(document.documentElement.dataset.renderCount).toBe("5");
    expect(document.documentElement.dataset.fieldValue).toBe("");
  });
});
