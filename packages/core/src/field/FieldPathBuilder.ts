import { FieldPath } from "./FieldPath";

const resolverCall = Symbol("PathResolver");

export namespace FieldPathBuilder {
  export type Proxy<TObject, TPath extends readonly PropertyKey[]> =
    NonNullable<TObject> extends readonly (infer E)[]
      ? {
          [K in number]: Proxy<NonNullable<E>, [...TPath, K]>;
        } & {
          [resolverCall]: TPath;
        }
      : NonNullable<TObject> extends object
        ? {
            [K in keyof TObject]-?: Proxy<
              NonNullable<TObject[K]>,
              [...TPath, K]
            >;
          } & {
            [resolverCall]: TPath;
          }
        : {
            [resolverCall]: TPath;
          };
}

export class FieldPathBuilder<TOutput extends object> {
  protected static wrap<
    TObject extends object,
    TPath extends readonly PropertyKey[],
  >(paths: TPath): FieldPathBuilder.Proxy<TObject, TPath> {
    return new Proxy<TObject>(paths as any, {
      get(_target, p, _receiver) {
        if (p === resolverCall) return paths;
        const key =
          typeof p === "string" ? (/^\d+$/.test(p) ? Number(p) : p) : p;

        // TODO: Branch instead of reallocating a copy
        return FieldPathBuilder.wrap<any, [...TPath, typeof key]>([
          ...paths,
          key,
        ]);
      },
    }) as any;
  }

  public of<TStrPath extends FieldPath.StringPaths<TOutput>>(
    stringPath: TStrPath,
  ): FieldPath.ParseStringPath<TStrPath>;

  public of<TProxy extends FieldPathBuilder.Proxy<any, any>>(
    consumer: (data: FieldPathBuilder.Proxy<TOutput, []>) => TProxy,
  ): TProxy[typeof resolverCall];

  public of(
    arg:
      | FieldPath.StringPaths<TOutput>
      | ((data: FieldPathBuilder.Proxy<TOutput, []>) => any),
  ) {
    if (typeof arg === "function") {
      return arg(FieldPathBuilder.wrap<TOutput, []>([]))[resolverCall];
    }

    return FieldPath.fromStringPath(arg as any);
  }
}

// TODO: Move to a proper test file
/* ---- TESTS ---------------- */

// interface User {
//   name: string;
//   address: {
//     city: string;
//     street: string;
//   };
//   friends: {
//     name: string;
//     tags: string[];
//   }[];
//   coords: [100, 200];
// }

// const builder = new FieldPathBuilder<User>();

// const data: User = {
//   name: "",
//   address: { city: "", street: "" },
//   friends: [{ name: "", tags: ["A", "B"] }],
//   coords: [100, 200] as const,
// };

// const path = builder.fromProxy((data) => data.friends[0].tags[1]);
// //    ^?
// const value = FieldPath.getValue(data, path);
// //    ^?
// console.log(path, "=", value);

// const path2 = builder.fromStringPath("friends[0].tags[0]");
// //    ^?
// const value2 = FieldPath.getValue(data, path2);
// //    ^?
// console.log(path2, "=", value2);

// const path3 = builder.fromStringPath("coords[0]");
// //    ^?
// const value3 = FieldPath.getValue(data, path3);
// console.log(path3, "=", value3);

// const path4 = builder.fromStringPath("coords[1]");
// //    ^?
// const value4 = FieldPath.getValue(data, path4);
// //    ^?
// console.log(path4, "=", value4);

// type Shape = {
//   user?: {
//     profile?: { name?: string };
//     tags?: boolean[];
//   };
// };

// type A = FieldPath.Resolve<Shape, ["user"]>;
// //   ^?

// type A2 = FieldPath.Resolve<Shape, ["user", "profile"]>;
// //   ^?

// type B = FieldPath.Resolve<Shape, ["user", "profile", "name"]>;
// //   ^?

// type C = FieldPath.Resolve<Shape, ["user", "tags", number]>;
// //   ^?

// type C2 = FieldPath.Resolve<Shape, ["user", "tags", 0]>;
// //   ^?

// type D = FieldPath.Resolve<Shape, ["user", "missing"]>;
// //   ^?
