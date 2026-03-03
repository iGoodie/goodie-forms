<!-- Logo -->
<p align="center">
  <img src="https://raw.githubusercontent.com/iGoodie/goodie-forms/master/.github/assets/logo.svg" height="200px" alt="Logo"/>
</p>

<!-- Slogan -->
<p align="center">
   An unopinionated modern form state and data management library
</p>
<!-- Badges -->
<p align="center">

  <!-- Main Badges -->
  <img src="https://raw.githubusercontent.com/iGoodie/paper-editor/master/.github/assets/main-badge.svg" height="20px"/>
  <a href="https://www.npmjs.com/package/@goodie-forms/react">
    <img src="https://img.shields.io/npm/v/@goodie-forms/react"/>
  </a>
  <a href="https://github.com/iGoodie/goodie-forms/tags">
    <img src="https://img.shields.io/github/v/tag/iGoodie/goodie-forms"/>
  </a>
  <a href="https://github.com/iGoodie/goodie-forms">
    <img src="https://img.shields.io/github/languages/top/iGoodie/goodie-forms"/>
  </a>

  <br/>

  <!-- Github Badges -->
  <img src="https://raw.githubusercontent.com/iGoodie/paper-editor/master/.github/assets/github-badge.svg" height="20px"/>
  <a href="https://github.com/iGoodie/goodie-forms/commits/master">
    <img src="https://img.shields.io/github/last-commit/iGoodie/goodie-forms"/>
  </a>
  <a href="https://github.com/iGoodie/goodie-forms/issues">
    <img src="https://img.shields.io/github/issues/iGoodie/goodie-forms"/>
  </a>
  <a href="https://github.com/iGoodie/goodie-forms/tree/master/src">
    <img src="https://img.shields.io/github/languages/code-size/iGoodie/goodie-forms"/>
  </a>

  <br/>

  <!-- Support Badges -->
  <img src="https://raw.githubusercontent.com/iGoodie/paper-editor/master/.github/assets/support-badge.svg" height="20px"/>
  <a href="https://discord.gg/KNxxdvN">
    <img src="https://img.shields.io/discord/610497509437210624?label=discord"/>
  </a>
  <a href="https://www.patreon.com/iGoodie">
    <img src="https://img.shields.io/endpoint.svg?url=https%3A%2F%2Fshieldsio-patreon.vercel.app%2Fapi%3Fusername%3DiGoodie%26type%3Dpatrons"/>
  </a>
</p>

# Description

React package of Goodie Forms.

# Quick Example

```tsx
import { useForm } from "@goodie-forms/react";
import z from "zod";

// 1. Define a schema for your form data
const userRegisterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export function App() {
  // 2. Create a form with the schema
  const form = useForm(
    {
      validationSchema: userRegisterSchema,
    },
    {
      validationMode: "onBlur",
      revalidationMode: "onChange",
    },
  );

  // 3. Create a submit handler
  const handleSubmit = form.createSubmitHandler(async (data) => {
    console.log("Form submitted successfully with data:", data);
  });

  return (
    // 4. Bind submit handler to the form element
    <form onClick={handleSubmit}>
      {/* 5. Render fields */}
      <FieldRenderer
        form={form}
        path={form.path.of("name")}
        defaultValue=""
        render={({ fieldProps, field, form }) => (
          <div>
            <input
              {...fieldProps}
              type="text"
              disabled={form.controller.isSubmitting}
            />
            {field.issues.length > 0 && (
              <div className="issues">
                {field.issues.map((issue) => (
                  <p key={issue.id}>{issue.message}</p>
                ))}
              </div>
            )}
          </div>
        )}
      />

      {/* 5. Render fields */}
      <FieldRenderer
        form={form}
        path={form.path.of("email")}
        defaultValue=""
        render={({ fieldProps, field }) => (
          <div>
            <input
              {...fieldProps}
              type="email"
              disabled={form.controller.isSubmitting}
            />
            {field.issues.length > 0 && (
              <div className="issues">
                {field.issues.map((issue) => (
                  <p key={issue.id}>{issue.message}</p>
                ))}
              </div>
            )}
          </div>
        )}
      />

      {/* 5. Render fields */}
      <FieldRenderer
        form={form}
        path={form.path.of("password")}
        defaultValue=""
        render={({ fieldProps, field }) => (
          <div>
            <input
              {...fieldProps}
              type="password"
              disabled={form.controller.isSubmitting}
            />
            {field.issues.length > 0 && (
              <div className="issues">
                {field.issues.map((issue) => (
                  <p key={issue.id}>{issue.message}</p>
                ))}
              </div>
            )}
          </div>
        )}
      />

      <button type="submit">Submit</button>
    </form>
  );
}
```

## License

&copy; 2026 Taha Anılcan Metinyurt (iGoodie)

For any part of this work for which the license is applicable, this work is licensed under the [Attribution-ShareAlike 4.0 International](http://creativecommons.org/licenses/by-sa/4.0/) license. (See LICENSE).

<a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-sa/4.0/88x31.png" /></a>
