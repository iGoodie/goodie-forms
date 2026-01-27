/* eslint-disable react-hooks/refs */
import { FormController } from "@goodie-forms/core";
import flow from "lodash.flow";
import { useEffect, useState } from "react";
import z from "zod";
import { SimpleField } from "./SimpleField";
import { useRenderControl } from "./hooks/useRenderControl";

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

class Foo {
  bar: number[] = [];

  push(num: number) {
    this.bar.push(num);
  }
}

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
    friendshipPoints: number;
  }[];
  foo: Foo;
}

const UserSchema = z.object({
  name: z.string().nonempty(),
  surname: z.string().nonempty(),
  address: z.object({
    city: z.string(),
    street: z.string(),
  }),
  foo: z.custom<Foo>(
    (d) => d instanceof Foo && d.bar.length >= 1,
    "Requires at least 1 bar",
  ),
  friends: z.any(),
  scores: z.any(),
}) satisfies z.ZodType<UserForm>;

// type UserForm = z.infer<typeof UserSchema>;

function FormDebug<TShape extends object>(props: {
  form: FormController<TShape>;
}) {
  const renderControl = useRenderControl();

  useEffect(() => {
    const { events } = props.form;

    return flow(
      events.on("statusChanged", () => renderControl.forceRerender()),
      events.on("valueChanged", () => renderControl.forceRerender()),
      events.on("fieldBound", () => renderControl.forceRerender()),
      events.on("fieldUnbound", () => renderControl.forceRerender()),
      events.on("fieldUpdated", () => renderControl.forceRerender()),
    );
  }, []);

  return (
    <div className="h-fit col-span-3 grid grid-cols-3 gap-6">
      <span className="text-left underline opacity-60 col-span-full">
        Indicator Render #{renderControl.renderCount}
      </span>

      <pre className="text-left">
        {JSON.stringify(props.form._data, null, 2)}
      </pre>
      <pre className="text-left">
        {JSON.stringify(props.form._initialData, null, 2)}
      </pre>
      <pre className="text-left flex flex-col">
        <span className="opacity-50">Fields</span>
        {[...props.form._fields.values()].map((field, i) => (
          <span key={i}>{field.path}</span>
        ))}

        <hr className="my-10" />

        <span className="opacity-50">Touched Fields</span>
        {[...props.form._fields.values()]
          .filter((field) => field.isTouched)
          .map((field, i) => (
            <span key={i}>{field.path}</span>
          ))}

        <hr className="my-10" />

        <span className="opacity-50">Dirty Fields</span>
        {[...props.form._fields.values()]
          .filter((field) => field.isDirty)
          .map((field, i) => (
            <span key={i}>{field.path}</span>
          ))}
      </pre>
    </div>
  );
}

function App() {
  const renderControl = useRenderControl();

  const [formController] = useState(() => {
    return new FormController<UserForm>({
      validationSchema: UserSchema,
    });
  });

  useEffect(() => {
    const id = setInterval(() => {
      // rerender((i) => i + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    // Simulating virtual field binding
    const friendsField = formController.bindField("friends");
    friendsField.setValue([{ name: "iGoodie", friendshipPoints: 100 }]);

    // Simulating arbitrary focus by field path
    formController.getFieldState("name")?.focus();
  }, []);

  return (
    <main className="grid grid-cols-4 gap-x-20 gap-y-5">
      <span className="col-span-full justify-self-start opacity-60 underline">
        Root Render #{renderControl.renderCount}
      </span>

      <form
        className="flex flex-col gap-4"
        onSubmit={formController.createSubmitHandler(
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
          form={formController}
          name="name"
          label="User Name"
          defaultValue="foo"
          render={({ field, fieldState }) => (
            <input
              {...field}
              onChange={(e) => fieldState.setValue(e.target.value)}
              type="text"
              placeholder="John"
            />
          )}
        />
        <SimpleField
          form={formController}
          name="surname"
          label="User Lastname"
          defaultValue=""
          render={({ field, fieldState }) => (
            <input
              {...field}
              onChange={(e) => {
                fieldState.modifyValue((_currentValue, field) => {
                  field.markDirty();
                  return e.target.value;
                });
              }}
              type="text"
              placeholder="Doe"
            />
          )}
        />

        <SimpleField
          form={formController}
          name="address"
          label="Address"
          defaultValue={{ city: "Foo", street: "Sesame Street" }}
          render={({ field, fieldState }) => (
            <div
              {...(field as object)}
              className="flex flex-col gap-2 p-2 border rounded-xl border-gray-700"
            >
              <button
                type="button"
                onClick={() => {
                  fieldState.modifyValue((address) => {
                    address.city =
                      Math.random() <= 0.5
                        ? "City #" + Math.random().toFixed(5)
                        : "Gravity Falls";
                    return address;
                  });
                }}
              >
                Some complex city picker thing
              </button>
              <span>City: {field.value?.city}</span>

              <hr className="border border-gray-700" />

              <button
                type="button"
                onClick={() => {
                  fieldState.modifyValue((address) => {
                    address.street =
                      Math.random() <= 0.5
                        ? "Street #" + Math.random().toFixed(5)
                        : "Sesame Street";
                    return address;
                  });
                }}
              >
                Some complex street picker thing
              </button>
              <span>Street: {field.value?.street}</span>
            </div>
          )}
        />

        <SimpleField
          form={formController}
          name="foo"
          label="Arbitrary Foo"
          defaultValue={new Foo()}
          render={({ field, fieldState }) => (
            <div
              {...(field as object)}
              className="flex flex-col gap-2 p-2 border rounded-xl border-gray-700"
            >
              <button
                type="button"
                onClick={() => {
                  fieldState.modifyValue((foo) => {
                    foo.push(1);
                    return foo;
                  });
                }}
              >
                Push "1"
              </button>
              <span>{field.value?.bar.join(",")}</span>
            </div>
          )}
        />

        <hr />

        <button
          type="button"
          onClick={() => {
            formController.reset();
            renderControl.forceRerender();
          }}
        >
          Reset
        </button>
        <button
          type="button"
          onClick={() => {
            formController.validateForm();
            renderControl.forceRerender();
          }}
        >
          Validate
        </button>
        <button type="submit">Submit</button>
      </form>

      <FormDebug form={formController} />
    </main>
  );
}

export default App;
