import { FieldRenderer, UseForm, useForm } from "@goodie-forms/react";
import { render, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

interface FormData {
  name: string;
  email: string;
}

function TestComponent(props: {
  form: UseForm<FormData>;
  shouldUnregister?: boolean;
}) {
  const { form } = props;

  return (
    <FieldRenderer
      form={form}
      path={form.path.of("name")}
      defaultValue={"John"}
      unregisterOnUnmount={props.shouldUnregister}
      render={({ fieldProps }) => (
        <input {...fieldProps} data-testid="name-input" />
      )}
    />
  );
}

describe("<FieldRenderer /> component", () => {
  it("should unregister the field on unmount when unregisterOnUnmount is true", () => {
    const { result: form } = renderHook(() => useForm<FormData>({}));

    const { unmount } = render(
      <TestComponent form={form.current} shouldUnregister />,
    );
    // ^ Mounted, field should be registered

    const getField = () =>
      form.current.controller.getField(form.current.path.of("name"));

    expect(getField()).toBeDefined();

    unmount();
    // ^ Unmounted, field should be unregistered

    expect(getField()).toBeUndefined();
  });

  it("should NOT unregister the field on unmount when unregisterOnUnmount is false", () => {
    const { result: form } = renderHook(() => useForm<FormData>({}));

    const { unmount } = render(<TestComponent form={form.current} />);
    // ^ Mounted, field should be registered

    const getField = () =>
      form.current.controller.getField(form.current.path.of("name"));

    expect(getField()).toBeDefined();

    unmount();
    // ^ Unmounted, field should not be unregistered

    expect(getField()).toBeDefined();
  });
});
