import { expect, test } from "vitest";
import { FieldPath } from "../field/FieldPath";
import { FieldPathBuilder } from "../field/FieldPathBuilder";

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
  coords: [100, 200];
}

const builder = new FieldPathBuilder<User>();

const data: User = {
  name: "",
  address: { city: "", street: "" },
  friends: [{ name: "", tags: ["A", "B"] }],
  coords: [100, 200] as const,
};

test("builds path segments from proxy and string paths", () => {
  const path1 = builder.of((data) => data.friends[0].tags[1]);
  const value1 = FieldPath.getValue(data, path1);
  expect(path1).toStrictEqual(["friends", 0, "tags", 1]);
  expect(value1).toStrictEqual(data.friends[0].tags[1]);

  const path2 = builder.of("friends[0].tags[0]");
  const value2 = FieldPath.getValue(data, path2);
  expect(path2).toStrictEqual(["friends", 0, "tags", 0]);
  expect(value2).toStrictEqual(data.friends[0].tags[0]);

  const path3 = builder.of("friends[0].tags");
  const value3 = FieldPath.getValue(data, path3);
  expect(path3).toStrictEqual(["friends", 0, "tags"]);
  expect(value3).toStrictEqual(data.friends[0].tags);

  const path4 = builder.of("coords[1]");
  const value4 = FieldPath.getValue(data, path4);
  expect(path4).toStrictEqual(["coords", 1]);
  expect(value4).toStrictEqual(data.coords[1]);
});
