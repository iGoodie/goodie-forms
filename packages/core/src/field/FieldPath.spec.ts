import { Equal, Expect } from "type-testing";
import { expect, test } from "vitest";
import { FieldPath } from "../field/FieldPath";

interface Person {
  name: string;
  surname: string;
  address?: {
    city: string;
    street: string;
  };
  friends?: string[];
  relations?: {
    name: string;
    points: number;
    metAddress?: {
      city: string;
      street: string;
    };
  }[];
}

const person: Person = {
  name: "John",
  surname: "Doe",
  address: {
    city: "Arkham City",
    street: "Sesame Street",
  },
  friends: ["Alice", "Bob"],
  relations: [
    {
      name: "Alice",
      points: 99,
      metAddress: {
        city: "Arkham City",
        street: "Sesame Street",
      },
    },
    {
      name: "Bob",
      points: 0,
    },
  ],
};

/* ------------------------------ */

test("resolves string paths", () => {
  type PersonPaths = FieldPath.StringPaths<Person>;

  expect(FieldPath.fromStringPath("a.b")).toStrictEqual(["a", "b"]);
  expect(FieldPath.fromStringPath("a.b.c")).toStrictEqual(["a", "b", "c"]);
  expect(FieldPath.fromStringPath("a[99].b.c[3]")).toStrictEqual([
    "a",
    99,
    "b",
    "c",
    3,
  ]);

  type typeTests = [
    Expect<
      Equal<
        PersonPaths,
        | "name"
        | "surname"
        | "address"
        | "friends"
        | "relations"
        | "address.city"
        | "address.street"
        | "friends[0]"
        | FieldPath._Unfoldable<`friends[${number}]`>
        | "relations[0]"
        | FieldPath._Unfoldable<`relations[${number}]`>
        | "relations[0].metAddress"
        | FieldPath._Unfoldable<`relations[${number}].metAddress`>
        | "relations[0].name"
        | FieldPath._Unfoldable<`relations[${number}].name`>
        | "relations[0].points"
        | FieldPath._Unfoldable<`relations[${number}].points`>
        | "relations[0].metAddress.city"
        | FieldPath._Unfoldable<`relations[${number}].metAddress.city`>
        | "relations[0].metAddress.street"
        | FieldPath._Unfoldable<`relations[${number}].metAddress.street`>
      >
    >,
  ];
});

test("gets fields properly", () => {
  const getFieldValue = (stringPath: FieldPath.StringPaths<Person>) =>
    FieldPath.getValue(person, FieldPath.fromStringPath(stringPath));

  expect(getFieldValue("name")).toBe(person.name);
  expect(getFieldValue("surname")).toBe(person.surname);
  expect(getFieldValue("address")).toBe(person.address);
  expect(getFieldValue("address.city")).toBe(person.address?.city);
  expect(getFieldValue("address.street")).toBe(person.address?.street);
  expect(getFieldValue("friends")).toBe(person.friends);
  expect(getFieldValue("friends[0]")).toBe(person.friends?.[0]);
  expect(getFieldValue("friends[1]")).toBe(person.friends?.[1]);
  expect(getFieldValue("relations")).toBe(person.relations);
  expect(getFieldValue("relations[0]")).toBe(person.relations?.[0]);
  expect(getFieldValue("relations[1]")).toBe(person.relations?.[1]);
  expect(getFieldValue("relations[1].metAddress.city")).toBe(
    person.relations?.[1].metAddress?.city,
  );
});

test("sets fields properly", () => {
  const obj = {
    a: 1,
    b: 2,
    c: {
      d: 3,
      e: [4, 5],
    },
  };

  type ObjPaths = FieldPath.StringPaths<typeof obj>;

  const getPath = <TPath extends ObjPaths>(stringPath: TPath) => {
    return FieldPath.fromStringPath(stringPath);
  };

  const setFieldValue = <TPath extends FieldPath.Segments>(
    path: TPath,
    value: FieldPath.Resolve<typeof obj, TPath>,
  ) => {
    FieldPath.setValue(obj, path, value);
  };

  setFieldValue(getPath("a"), 99);
  setFieldValue(getPath("b"), 99);
  setFieldValue(getPath("c.d"), 99);
  setFieldValue(getPath("c.e"), [99, 99]);
  setFieldValue(getPath("c.e[2]"), 99);

  expect(obj).toMatchObject({
    a: 99,
    b: 99,
    c: {
      d: 99,
      e: [99, 99, 99],
    },
  });
});
