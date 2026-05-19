import { expect, test } from "vitest";
import { FormController } from "../form/FormController";
import { FieldPath } from "../field/FieldPath";

interface User {
  name: string;
  address: {
    city: string;
    street: string;
  };
  friends: {
    name: string;
    tags: string[];
  }[];
  coords: [100 | 101, 200 | 201];
}

test("registers fields", () => {
  const formController = new FormController<User>({});

  let valueChangeInvoked = 0;
  let initialValueChangeInvoked = 0;
  let registeredFields: FieldPath.Segments[] = [];

  formController.events.on("fieldRegistered", (path) =>
    registeredFields.push(path),
  );
  formController.events.on("fieldValueChanged", () => valueChangeInvoked++);
  formController.events.on(
    "fieldInitialValueChanged",
    () => initialValueChangeInvoked++,
  );

  const path1 = formController.path.of((data) => data.friends[0].tags[99]);
  expect(formController.getField(path1)).toBeUndefined();
  const field1 = formController.registerField(path1, { defaultValue: "Tag99" });
  expect(registeredFields).toContain(path1);
  expect(valueChangeInvoked).toBe(1);
  expect(initialValueChangeInvoked).toBe(0);
  expect(field1.value).toBe("Tag99");
  expect(field1.initialValue).toBeUndefined();

  const path2 = formController.path.of("coords[1]");
  expect(formController.getField(path2)).toBeUndefined();
  const field2 = formController.registerField(path2);
  expect(registeredFields).toContain(path2);
  expect(field2.value).toBeUndefined();
  expect(field2.initialValue).toBeUndefined();

  field1.setValue("Tag100");
  expect(valueChangeInvoked).toBe(2);
  expect(initialValueChangeInvoked).toBe(0);
  field2.setValue(200);
  expect(valueChangeInvoked).toBe(3);
  expect(initialValueChangeInvoked).toBe(0);

  const path3 = formController.path.of("coords");
  expect(formController.getField(path3)).toBeUndefined();
  const field3 = formController.registerField(path3, {
    defaultValue: [100, 200],
    overrideInitialValue: true,
  });
  expect(valueChangeInvoked).toBe(3);
  expect(initialValueChangeInvoked).toBe(1);
  expect(registeredFields).toContain(path3);
  expect(field3.value).toEqual([undefined, 200]);
  expect(field3.initialValue).toBeDefined();

  field3.modifyValue((val) => {
    val[0] = 101;
    val[1]++;
  });
  expect(valueChangeInvoked).toBe(4);
  expect(initialValueChangeInvoked).toBe(1);

  expect(field3.value).toStrictEqual([101, 201]);

  expect(formController.data.coords).toEqual([101, 201]);

  expect(formController.initialData).toEqual({
    coords: [100, 200],
  });

  expect(formController.isDirty).toBe(true);
});
