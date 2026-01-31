import { Field, FormController } from "@goodie-forms/core";

class Inventory {
  contents: string[] = [];

  push(item: string) {
    this.contents.push(item);
  }
}

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

const formController = new FormController<UserForm>({});

const nameField = formController.bindField("name");
nameField.setValue("Foo");
console.log(nameField.isTouched);
console.log(nameField.isDirty);

const addressField = formController.bindField("address", {
  defaultValue: { city: "", street: "" },
});
addressField.modifyValue((address) => {
  address!.city = "Foo City";
});

console.log(addressField.value);

const inventoryField = formController.bindField("inventory");
inventoryField.modifyValue((inventory) => {});

const inventory1Field = formController.bindField("inventory.contents[1]");
inventory1Field.setValue("Sword");

console.log("Data =", formController._data);
