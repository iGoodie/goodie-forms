import { FieldPath } from "./FieldPath";

const resolverCall = Symbol("PathResolver");

export namespace FieldPathBuilder {
  export type Proxy<
    TObject,
    TPath extends readonly PropertyKey[],
  > = TObject extends readonly (infer E)[]
    ? Proxy<E, [...TPath, number]> & {
        [K in number]: Proxy<E, [...TPath, K]>;
      }
    : TObject extends object
      ? {
          [K in keyof TObject]-?: Proxy<TObject[K], [...TPath, K]>;
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

  public createPathProxy() {
    return FieldPathBuilder.wrap<TOutput, []>([]);
  }

  public buildFromPathString<TStrPath extends FieldPath.StringPaths<TOutput>>(
    stringPath: TStrPath,
  ) {
    const result: Array<string | number> = [];

    let i = 0;

    while (i < stringPath.length) {
      const char = stringPath[i];

      // dot separator
      if (char === ".") {
        i++;
        continue;
      }

      // bracket index: [123]
      if (char === "[") {
        i++; // skip '['
        let num = "";

        while (i < stringPath.length && stringPath[i] !== "]") {
          num += stringPath[i];
          i++;
        }

        i++; // skip ']'

        if (!num || !/^\d+$/.test(num)) {
          throw new Error(`Invalid array index in path: ${stringPath}`);
        }

        result.push(Number(num));
        continue;
      }

      // identifier
      let key = "";
      while (i < stringPath.length && /[^\.\[]/.test(stringPath[i])) {
        key += stringPath[i];
        i++;
      }

      if (key) {
        result.push(key);
      }
    }

    return result as FieldPath.ParseStringPath<TStrPath>;
  }

  public buildFromProxy<TProxy extends FieldPathBuilder.Proxy<any, any>>(
    pathProxy: TProxy,
  ): TProxy[typeof resolverCall] {
    return pathProxy[resolverCall];
  }
}

/* ---- TESTS ---------------- */

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
}

const builder = new FieldPathBuilder<User>();
const proxy = builder.createPathProxy();

const data: User = {
  name: "",
  address: { city: "", street: "" },
  friends: [{ name: "", tags: ["A", "B"] }],
};

const pathProxy = proxy.friends[0].tags[1];
type X1 = typeof pathProxy;
//   ^?
type X2 = X1[typeof resolverCall];
//   ^?

const path = builder.buildFromProxy(pathProxy);
//    ^?
const value = FieldPath.getValue(data, path);
//    ^?

const path2 = builder.buildFromPathString("friends[0].tags[0]");
//    ^?
const value2 = FieldPath.getValue(data, path2);
//    ^?

console.log(pathProxy, "=", value);
console.log(path2, "=", value2);

type Shape = {
  user?: {
    profile?: { name?: string };
    tags?: boolean[];
  };
};

type A = FieldPath.Resolve<Shape, ["user"]>;
//   ^?

type A2 = FieldPath.Resolve<Shape, ["user", "profile"]>;
//   ^?

type B = FieldPath.Resolve<Shape, ["user", "profile", "name"]>;
//   ^?

type C = FieldPath.Resolve<Shape, ["user", "tags", number]>;
//   ^?

type C2 = FieldPath.Resolve<Shape, ["user", "tags", 0]>;
//   ^?

type D = FieldPath.Resolve<Shape, ["user", "missing"]>;
//   ^?
