# Validation

> Validate input data before submitting the form.

Validation in **Goodie Forms** is **completely optional**. If you **don't provide** any **validation strategy**:

- `validateForm()` does **nothing**.
- `validateField()` does **nothing**.
- `controller.issues` will always **remain empty**.

In other words, the **form controller** will **never** produce **validation errors** on its own. **Goodie Forms** does not **assume**, **infer**, or **auto-generate** any **validation rules**.
It stays **silent** unless you **explicitly** define how **validation should work**.

That said, providing a **validation strategy** is **highly encouraged** for maintaining **data integrity** and ensuring that the **submitted data** matches your **expected shape**.

**Goodie Forms** takes a **headless approach** to validation:

- It **does not** enforce any specific validation library.
- It **does not** mutate or transform your data implicitly.
- It **does not** couple validation to UI behavior.

Instead, **validation** is treated as a **pluggable concern**. You define:

- What **valid data** looks like.
- **When validation** runs.
- How **issues** are **produced**.

You can use either:

- A [Standard Schema](https://standardschema.dev/) based approach (recommended for most cases)
- Or a **custom validation** strategy when you need complete control over the logic via `customValidation()`.

**Goodie Forms** simply executes **your strategy** and **stores** the **resulting issues** in `controller.issues`.
Everything else — rendering errors, blocking submission, triggering field validation — is entirely up to you.

---

## Standard Schema Validation

For most applications, **schema-based validation** is the **recommended approach**.

**Goodie Forms** supports [Standard Schema](https://standardschema.dev/) compatible **validators**,
allowing you to **plug in** your **preferred schema library** (See [full list](https://standardschema.dev/schema#what-schema-libraries-implement-the-spec)) while keeping the **core** fully **headless** and **type-safe**. With a **schema**:

- Your **data shape is defined** in one place.
- **Validation rules** live alongside the **structure**.
- **TypeScript** can infer the **final validated output**.
- `validateForm()` and `validateField()` automatically populate `controller.issues` when violations occur.

This approach **works especially well** when:

- You already use a **schema library** in your backend.
- You want a **single source of truth** for **data structure**.
- You need **consistent validation** across **multiple forms**.
- You **prefer declarative validation** over **manual logic**.

**Schema validation** keeps your form **predictable**, **maintainable**, and **aligned** with your **domain model** — *without coupling Goodie Forms to any specific validation library.*

### 📚 Example: `zod` Validation

<card-group>
<card icon="simple-icons:zod" title="Zod Official Docs" to="https://zod.dev/">

Check out the [Zod documentation](https://zod.dev/) for more details on how to define schemas and validation rules.

</card>

<card icon="simple-icons:github" title="Zod GitHub Repository" to="https://github.com/colinhacks/zod">

Check out the [Zod GitHub repository](https://github.com/colinhacks/zod) for source code, issues, and community discussions.

</card>
</card-group>

```ts
import { FormController } from "@goodie-forms/core";
import z from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type Output = z.infer<typeof schema>;

const form = new FormController({
  validationSchema: schema,
  initialData: {
    email: "",
    password: "",
  },
});

const onSubmit = form.createSubmitHandler(
  async (data) => {
    //   ^? Expected to match type Output
    console.log("Valid data:", data);
  },
  async (issues) => {
    console.log("Validation issues:", issues);
  },
);
```

### 📚 Example: `volibot` Validation

<card-group>
<card icon="goodie:brand-valibot" title="Volibot Official Docs" to="https://valibot.dev/">

Check out the [Volibot documentation](https://valibot.dev/) for more details on how to define schemas and validation rules.

</card>

<card icon="simple-icons:github" title="Volibot GitHub Repository" to="https://github.com/open-circle/valibot">

Check out the [Volibot GitHub repository](https://github.com/open-circle/valibot) for source code, issues, and community discussions.

</card>
</card-group>

```ts
import { FormController } from "@goodie-forms/core";
import * as v from "valibot";

const schema = v.object({
  username: v.pipe(v.string(), v.minLength(3)),
  age: v.pipe(v.number(), v.minValue(18)),
});

type Output = v.InferOutput<typeof schema>;

const form = new FormController({
  validationSchema: schema,
  initialData: {
    username: "",
    age: 0,
  },
});

const onSubmit = form.createSubmitHandler(
  async (data) => {
    //   ^? Expected to match type Output
    console.log("Valid data:", data);
  },
  async (issues) => {
    console.log("Validation issues:", issues);
  },
);
```

### 📚 Example: `ArkType` Validation

<card-group>
<card icon="goodie:brand-arktype" title="ArkType Official Docs" to="https://arktype.dev/">

Check out the [ArkType documentation](https://arktype.dev/) for more details on how to define schemas and validation rules.

</card>

<card icon="simple-icons:github" title="ArkType GitHub Repository" to="https://github.com/arktypeio/arktype">

Check out the [ArkType GitHub repository](https://github.com/arktypeio/arktype) for source code, issues, and community discussions.

</card>
</card-group>

```ts
import { FormController } from "@goodie-forms/core";
import { type } from "arktype";

const schema = type({
  email: "string.email",
  password: "string >= 8",
  rememberMe: "boolean?",
});

type Output = typeof schema.infer;

const form = new FormController({
  validationSchema: schema,
  initialData: {
    email: "",
    password: "",
    rememberMe: false,
  },
});

const onSubmit = form.createSubmitHandler(
  async (data) => {
    //   ^? Expected to match type Output
    console.log("Valid data:", data);
  },
  async (issues) => {
    console.log("Validation issues:", issues);
  },
);
```

### 📚 Other Standard Schema Libraries

You can use any validation library that implements the [Standard Schema](https://standardschema.dev/schema) specification.

<card icon="goodie:brand-standardschema" title="Standard Schema Libraries" to="https://standardschema.dev/schema#what-schema-libraries-implement-the-spec">

Check out Standard Schema-compatible libraries for more options on schema validation that can be used seamlessly with Goodie Forms.

</card>

## Custom Validation

```ts
export type CustomValidationIssue<TOutput extends object> = {
  path: FieldPath.StringPaths<TOutput>;
  message: string;
};

export type CustomValidationStrategy<TOutput extends object> = (
  data: DeepPartial<TOutput>,
) =>
  | void
  | CustomValidationIssue<TOutput>[]
  | Promise<CustomValidationIssue<TOutput>[] | void>;
```

```ts
export function customValidation<TOutput extends object>(
  strategy: CustomValidationStrategy<TOutput>,
);
```

<doc-tree>
<doc-tree-item title="TOutput">

represents the final validated shape of your form data. It defines the full object structure that the form is expected to produce after successful validation and submission.

</doc-tree-item>
</doc-tree>

`@goodie-forms/core` exposes `customValidation()` for the cases where you need to implement your own validation logic that doesn't fit into a standard schema.

This is the **lowest-level** and **most flexible** validation mechanism available in **Goodie Forms**.

Instead of describing **rules declaratively** (like in a **schema**), you provide a **function** that:

- Receives the **current form data** (`DeepPartial<TOutput>`)
- Returns **nothing** if the **data is valid**
- Or returns an **array of structured validation issues** (`StandardSchemaV1.Issue[]`) with `path` as [`FieldPath.StringPath`](/core/fieldpath#stringpath)
- May also be **asynchronous**

### 📚 Example: Custom Validation

```ts
import { FormController, customValidation } from "@goodie-forms/core";

type Output = {
  password: string;
  confirmPassword: string;
  activationDigits: number[];
};

const form = new FormController({
  initialData: {
    password: "",
    confirmPassword: "",
  },
  validationSchema: customValidation<Output>((data) => {
    const issues = [];

    if (data.password && data.password.length < 8) {
      issues.push({
        path: "password",
        //    ^? IntelliSense will suggest StringPaths of Output here
        message: "Password must be at least 8 characters long",
      });
    }

    if (data.password !== data.confirmPassword) {
      issues.push({
        path: "confirmPassword",
        //    ^? IntelliSense will suggest StringPaths of Output here
        message: "Passwords do not match",
      });
    }

    for (let i = 0; i < data.activationDigits?.length; i++) {
      if (data.activationDigits[i] < 0 || data.activationDigits[i] > 9) {
        issues.push({
          path: `activationDigits[${i}]`,
          //    ^? IntelliSense will suggest StringPaths of Output here
          message: "Activation digits must be between 0 and 9",
        });
      }
    }

    return issues.length ? issues : undefined;
  }),
});
```
