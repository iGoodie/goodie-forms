# FormField.ts

> Reference for the FormField class

## Overview

```ts
export class FormField<TOutput extends object, TValue>
```

<doc-tree>
<doc-tree-item title="TOutput">

represents the final validated shape of your form data. It defines the full object structure that the form is expected to produce after successful validation and submission.

</doc-tree-item>

<doc-tree-item title="TValue">

represents the type of the value stored in this specific field. It corresponds to the leaf value at the given `path` within `TOutput`, allowing type-safe access, updates, and validation for this field.

</doc-tree-item>
</doc-tree>

`FormField<TOutput, TValue>` is a single, type-safe form field connected to a `FormController`. It encapsulates the field’s value, validation state, and UI binding while keeping the controller’s data in sync.

Key responsibilities include:

- Exposing the **current**, **initial**, and **default value** of the field
- Tracking `touched` and `dirty` states independently
- Accessing validation **issues** specific to the field
- **Binding/unbinding** to a DOM element for focus management and scroll behavior
- **Modifying**, **resetting**, or **validating** its value in a controlled manner
- Emitting fine-grained events that propagate through the parent form

In essence, `FormField` provides a reactive, self-contained interface for one form value while remaining fully integrated with `FormController`, enabling predictable and granular form management.

---

## Fields

### 📘 `this.controller`

<doc-ref-section>

```ts
controller: FormController<TOutput>;
```

<doc-tree>
<doc-tree-item title="TOutput*">

from `FormField`'s generics (See [#Overview](#overview))

</doc-tree-item>
</doc-tree>

Returns the parent `FormController` instance that this field is registered to, allowing access to shared form state, methods, and events.

</doc-ref-section>

### 📘 `this.path`

<doc-ref-section>

```ts
path: FieldPath.Segments;
```

Returns the path segments that identify this field within the form's data structure. This path is used for value access, updates, and validation.

</doc-ref-section>

### 📘 `this.stringPath`

<doc-ref-section>

```ts
stringPath: string;
```

Returns the string representation of the field's path, typically in dot notation
(e.g. `"user.address.street"`).

</doc-ref-section>

### 📘 `this.value`

<doc-ref-section>

```ts
value: TValue;
```

<doc-tree>
<doc-tree-item title="TOutput*">

from `FormField`'s generics (See [#Overview](#overview))

</doc-tree-item>
</doc-tree>

Returns the current value of the field, which may be modified through user input or programmatically via `setValue` or `modifyValue`.

</doc-ref-section>

### 📘 `this.initialValue`

<doc-ref-section>

```ts
initialValue: TValue;
```

Returns the initial value of the field as determined at registration time. This value is used for resetting the field and determining dirty state.

</doc-ref-section>

### 📘 `this.boundElement`

<doc-ref-section>

```ts
boundElement: HTMLElement | null;
```

Returns the currently bound DOM element for this field, if any. This element is used for focus management and scroll behavior during validation.

</doc-ref-section>

### 📘 `this.issues`

<doc-ref-section>

```ts
issues: readonly StandardSchemaV1.Issue[];
```

Returns an immutable list of current issues. (See [Validation](/core/validation) page)

</doc-ref-section>

### 📘 `this.isTouched`

<doc-ref-section>

```ts
isTouched: boolean;
```

Returns whether the field has been touched (focused and blurred) by the user.

</doc-ref-section>

### 📘 `this.isDirty`

<doc-ref-section>

```ts
isDirty: boolean;
```

Returns whether the field's current value differs from its initial value.

</doc-ref-section>

### 📘 `this.isValid`

<doc-ref-section>

```ts
isValid: boolean;
```

Returns whether the field currently has no validation issues.

</doc-ref-section>

## Methods

### 📙 `bindElement()`

<doc-ref-section>

```ts
declare function bindElement(el: HTMLElement | undefined): void;
```

Binds a DOM element to this field for focus management and scroll behavior during validation.

Passing `undefined` will unbind the element.

#### Arguments

<field-group>
<field name="el!" type="HTMLElement | undefined">

The DOM element to bind to this field.

</field>
</field-group>

#### Examples

```ts
field.bindElement(document.getElementById("my-input")!);
field.bindElement(undefined); // unbind
```

</doc-ref-section>

### 📙 `unbindElement()`

<doc-ref-section>

```ts
declare function unbindElement(): void;
```

Unbinds any currently bound DOM element from this field.

Is a convenience method equivalent to [`bindElement(undefined)`](#bindelement).

</doc-ref-section>

### 📙 `clearIssues()`

<doc-ref-section>

```ts
declare function clearIssues(): void;
```

Clears all validation issues associated with this field.

</doc-ref-section>

### 📙 `setValue()`

<doc-ref-section>

```ts
declare function setValue(
  value: TValue,
  opts?: {
    shouldTouch?: boolean;
    shouldMarkDirty?: boolean;
  },
): void;
```

Sets the field's value to the provided `value`, with optional flags to mark the field as touched or dirty.

#### Arguments

<field-group>
<field name="value!" type="TValue">

The value to set for this field.

</field>

<field name="opts.shouldTouch?" type="boolean">

If `true`, marks the field as touched. By default it is `true`, meaning the field will be marked as touched.

</field>

<field name="opts.shouldMarkDirty?" type="boolean">

If `true`, marks the field as dirty. By default it is `true`, meaning the field will be marked as dirty if the new value differs from the initial value.

</field>
</field-group>

#### Examples

```ts
field.setValue("new value");
field.setValue("new value", { shouldTouch: false });
field.setValue("new value", { shouldMarkDirty: false });
```

</doc-ref-section>

### 📙 `modifyValue()`

<doc-ref-section>

```ts
declare function modifyData(
  draftConsumer: (draft: Draft<typeof this.controller.data>) => void,
  opts?: {
    shouldTouch?: boolean;
    shouldMarkDirty?: boolean;
  },
): void;
```

Allows modifying the field's value using an [Immer](https://immerjs.github.io/immer/) draft of the form's data, with optional flags to mark the field as touched or dirty.

#### Arguments

<field-group>
<field name="draftConsumer!" type="(draft: Draft<typeof this.controller.data>) => void">

The function that receives the draft of the form's data to modify.

</field>

<field name="opts.shouldTouch?" type="boolean">

If `true`, marks the field as touched. By default it is `true`, meaning the field will be marked as touched.

</field>

<field name="opts.shouldMarkDirty?" type="boolean">

If `true`, marks the field as dirty. By default it is `true`, meaning the field will be marked as dirty if the new value differs from the initial value.

</field>
</field-group>

#### Examples

```ts
field.modifyData((data) => {
  data.user.name = "new name";
});
```

```ts
field.modifyData((data) => {
  data.tags.push("new tag");
});
```

```ts
field.modifyData((data) => {
  data.items[0].quantity += 1;
});
```

</doc-ref-section>

### 📙 `reset()`

<doc-ref-section>

```ts
declare function reset(): void;
```

Resets the field's value back to its initial value and clears touched/dirty states.

</doc-ref-section>

### 📙 `touch()`

<doc-ref-section>

```ts
declare function touch(): void;
```

Marks the field as touched, indicating that the user has interacted with it.

#### Examples

```ts
const inputEl = document.getElementById("my-input")! as HTMLInputElement;

inputEl.onfocus = (e) => {
  field.touch(); // <-- Marks the field as touched when the input gains focus.
};
```

</doc-ref-section>

### 📙 `markDirty()`

<doc-ref-section>

```ts
declare function markDirty(): void;
```

Marks the field as dirty, indicating that its value has been modified from the initial value.

<warning>

This method forces the field into a dirty state regardless of whether the current value actually differs from the initial value.
Dirty state will still be calculated once `setValue` or `modifyValue` is called, so the field may become not dirty again if the value matches the initial value.
**Use with caution.**

</warning>

#### Examples

```ts
formController.events.on("fieldValueChanged", (fieldPath) => {
  if (fieldPath === "user.email") {
    const field = formController.getField("user.email");
    field.markDirty(); // <-- Forces "user.email" field to be dirty whenever its value changes, regardless of whether it actually differs from the initial value.
  }
});
```

```ts
const inputEl = document.getElementById("my-input")! as HTMLInputElement;

inputEl.onchange = (e) => {
  const value = inputEl.value;
  field.setValue(value);
  field.markDirty(); // <-- Forces dirty state regardless of whether `value` actually differs from the initial value.
};
```

</doc-ref-section>

### 📙 `validate()`

<doc-ref-section>

```ts
declare function validate(): Promise<void>;
```

Triggers validation for this field, causing the controller to re-run validation rules and update issues on this field accordingly.
Equivalent to calling `formController.validateField(this.path)`.

<warning>

This method will only update issues related to this field, not the entire form. Use `FormController.validate()` to validate all fields and update the form's overall validity.

</warning>

#### Returns

```ts
Promise<void>;
```

Resolves once validation completes and issues are updated for this field.

#### Examples

```ts
const inputEl = document.getElementById("my-input")! as HTMLInputElement;

// Validate onBlur
inputEl.onblur = (e) => {
  field.validate(); // <-- Validates the field when the input loses focus.
};

// Validate onChange
formController.events.on("fieldValueChanged", (fieldPath) => {
  const field = formController.getField(fieldPath);
  field.validate(); // <-- Validates the field whenever its value changes.
});
```

```ts
field.validate().then(() => {
  if (field.isValid) {
    console.log("Field is valid!");
  } else {
    console.log("Field has issues:", field.issues);
  }
});
```

</doc-ref-section>

### 📙 `focus()`

<doc-ref-section>

```ts
declare function focus(opts?: {
  shouldTouch?: boolean;
  scrollOptions?: ScrollIntoViewOptions;
}): void;
```

Focuses the currently bound DOM element for this field, if any. This is typically used during validation to scroll to and focus the first invalid field.

#### Arguments

<field-group>
<field name="opts.shouldTouch" type="boolean | undefined">

Whether to also mark the field as touched when focusing it.

</field>

<field name="opts.scrollOptions" type="ScrollIntoViewOptions | undefined">

Options to pass to `Element.scrollIntoView` when focusing the element.

</field>
</field-group>

#### Examples

```ts
const inputEl = document.getElementById("my-input")! as HTMLInputElement;

field.bindElement(inputEl);

field.focus({
  shouldTouch: true,
  scrollOptions: { behavior: "smooth", block: "center" },
});
```

</doc-ref-section>
