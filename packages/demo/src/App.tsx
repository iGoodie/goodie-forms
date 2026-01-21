import { FormController } from "@goodie-forms/core";
import { useEffect, useState } from "react";
import { SimpleField } from "./SimpleField";

import "./App.css";
import "./tailwind.css";
import z from "zod";

// interface UserForm {
//   name?: string;
//   surname?: string;
//   address?: {
//     city: string;
//     street: string;
//   };
//   scores?: string[];
//   friends?: {
//     name: string;
//     friendshipPoints: string;
//   }[];
//   foo?: { bar: number[] };
// }

const UserSchema = z.object({
  name: z.string().nonempty(),
  surname: z.string().nonempty(),
  address: z.object({
    city: z.string(),
    street: z.string(),
  }),
});

type UserForm = z.infer<typeof UserSchema>;

function App() {
  const [control] = useState(
    () =>
      new FormController<UserForm>({
        validationSchema: UserSchema,
        initialData: {
          name: "",
          surname: "",
          address: { city: "", street: "" },
        },
      }),
  );

  useEffect(() => {
    control.registerField("address");
    control.setValue("address", { city: "A", street: "B" });

    control.getFieldState("name")?.focus();

    console.log(control);
  }, []);

  return (
    <main>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          console.log({ data: control._data });
        }}
      >
        <SimpleField
          label="User Name"
          render={() => (
            <input
              defaultValue="foo"
              ref={(el) => {
                if (el) {
                  control.registerField("name", el.value);
                  control.getFieldState("name")?.bindElement(el);
                } else {
                  control.unregisterField("name");
                }
              }}
              onChange={(e) => {
                control.getFieldState("name")!.setValue(e.target.value);
                control.setValue("name", e.target.value);
              }}
              type="text"
              placeholder="John"
            />
          )}
        />
        <SimpleField
          label="User Lastname"
          render={() => (
            <input
              ref={(el) => {
                if (el) {
                  control.registerField("surname", el.value);
                  control.getFieldState("surname")?.bindElement(el);
                } else {
                  control.unregisterField("surname");
                }
              }}
              type="text"
              placeholder="Doe"
            />
          )}
        />
        <button type="button" onClick={() => control.reset()}>
          Reset
        </button>
        <button
          type="button"
          onClick={() => {
            control.triggerValidation();
            console.log(control);
          }}
        >
          Validate
        </button>
        <button type="submit">Submit</button>
      </form>
    </main>
  );
}

export default App;
