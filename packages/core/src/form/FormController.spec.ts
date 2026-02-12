import { expect, test } from "vitest";
import { FormController } from "../form/FormController";

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
  coords: [100, 200 | 201];
}

test("registers fields", () => {
  const formController = new FormController<User>({});

  let changeInvoked = 0;

  formController.events.on("valueChanged", () => changeInvoked++);

  const path1 = formController.path.of((data) => data.friends[0].tags[99]);
  expect(formController.getField(path1)).toBeUndefined();
  const field1 = formController.registerField(path1, { defaultValue: "Tag99" });
  expect(field1.value).toBe("Tag99");
  expect(field1.initialValue).toBeUndefined();

  const path2 = formController.path.of("coords[1]");
  expect(formController.getField(path2)).toBeUndefined();
  const field2 = formController.registerField(path2);
  expect(field2.value).toBeUndefined();
  expect(field2.initialValue).toBeUndefined();

  field1.setValue("Tag100");
  field2.setValue(200);

  const path3 = formController.path.of("coords");
  expect(formController.getField(path3)).toBeUndefined();
  const field3 = formController.registerField(path3, {
    defaultValue: [100, 200],
    overrideInitialValue: true,
  });
  expect(field3.value).toEqual([undefined, 200]);
  expect(field3.initialValue).toBeUndefined();

  field3.modifyValue((val) => {
    val[0] = 100;
    val[1]++;
  });

  expect(field3.value).toStrictEqual([100, 201]);
  expect(changeInvoked).toBe(5);
});
