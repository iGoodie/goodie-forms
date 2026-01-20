import { FormController } from "@goodie-forms/core";
import { useEffect, useState } from "react";
import { SimpleField } from "./SimpleField";

import "./App.css";
import "./tailwind.css";

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

function App() {
  const [control] = useState(
    () =>
      new FormController<UserForm>({
        name: "",
        surname: "",
        address: {
          city: "",
          street: "",
        },
        scores: [],
        friends: [],
        foo: { bar: [] },
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
                control.getFieldState("name").setValue(e.target.value);
                control.setValue("name", e.target.value);
              }}
              type="text"
              placeholder="John"
            />
          )}
        />
        <SimpleField
          label="User Lastname"
          render={() => <input type="text" placeholder="Doe" />}
        />
        <button type="button" onClick={() => control.reset()}>
          Reset
        </button>
        <button type="submit">Submit</button>
      </form>
    </main>
  );
}

export default App;
