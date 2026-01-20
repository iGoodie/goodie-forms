import { FormController, type NativeFormObject } from "@goodie-forms/core";
import { useEffect, useRef, useState } from "react";
import { SimpleField } from "./SimpleField";

import "./App.css";
import "./tailwind.css";

interface UserForm extends NativeFormObject {
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
  foo: {
    bar: number[];
  };
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
    control.getFieldState("name")?.touch();
    control.getFieldState("name")?.update("John"); // isDirty = true
    control.getFieldState("name")?.update(""); // isDirty = false

    console.log(control);
    control.getFieldState("name")?.focus();
  }, []);

  return (
    <main>
      <form className="flex flex-col gap-4">
        <SimpleField
          label="User Name"
          render={() => (
            <input
              ref={(el) => {
                console.log("Ref", el);
                if (el) {
                  control.registerField("name");
                  control.getFieldState("name")?.bindElement(el);
                }
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
      </form>
    </main>
  );
}

export default App;
