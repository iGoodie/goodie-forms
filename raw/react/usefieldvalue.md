# useFieldValue()

> Reference for the useFieldValue() hook

## Overview

```ts
export function useFieldValue<
  TOutput extends object,
  TPath extends FieldPath.Segments,
>(
  form: UseForm<TOutput>,
  path: TPath,
): DeepReadonly<FieldPath.Resolve<TOutput, TPath>> | undefined;
```

<doc-tree>
<doc-tree-item title="TOutput">

represents the final validated shape of your form data. It defines the full object structure that the form is expected to produce after successful validation and submission.

</doc-tree-item>

<doc-tree-item title="TPath">

represents the strongly-typed path (as segment tuples) pointing to a specific leaf inside `TOutput`.

</doc-tree-item>
</doc-tree>

`useFormValue()` is a **React hook** that allows you to access the **current value** of a **specific form field** within **your components**.

It will only **re-render** the component when the **specific field's value** changes, making it an **efficient** way to bind to form field values **without** causing **unnecessary re-renders** from other parts of the form.

## Configurations

<field-group>
<field name="form!" type="UseForm<TOutput>">

The form controller instance returned by `useForm()`. This is required to access the form's internal state and methods for the specified field.

</field>

<field name="path!" type="FieldPath.Segments">

The field path to the specific field within the form's data structure.

</field>
</field-group>

## Type Reference

Returns the current value of the specified field, or `undefined` if the field is **not found** in the form controller.

```ts
DeepReadonly<FieldPath.Resolve<TOutput, TPath>> | undefined;
```

## Examples

### 📚 Basic Usage

<doc-ref-section>

```tsx
import { useForm, useFieldValue } from "@goodie-forms/react";

function EmailDisplay(props: { form: UseForm<any> }) {
  const emailValue = useFieldValue(
    props.form,
    props.form.path.of("user.email"),
  );

  return <div>Email: {emailValue ?? "N/A"}</div>;
}
```

</doc-ref-section>

### 📚 Conditional Rendering (Dynamic Forms)

<doc-ref-section>

```tsx
import { useForm, useFieldValue } from "@goodie-forms/react";

interface FormData {
  showDetails: boolean;
  // other fields...
}

function ConditionalField(props: { form: UseForm<FormData> }) {
  const showDetails = useFieldValue(
    props.form,
    props.form.path.of("showDetails"),
  );

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={!!showDetails}
          onChange={(e) =>
            props.form.setValue(
              props.form.path.of("showDetails"),
              e.target.checked,
            )
          }
        />
        Show Details
      </label>

      {showDetails && (
        <div>
          {/* Additional fields or information to show when "Show Details" is checked */}
          <p>Here are the details...</p>
        </div>
      )}
    </div>
  );
}
```

</doc-ref-section>

### 📚 Derived UI (Reactive Display)

<doc-ref-section>

```tsx
import { useForm, useFieldValue } from "@goodie-forms/react";

function PasswordStrengthIndicator(props: { form: UseForm<any> }) {
  const password = useFieldValue(
    props.form,
    props.form.path.of("user.password"),
  );

  const strength =
    password && password.length > 8 ? "Strong" : password ? "Weak" : "N/A";

  return <div>Password Strength: {strength}</div>;
}
```

</doc-ref-section>

### 📚 Listening to Field Changes (Side Effects)

<doc-ref-section>

```tsx
interface FormData {
  user: {
    email: string;
  };
}

function useAutoSave(props: { form: UseForm<FormData> }) {
  const emailValue = useFieldValue(
    props.form,
    props.form.path.of("user.email"),
  );

  React.useEffect(() => {
    if (emailValue) {
      console.log("Email changed:", emailValue);
      beacon.send("form_email_changed", { email: emailValue });
    }
  }, [emailValue]);

  return null;
}
```

</doc-ref-section>
