/* eslint-disable @typescript-eslint/no-unused-vars */

import { FormController } from "@goodie-forms/core";
import {
  useForm,
  useFormErrorObserver,
  useFormValuesObserver,
  useRenderControl,
} from "@goodie-forms/react";
import z from "zod";
import { FormDebug } from "./FormDebug";
import { SimpleField } from "./SimpleField";

import "./App.css";
import "./tailwind.css";
import { useState } from "react";

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

class Inventory {
  contents: string[] = [];

  push(item: string) {
    this.contents.push(item);
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
  inventory: Inventory;
}

const UserSchema = z.object({
  name: z.string().nonempty(),
  surname: z.string().nonempty(),
  address: z.object({
    city: z.string(),
    street: z.string(),
  }),
  friends: z.any(),
  scores: z.any(),
  inventory: z.custom<Inventory>(
    (d) => d instanceof Inventory && d.contents.length >= 1,
    "Requires at least 1 item",
  ),
}) satisfies z.ZodType<UserForm>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type UserFormInferred = z.infer<typeof UserSchema>;
//   ^?

function App() {
  const renderControl = useRenderControl();

  const form = useForm(
    {
      validationSchema: UserSchema,
    },
    {
      validateMode: "onChange",
      revalidateMode: "onChange",
    },
  );

  // const formErrors = useFormErrorObserver(form, {
  //   include: ["inventory"],
  // });

  // const formValues = useFormValuesObserver(form, {
  //   include: ["name", "surname"],
  // });

  // console.log(formValues, formErrors);

  const [hidden, setHidden] = useState(false);

  const handleSubmit = form.controller.createSubmitHandler(
    async (data, event) => {
      const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
      await sleep(2_000);

      alert("Form submitted successfully: " + JSON.stringify(data));

      console.log(event);

      // Persist with current data
      form.controller.reset(data);
    },
    async (issues, event) => {
      console.log(
        "Form has issues: " + issues.map((i) => i.message).join(", "),
      );
      console.log(event);
    },
  );

  // useEffect(() => {
  //   // Simulating virtual field binding
  //   const friendsField = formController.bindField("friends");
  //   friendsField.setValue([{ name: "iGoodie", friendshipPoints: 100 }]);

  //   // Simulating arbitrary focus by field path
  //   formController.getFieldState("name")?.focus();
  // }, []);

  return (
    <main className="grid grid-cols-4 gap-x-20 gap-y-5">
      <span className="col-span-full justify-self-start opacity-60 underline">
        Root Render #{renderControl.renderCount}
      </span>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <SimpleField
          form={form}
          path="name"
          label="User Name"
          defaultValue="foo"
          render={({ ref, value, handlers }) => (
            <input
              ref={ref}
              {...handlers}
              value={value}
              disabled={form.controller.isSubmitting}
              type="text"
              placeholder="John"
            />
          )}
        />

        <SimpleField
          form={form}
          path="surname"
          label="User Lastname"
          defaultValue=""
          render={({ ref, value, handlers, field }) => (
            <input
              ref={ref}
              {...handlers}
              value={value}
              disabled={form.controller.isSubmitting}
              onChange={(e) => field.setValue(e.target.value)}
              type="text"
              placeholder="Doe"
            />
          )}
        />

        <div className="flex flex-col p-2 border rounded-xl border-gray-700 focus-within:border-gray-400">
          <button
            className="text-xs! justify-self-end self-end"
            type="button"
            onClick={() => setHidden((h) => !h)}
          >
            Hide/Unhide
          </button>
          {!hidden && (
            <SimpleField
              form={form}
              path="address"
              label="Address"
              defaultValue={{ city: "Foo", street: "Sesame Street" }}
              render={({ ref, value, handlers, field }) => (
                <div ref={ref} {...handlers} className="flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={form.controller.isSubmitting}
                    onClick={() => {
                      field.modifyValue((address) => {
                        address.city =
                          Math.random() <= 0.5
                            ? "City #" + Math.random().toFixed(5)
                            : "Gravity Falls";
                      });
                    }}
                  >
                    Random City
                  </button>
                  <span>City: {value?.city}</span>

                  <hr className="border border-gray-700" />

                  <select
                    value={value?.street}
                    disabled={form.controller.isSubmitting}
                    onChange={(e) =>
                      field.modifyValue((address) => {
                        address.street = e.target.value;
                      })
                    }
                  >
                    <option value="Sesame Street">Sesame Street</option>
                    <option value="Street #1">Street #1</option>
                    <option value="Street #3">Street #2</option>
                    <option value="Street #2">Street #3</option>
                  </select>
                  <span>Street: {value?.street}</span>
                </div>
              )}
            />
          )}
        </div>

        <SimpleField
          form={form}
          path="inventory"
          label="Inventory"
          defaultValue={new Inventory()}
          render={({ ref, value, handlers, field }) => (
            <div
              ref={ref}
              {...handlers}
              className="flex flex-col gap-2 p-2 border rounded-xl border-gray-700 focus-within:border-gray-400"
            >
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  disabled={form.controller.isSubmitting}
                  onClick={() => {
                    field.modifyValue((inventory) => {
                      const items = ["Gem", "Sword", "Bow", "Arrow"];
                      const item =
                        items[Math.floor(Math.random() * items.length)];
                      inventory.push(item);
                    });
                  }}
                >
                  Add Random Item
                </button>
                <button
                  type="button"
                  disabled={form.controller.isSubmitting}
                  onClick={() => {
                    field.modifyValue((inventory) => {
                      inventory.contents.splice(inventory.contents.length - 1);
                    });
                    field.triggerValidation();
                  }}
                >
                  Remove Last
                </button>
              </div>
              <span className="text-wrap">{value?.contents.join(", ")}</span>
            </div>
          )}
        />

        <hr />

        <button
          type="button"
          onClick={() => {
            form.controller.reset();
            renderControl.forceRerender();
          }}
        >
          Reset
        </button>
        <button
          type="button"
          onClick={() => {
            form.controller.validateForm();
            renderControl.forceRerender();
          }}
        >
          Validate
        </button>
        <button type="submit" disabled={form.controller.isSubmitting}>
          {form.controller.isSubmitting ? "Submitting.." : "Submit & Persist"}
        </button>
      </form>

      <FormDebug formController={form.controller} />
    </main>
  );
}

export default App;
