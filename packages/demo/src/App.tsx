import { FormController } from "@goodie-forms/core";
import { useEffect, useState } from "react";
import { SimpleField } from "./SimpleField";

import "./App.css";
import "./tailwind.css";
import z from "zod";

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

  useEffect(() => {
    // Simulating virtual field binding
    control.bindField("address");
    control.getFieldState("address")!.setValue({ city: "A", street: "B" });

    // Simulating arbitrary focus by field path
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
                  control.bindField("name", { defaultValue: el.value });
                  control.getFieldState("name")?.bindElement(el);
                } else {
                  control.unbindField("name");
                }
              }}
              onChange={(e) => {
                control
                  .getFieldState("name")!
                  .modifyValue((_currentValue, field) => {
                    field.markDirty();
                    return e.target.value;
                  });
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
                  control.bindField("surname", { defaultValue: el.value });
                  control.getFieldState("surname")?.bindElement(el);
                } else {
                  control.unbindField("surname");
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
            control.validateForm();
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
