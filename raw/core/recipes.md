# Recipes

> This cookbook covers common form workflows.

## 📚 Basic Form with Schema Validation

<doc-ref-section>

**Goal**: Validate a simple login form and submit safely.

```ts
type LoginForm = {
  email: string;
  password: string;
};

const formController = new FormController<LoginForm>({
  initialData: {
    email: "",
    password: "",
  },
  validationSchema: loginSchema, // StandardSchemaV1
});

const emailField = formController.registerField(form.path.of("email"));

const passwordField = formController.registerField(form.path.of("password"));

const handleSubmit = formController.createSubmitHandler(async (data) => {
  await api.login(data);
});

formEl.onsubmit = handleSubmit;
```

</doc-ref-section>

## 📚 Default Values for Dynamically Mounted Fields

<doc-ref-section>

**Goal**: Provide fallback values when a field appears conditionally.

```ts
const field = formController.registerField(
  formController.path.of("profile.bio"),
  { defaultValue: "Hello there 👋" },
);
```

If `data.profile.bio` is `null | undefined`, it gets initialized.

To also modify `initialData`:

```ts
formController.registerField(formController.path.of("profile.bio"), {
  defaultValue: "Hello there 👋",
  overrideInitialValue: true,
});
```

</doc-ref-section>

## 📚 On-Blur Field Validation

<doc-ref-section>

**Goal**: Validate only the field the user just left.

```ts
const path = formController.path.of("email");

input.onblur = async () => {
  await formController.validateField(path);
};
```

</doc-ref-section>

## 📚 Reset With New Server Data

<doc-ref-section>

**Goal**: Rehydrate form after fetching user data.

```ts
const user = await api.getUser();

formController.reset(user);
```

This:

- Replaces `initialData`
- Recreates data
- Clears issues
- Resets dirty/touched state
- Keeps fields registered

Perfect for edit forms.

</doc-ref-section>

## 📚 Conditional Fields

<doc-ref-section>

**Goal**: Dynamically add/remove fields.

```ts
const addressPath = formController.path.of("address", "street");

if (showAddress) {
  formController.registerField(addressPath);
} else {
  formController.unregisterField(addressPath);
}
```

Data remains intact — only the field abstraction changes.

</doc-ref-section>

## 📚 Disable Submit Button Reactively

<doc-ref-section>

```ts
formController.events.on("submissionStatusChange", (isSubmitting) => {
  submitButton.disabled = isSubmitting;
});
```

Or reflect validation:

```ts
formController.events.on("validationStatusChange", (isValidating) => {
  spinner.visible = isValidating;
});
```

</doc-ref-section>

## 📚 Force Dirty on Change

```ts
formController.events.on("fieldValueChanged", (path, newValue, oldValue) => {
  const field = formController.getField(path);

  if (field != null) {
    // Normally dirtiness is determined by comparing current value to initial value.
    // This forces it to be dirty regardless of that comparison.
    field.markDirty();
  }
});
```
