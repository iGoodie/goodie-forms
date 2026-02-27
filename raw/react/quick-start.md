# Quick Start

> Get started with headless Goodie Forms React.

<steps>

### Install Dependencies

1. Install Goodie Forms

<code-group>

```bash [pnpm]
pnpm i @goodie-forms/core @goodie-forms/react
```

```bash [npm]
npm i @goodie-forms/core @goodie-forms/react --save-dependency
```

```bash [yarn]
yarn add @goodie-forms/core @goodie-forms/react
```

</code-group>

1. Install a Validation Library *(totally optional)* [See supported libs](https://standardschema.dev/schema#what-schema-libraries-implement-the-spec)

<code-group>

```bash [pnpm]
pnpm i zod # Or any other validation lib
```

```bash [npm]
npm i zod --save-dependency # Or any other validation lib
```

```bash [yarn]
yarn add zod # Or any other validation lib
```

</code-group>

### Create your Validation Schema

```ts
const LoginFormSchema = z.object({
  email: z.email(),
  password: z.string().nonempty(),
});
```

### Create form with `useForm` hook

```tsx
const form = useForm(
  {
    validationSchema: LoginFormSchema,
  },
  {
    validateMode: "onChange",
    revalidateMode: "onChange",
  },
);
```

### Render Fields with `FieldRenderer` component

```tsx
<FieldRenderer
  form={form}
  path={form.path.of("email")}
  defaultValue={""}
  render={({ fieldProps, field, form }) => (
    <div>
      <label htmlFor="email">E-mail</label>

      <input
        {...fieldProps}
        id="email"
        type="email"
        disabled={form.controller.isSubmitting}
      />

      {field.issues && <span>{field.issues.at(0)?.message}</span>}
    </div>
  )}
/>;
```

### Create submission handler

```tsx
<form
  onSubmit={form.controller.createSubmitHandler(
    async (data) => {
      console.log("Logging in with", data);
      await api.login(data);
    },
    async (issues) => {
      console.log("Form has issues:", issues);
    },
  )}
>
  ...
</form>;
```

### Combine them all

```tsx
import { useForm, FieldRenderer } from "@goodie-forms/react";
import z from "zod";

const LoginFormSchema = z.object({
  email: z.email(),
  password: z.string().nonempty(),
});

export function App() {
  const form = useForm(
    {
      validationSchema: LoginFormSchema,
    },
    {
      validateMode: "onChange",
      revalidateMode: "onChange",
    },
  );

  const handleSubmit = form.controller.createSubmitHandler(
    async (data) => {
      console.log("Logging in with", data);
      await api.login(data);
    },
    async (issues) => {
      console.log("Form has issues:", issues);
    },
  );

  return (
    <main>
      <form onSubmit={handleSubmit}>
        <FieldRenderer
          form={form}
          path={form.path.of("email")}
          defaultValue={""}
          render={({ fieldProps, field, form }) => (
            <div>
              <label htmlFor="email">E-mail</label>
              <input
                {...fieldProps}
                id="email"
                type="email"
                disabled={form.controller.isSubmitting}
              />
              {field.issues && <span>{field.issues.at(0)?.message}</span>}
            </div>
          )}
        />

        <FieldRenderer
          form={form}
          path={form.path.of("password")}
          defaultValue={""}
          render={({ fieldProps, field, form }) => (
            <div>
              <label htmlFor="password">Password</label>
              <input
                {...fieldProps}
                id="password"
                type="password"
                disabled={form.controller.isSubmitting}
              />
              {field.issues && <span>{field.issues.at(0)?.message}</span>}
            </div>
          )}
        />

        <button type="submit">Login</button>
      </form>
    </main>
  );
}
```

</steps>
