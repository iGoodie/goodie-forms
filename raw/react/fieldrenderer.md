# <FieldRenderer/>

> Reference for the <FieldRenderer/> component

## Overview

```ts
export interface RenderParams<TOutput extends object, TValue> {
  fieldProps: {
    ref: Ref<any | null>;

    name: string;

    value: DeepReadonly<TValue> | undefined;

    onChange: (event: ChangeEvent<EventTarget> | TValue) => void;
    onFocus: () => void;
    onBlur: () => void;
  };

  field: FormField<TOutput, TValue>;

  form: UseForm<TOutput>;
}
```

```ts
export interface FieldRendererProps<
  TOutput extends object,
  TPath extends FieldPath.Segments,
> {
  form: UseForm<TOutput>;
  path: TPath;
  defaultValue?: Suppliable<FieldPath.Resolve<TOutput, TPath>>;
  overrideInitialValue?: boolean;
  unregisterOnUnmount?: boolean;
  render: (
    params: RenderParams<TOutput, FieldPath.Resolve<TOutput, TPath>>,
  ) => ReactNode;
}
```

```tsx
export function FieldRenderer<
  TOutput extends object,
  const TPath extends FieldPath.Segments,
>(props: FieldRendererProps<TOutput, TPath>);
```

<doc-tree>
<doc-tree-item title="TOutput">

represents the final validated shape of your form data. It defines the full object structure that the form is expected to produce after successful validation and submission.

</doc-tree-item>

<doc-tree-item title="TPath">

represents the strongly-typed path (as segment tuples) pointing to a specific leaf inside `TOutput`.

</doc-tree-item>
</doc-tree>

`FieldRenderer` is the *React* **field binding layer** of *Goodie Forms*.

It connects a **single field** (*resolved via a strongly-typed path*) to **your UI** — *without introducing implicit magic, hidden state, or uncontrolled behavior.*`FieldRenderer` does these:

- **Registers** a field inside the `FormController`
- **Resolves** its type directly from `TOutput` and `TPath`
- **Subscribes** only to that **field's mutations**
- **Delegates** rendering **entirely** to your `render` function
- Keeps everything **fully type-safe**

It is intentionally minimal.

- You **own the UI**.
- You **control when it mounts**.
- You **decide how it renders**.

## Component Props

<field-group>
<field name="form!" type="UseForm<TOutput>">

The form controller instance returned by `useForm()`. This is required to access the form's internal state and methods for the specified field.

</field>

<field name="path!" type="FieldPath.Segments">

The field path to the specific field within the form's data structure.

</field>

<field name="defaultValue?:" type="Suppliable<FieldPath.Resolve<TOutput, TPath>>">

The default value to be used for the field if no initial value is set.

</field>

<field name="overrideInitialValue?:" type="boolean">

Whether to override any initial value that was set on the form controller, if `defaultValue` was used to set the field's initial value.

</field>

<field name="unregisterOnUnmount?:" type="boolean">

Whether to `form.controller.unregisterField()` the field from the form controller when it is unmounted.

</field>

<field name="render?:" type="(params: RenderParams<TOutput, FieldPath.Resolve<TOutput, TPath>>) => ReactNode">

The render function that will be called to render the field UI.

</field>
</field-group>

---

## Render Delegate

<doc-ref-section>

`FieldRenderer` **does not render** anything by itself.

Instead, it **delegates rendering** entirely to your `render` function.

This keeps the library **headless** and lets you decide **how your UI should behave**.

```tsx
<FieldRenderer
  form={form}
  path={form.path.of("name")}
  defaultValue="foo"
  render={({ fieldProps, field, form }) => (
    <input
      {...fieldProps}
      disabled={form.controller.isSubmitting}
      type="text"
      placeholder="John"
      className={field.issues.length !== 0 ? "text-red-500" : "text-green-500"}
    />
  )}
/>;
```

### 💭 Why a Render Function?

This pattern ensures:

- ❌ **No implicit** prop injection
- ❌ **No hidden** wrapping components
- ❌ **No opinionated** input abstraction
- **Full compatibility** with any design system

You are **not** forced into:

- **Controlled-only inputs**
- **Specific UI libraries**
- **Special wrapper components**

Instead, you **explicitly** decide how the **field integrates with your UI**.

### 💭 Rendering Strategies

If you want the **fastest** integration → use `fieldProps`.

```tsx
<FieldRenderer
  form={form}
  path={form.path.of("email")}
  render={({ fieldProps }) => (
    <input {...fieldProps} type="email" placeholder="john@example.com" />
  )}
/>;
```

If you want **maximum control** → ignore destructuring `fieldProps` and wire everything from `field`.

```tsx
<FieldRenderer
  form={form}
  path={form.path.of("age")}
  render={({ field }) => (
    <input
      type="number"
      value={field.value ?? ""}
      onChange={(e) => {
        const parsed = Number(e.target.value);
        field.setValue(Number.isNaN(parsed) ? undefined : parsed);
      }}
      onFocus={() => field.touch()}
      onBlur={() => field.validate()}
    />
  )}
/>;
```

If you want a **hybrid approach** → mix `fieldProps` and `field` as desired.

```tsx
<FieldRenderer
  form={form}
  path={form.path.of("tags")}
  defaultValue={() => []}
  render={({ fieldProps, field }) => (
    <div {...fieldProps}>
      <ul>
        {fieldProps.value.map((tag: string, index: number) => (
          <li key={index}>{tag}</li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => {
          field.modifyValue((value) => {
            value?.push(`tag-${current.length + 1}`);
          });
        }}
      >
        Add Tag
      </button>
    </div>
  )}
/>;
```

Since `FieldRenderer` **fully delegates** rendering to your `render` function, you are free to **use any component** without **constraints**.

```tsx
<FieldRenderer
  form={form}
  path={form.path.of("country")}
  render={({ field }) => (
    <CustomSelect
      selected={field.value}
      options={countryOptions}
      onSelect={(option) => field.setValue(option.code)}
      onClose={() => field.touch()}
    />
  )}
/>;
```

All those approaches above are **first-class citizens**.

`FieldRenderer` simply bridges a single field's **event stream** into **React** — *nothing more.*

</doc-ref-section>

## Behavior

<doc-ref-section>

`FieldRenderer` is intentionally small.

- ❌ It **does not** introduce **hidden state**.
- ❌ It **does not wrap your input**.
- ❌ It **does not own your UI**.
- It **simply connects** a single `FormField` instance to **React** — *and gets out of the way.*

### 🧠 1. Resolves & Registers the Field

<doc-ref-section>

It calls `useFormField()` internally.

```tsx
useFormField(form, path, { defaultValue, overrideInitialValue });
```

This **allows** the `FieldRenderer` to:

- Resolve the **field** using the **strongly-typed path**
- **Register** it inside the `FormController`
- Apply `defaultValue` if **needed**
- **Optionally** override **initial data** (controlled by `overrideInitialValue`)

No **extra abstraction** layer is created.
You are **interacting** with the **real** `FormField` instance.

</doc-ref-section>

### 🧠 2. Binds the DOM Element (Explicitly)

<doc-ref-section>

A `ref` is **created** and **passed** via `fieldProps.ref`.

```tsx
field.bindElement(elementRef.current!);
```

This **allows** the **controller** to:

- **Associate** the **field** with a **specific DOM element**
- **Auto-focus** on correct **DOM element** on **form submission**

**Nothing** is auto-detected.
**Nothing** is queried from **the DOM**.
**Binding** is **explicit** and **lifecycle-aware**.

</doc-ref-section>

### 🧠 3. Provides a Minimal `fieldProps` Adapter

<doc-ref-section>

`fieldProps` is a **very thin adapter** — **nothing more**. It exposes:

- `name`, which is `field.stringPath`
- `value`, which is `field.value`
- `ref`, which is the **React ref** bound to the **underlying DOM element** via `field.bindElement(...)`
- `onChange`, which forwards the **<** to `field.setValue(...)` and **marks** the field as **touched** and **dirty**
- `onFocus`, which calls `field.touch()`
- `onBlur`, which **conditionally triggers** field **validation** based on the **active validation mode** (respecting `form.hookConfigs`)

<note>

If you need **transformation logic**, use `field` **directly** instead.
**Validation** will still **run automatically** once the **field value changes**.

```tsx
<FieldRenderer
  form={form}
  path={form.path.of("age")}
  render={({ field }) => (
    <input
      type="number"
      value={field.value ?? ""}
      onChange={(e) => {
        const parsed = Number(e.target.value);

        field.setValue(Number.isNaN(parsed) ? undefined : parsed);
        // ^ it'll still trigger validation
      }}
      onBlur={() => field.markAsTouched()}
    />
  )}
/>;
```

</note>
</doc-ref-section>

### 🧠 4. Validation Behavior (Respecting Modes)

<doc-ref-section>

**Validation** is **triggered** based on:

- `validateMode`
- `revalidateMode`
- Whether the form has attempted submission

On blur:

```tsx
if (
  field.issues.length !== 0 ||
  currentValidateMode === "onBlur" ||
  currentValidateMode === "onChange"
) {
  controller.validateField(path);
}
```

On value change (via **controller events**):

- It **listens** to `"fieldValueChanged"`
- Checks whether **the change affects** this **field** or its **descendants**
- **Triggers validation** only when **appropriate**

This means:

- ❌ **No global re-renders**
- ❌ **No blanket revalidation**
- Only **scoped field-level validation**

</doc-ref-section>

### 🧠 5. Scoped React Subscription

<doc-ref-section>

The **component subscribes** only to **relevant controller events**.

- ❌ Does not **subscribe** the **entire form**
- ❌ Does not **trigger** parent **re-renders**
- ❌ Does not **depend** on **React context reactivity**

It **reacts strictly** to **mutations** that affect:

- **This field**
- Or **its descendants** *(for nested structures)*

</doc-ref-section>

### 🧠 6. Optional Cleanup

<doc-ref-section>

On **unmount**:

```ts
if (unregisterOnUnmount) {
  controller.unregisterField(path);
}
```

By default, fields are **not destroyed**.This **enables**:

- **Multi-step forms**
- **Tabbed layouts**
- **Conditionally mounted sections**
- **Virtualized field lists**

**State persists** unless you **explicitly opt out**.

</doc-ref-section>
</doc-ref-section>

## Examples

<doc-ref-section>

### 📚 Basic Text Field

<doc-ref-section>

A minimal text input with submission-aware disabling.

```tsx
<FieldRenderer
  form={form}
  path={form.path.of("name")}
  render={({ fieldProps, form }) => (
    <input
      {...fieldProps}
      type="text"
      placeholder="John Doe"
      disabled={form.controller.isSubmitting}
    />
  )}
/>;
```

</doc-ref-section>

### 📚 Checkbox Field (Boolean)

<doc-ref-section>

Direct value binding for boolean fields.

```tsx
<FieldRenderer
  form={form}
  path={form.path.of("acceptTerms")}
  defaultValue={false}
  render={({ field }) => (
    <label>
      <input
        type="checkbox"
        checked={!!field.value}
        onChange={(e) => field.setValue(e.target.checked)}
        onFocus={() => field.touch()}
      />
      I agree to the terms
    </label>
  )}
/>;
```

</doc-ref-section>

### 📚 Dynamic Tag List (Array Field)

<doc-ref-section>

Hybrid approach using structural mutation.

```tsx
<FieldRenderer
  form={form}
  path={form.path.of("tags")}
  defaultValue={() => []}
  render={({ fieldProps, field }) => (
    <div {...fieldProps}>
      <ul>
        {fieldProps.value.map((tag: string, index: number) => (
          <li key={index}>{tag}</li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => {
          field.modifyValue((value) => {
            value?.push(`tag-${current.length + 1}`);
          });
        }}
      >
        Add Tag
      </button>
    </div>
  )}
/>;
```

</doc-ref-section>

### 📚 Slider with Derived Display

<doc-ref-section>

A non-text input with derived UI.

```tsx
<FieldRenderer
  form={form}
  path={form.path.of("volume")}
  defaultValue={50}
  render={({ fieldProps }) => (
    <div>
      <input
        {...fieldProps}
        type="range"
        min={0}
        max={100}
        value={fieldProps.value ?? 0}
        onChange={(e) => fieldProps.onChange(Number(e.target.value))}
      />
      <span>{fieldProps.value ?? 0}%</span>
    </div>
  )}
/>;
```

</doc-ref-section>

### 📚 Conditionally Derived Field

<doc-ref-section>

Updating a field based on another field’s value.

```tsx
function SlugField() {
  const title = form.watchValues((v) => v.title);

  return (
    <FieldRenderer
      form={form}
      path={form.path.of("slug")}
      render={({ field }) => (
        <input
          value={field.value ?? ""}
          onChange={(e) =>
            field.setValue(e.target.value.toLowerCase().replace(/\s+/g, "-"))
          }
          placeholder={
            title
              ? title.toLowerCase().replace(/\s+/g, "-")
              : "auto-generated-slug"
          }
        />
      )}
    />
  );
}
```

</doc-ref-section>
</doc-ref-section>
