import { FormController } from "@goodie-forms/core";
import { useEffect, useState } from "react";
import z from "zod";
import { SimpleField } from "./SimpleField";

import "./App.css";
import "./tailwind.css";

function vanillaTest() {
  const control = new FormController({});

  document.createElement("form").onsubmit = control.createSubmitHandler(
    async (data, event) => {
      //         ^?
      console.log("Infers type of event correctly", event);
    },
  );
}

vanillaTest();

// Allows deriving validation schema from the actual data shape too
interface UserForm {
  name: string;
  surname: string;
  address: {
    city: string;
    street: string;
  };
  scores: string[];
  friends: {
    name: string;
    friendshipPoints: string;
  }[];
  foo: { bar: number[] };
}

const UserSchema = z.object({
  name: z.string().nonempty(),
  surname: z.string().nonempty(),
  address: z.object({
    city: z.string(),
    street: z.string(),
  }),
  foo: z.any(),
  friends: z.any(),
  scores: z.any(),
}) satisfies z.ZodType<UserForm>;

// type UserForm = z.infer<typeof UserSchema>;

function App() {
  const [control] = useState(() => {
    return new FormController<UserForm>({
      validationSchema: UserSchema,
    });
  });

  const [renderNo, rerender] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      // rerender((i) => i + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    // Simulating virtual field binding
    control.bindField("address");
    control.getFieldState("address")!.setValue({ city: "A", street: "B" });

    // Simulating arbitrary focus by field path
    control.getFieldState("name")?.focus();
  }, []);

  console.log("Rendering app");

  return (
    <main className="grid grid-cols-4 gap-20">
      <form
        className="flex flex-col gap-4"
        onSubmit={control.createSubmitHandler(
          async (data, event) => {
            alert("Form submitted successfully: " + JSON.stringify(data));
            console.log(event);
          },
          async (issues, event) => {
            alert(
              "Form has issues: " + issues.map((i) => i.message).join(", "),
            );
            console.log(event);
          },
        )}
      >
        <SimpleField
          form={control}
          name="name"
          label="User Name"
          defaultValue="foo"
          render={({ field }) => (
            <input
              {...field}
              onChange={(e) => {
                control.getFieldState("name")!.setValue(e.target.value);
                rerender((i) => i + 1);
              }}
              type="text"
              placeholder="John"
            />
          )}
        />
        <SimpleField
          form={control}
          name="surname"
          label="User Lastname"
          defaultValue=""
          render={({ field }) => (
            <input
              {...field}
              onChange={(e) => {
                control
                  .getFieldState("surname")!
                  .modifyValue((_currentValue, field) => {
                    field.markDirty();
                    return e.target.value;
                  });
                rerender((i) => i + 1);
              }}
              type="text"
              placeholder="Doe"
            />
          )}
        />

        <SimpleField
          form={control}
          name="address"
          label="Address"
          defaultValue={{ city: "Foo", street: "Bar" }}
          render={({ field, fieldState }) => (
            <div {...(field as object)}>
              <button
                type="button"
                onClick={() => {
                  fieldState.modifyValue((address) => {
                    address.city =
                      Math.random() <= 0.5 ? "Garip Şehir" : "Gravity Falls";
                  });
                  rerender((i) => i + 1);
                }}
              >
                Some complex city picker thing
              </button>

              <button
                type="button"
                onClick={() => {
                  fieldState.modifyValue((address) => {
                    address.street =
                      Math.random() <= 0.5
                        ? "Aman Allahım Sokak"
                        : "Akarsuyokuş Sokak";
                  });
                  rerender((i) => i + 1);
                }}
              >
                Some complex street picker thing
              </button>
            </div>
          )}
        />

        <button
          type="button"
          onClick={() => {
            control.reset();
            rerender((i) => i + 1);
          }}
        >
          Reset
        </button>
        <button
          type="button"
          onClick={() => {
            control.validateForm();
            rerender((i) => i + 1);
          }}
        >
          Validate
        </button>
        <button type="submit">Submit</button>
      </form>

      <pre className="w-50 text-left">
        {JSON.stringify(control._data, null, 2)}
      </pre>

      <pre className="w-50 text-left">
        {JSON.stringify(control._initialData, null, 2)}
      </pre>

      <pre className="w-50 text-left">
        <span>Render #{renderNo}</span>
      </pre>
    </main>
  );
}

export default App;
