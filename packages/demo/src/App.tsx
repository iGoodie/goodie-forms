/* eslint-disable @typescript-eslint/no-unused-vars */

import { FormController } from "@goodie-forms/core";
import { useForm, useFormField, useRenderControl } from "@goodie-forms/react";
import z from "zod";
import { FormDebug } from "./FormDebug";
import { SimpleField } from "./SimpleField";

import { useState, type FormEvent } from "react";
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
  inventory?: Inventory;
}

// const obj = {
//   a: [
//     {
//       b: {
//         c: [{ a: 99 }],
//       },
//     },
//   ],
//   simple: [1],
//   foo: {
//     bar: ["a"],
//   },
// };
// console.log(Field.getValue(obj, "a"));
// console.log(Field.getValue(obj, "a[0]"));
// console.log(Field.getValue(obj, "a[1]"));
// console.log(Field.getValue(obj, "a[1].b"));
// console.log(Field.getValue(obj, "a[0].b.c"));
// console.log(Field.getValue(obj, "a[1].b.c"));
// console.log(Field.getValue(obj, "a[0].b.c[0]"));
// console.log(Field.getValue(obj, "a[0].b.c[1]"));
// console.log(Field.getValue(obj, "a[0].b.c[1].a"));
// console.log(Field.getValue(obj, "simple[0]"));
// console.log(Field.getValue(obj, "foo.bar[0]"));
// console.log(Field.getValue(obj, "foo.bar[11]"));

const UserSchema = z.object({
  name: z.string().nonempty(),
  surname: z.string().nonempty(),
  address: z.object({
    city: z.string(),
    street: z.string(),
  }),
  friends: z.any(),
  scores: z.any(),
  inventory: z
    .custom<Inventory>((d) => d instanceof Inventory, "Invalid inventory")
    .superRefine((d, ctx) => {
      if (d.contents.length % 2 !== 0) {
        ctx.addIssue({
          code: "custom",
          message: "Requires an even amount of items",
        });
      }

      for (let i = 0; i < d.contents.length; i++) {
        const item = d.contents[i] ?? "";
        if (item.length < 2) {
          ctx.addIssue({
            code: "custom",
            message: "Item must be at least 2 characters long",
            path: ["contents", i],
          });
        }
      }
    })
    .optional(),
}) satisfies z.ZodType<UserForm>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type UserFormInferred = z.infer<typeof UserSchema>;
//   ^?

function App() {
  const renderControl = useRenderControl();

  const form = useForm<UserForm>(
    {
      validationSchema: UserSchema,
      // validationSchema: customValidation((data) => {
      //   if (data.name == null) {
      //     return [{ path: "name", message: "No name? Boring" }];
      //   }
      //   if (data.name.length <= 0) {
      //     return [{ path: "name", message: "Name cannot be empty, bro" }];
      //   }
      //   if (data.inventory?.contents == null) {
      //     return [{ path: "inventory.contents", message: "Contents, huh?" }];
      //   }
      //   return [{ path: "friends[99]", message: "Contents, huh?" }];
      // }),
    },
    {
      validateMode: "onChange",
      revalidateMode: "onChange",
    },
  );

  // const nameField = useFormField(form, "name");
  // console.log({ name: nameField?.value });

  // const inventoryField = useFormField(form, "inventory");
  // console.log({ inventory: inventoryField?.value });

  // const formErrors = useFormErrorObserver(form, {
  //   include: ["inventory"],
  // });

  // const formValues = useFormValuesObserver(form, {
  //   include: ["inventory"],
  // });

  const inventoryField = useFormField(form, form.path.of("inventory"), {
    defaultValue: () => new Inventory(),
    overrideInitialValue: true,
  });

  // const inventoryValues = useFormValuesObserver(form, {
  //   include: ["inventory.contents"],
  // });

  // console.log(formValues, formErrors);

  const [hidden, setHidden] = useState(false);

  const handleSubmit = form.controller.createSubmitHandler<FormEvent>(
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
          path={form.path.of("name")}
          label="User Name"
          defaultValue="foo"
          render={({ fieldProps }) => (
            <input
              {...fieldProps}
              disabled={form.controller.isSubmitting}
              type="text"
              placeholder="John"
            />
          )}
        />

        <SimpleField
          form={form}
          path={form.path.of("surname")}
          label="User Lastname"
          defaultValue=""
          render={({ fieldProps, form }) => (
            <input
              {...fieldProps}
              onChange={(e) => {
                const value = e.target.value;

                if (value.endsWith("x")) {
                  inventoryField.setValue(undefined);
                }

                fieldProps.onChange(e);
              }}
              type="text"
              placeholder="Doe"
              disabled={form.controller.isSubmitting}
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
              path={form.path.of("address")}
              label="Address"
              defaultValue={() => ({ city: "Foo", street: "Sesame Street" })}
              render={({ fieldProps, field }) => (
                <div {...fieldProps} className="flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={form.controller.isSubmitting}
                    onClick={() => {
                      console.log(field);
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
                  <span>City: {fieldProps.value?.city}</span>

                  <hr className="border border-gray-700" />

                  <select
                    value={fieldProps.value?.street}
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
                    <option value="Invalid">Invalid</option>
                  </select>
                  <span>Street: {fieldProps.value?.street}</span>
                </div>
              )}
            />
          )}
        </div>

        <SimpleField
          form={form}
          path={form.path.of("inventory")}
          label="Inventory"
          defaultValue={() => new Inventory()}
          render={({ fieldProps, field }) => (
            <div
              {...fieldProps}
              className="flex flex-col gap-2 p-2 border rounded-xl border-gray-700 focus-within:border-gray-400"
            >
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  disabled={form.controller.isSubmitting}
                  onClick={() => {
                    field.ensureDefault();
                    field.modifyValue((inventory) => {
                      const items = ["Gem", "Sword", "Bow", "Arrow"];
                      const item =
                        items[Math.floor(Math.random() * items.length)];
                      inventory!.push(item);
                      console.log(inventory);
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
                      inventory!.contents.splice(
                        inventory!.contents.length - 1,
                      );
                    });
                  }}
                >
                  Remove Last
                </button>
                <button
                  type="button"
                  disabled={form.controller.isSubmitting}
                  className="col-span-full"
                  onClick={() => {
                    field.modifyValue((inventory) => {
                      if (inventory!.contents.length < 2) return;
                      const first = inventory!.contents.at(0)!;
                      const last = inventory!.contents.at(-1)!;
                      inventory!.contents[0] = last;
                      inventory!.contents[inventory!.contents.length - 1] =
                        first;
                    });
                  }}
                >
                  Swap
                </button>
              </div>
              <span className="text-wrap">
                {fieldProps.value?.contents.join(", ")}
              </span>
            </div>
          )}
        />

        {inventoryField?.value?.contents?.map((_, i) => (
          <SimpleField
            key={i}
            form={form}
            path={form.path.of(`inventory.contents[${i}]`)}
            label={`Inventory Item #${i + 1}`}
            defaultValue={() => "Sword"}
            overrideInitialValue={false}
            unbindOnUnmount
            render={({ fieldProps, field }) => (
              <input
                {...fieldProps}
                disabled={form.controller.isSubmitting}
                onChange={(e) => field.setValue(e.target.value)}
                type="text"
                placeholder="Sword"
              />
            )}
          />
        ))}

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
