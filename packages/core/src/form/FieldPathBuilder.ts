const resolverCall = Symbol("PathResolver");

export namespace FieldPath {
  type Unfoldable<T> = T & { _____foldMark?: never } & {};

  export type Resolve<
    TShape,
    TPath extends readonly PropertyKey[]
  > = TPath extends []
    ? TShape
    : TPath extends readonly [infer Prop, ...infer Rest]
    ? Rest extends readonly PropertyKey[]
      ? Resolve<ResolveStep<TShape, Prop>, Rest>
      : never
    : never;

  type ResolveStep<TShape, TKey> = NonNullable<TShape> extends infer U
    ? U extends readonly (infer E)[]
      ? TKey extends number | `${number}`
        ? E
        : never
      : TKey extends keyof U
      ? U[TKey]
      : never
    : never;

  export type StringPaths<TShape extends object> = StringPathsImpl<
    CanonicalStringPaths<TShape>
  >;

  type StringPathsImpl<T> = T extends string
    ? T extends `${string}[*]${string}`
      ?
          | ReplaceAll<T, "[*]", "[0]">
          | Unfoldable<ReplaceAll<T, "[*]", `[${number}]`>>
      : T
    : never;

  type CanonicalStringPaths<TShape extends object> = {
    [K in keyof TShape & string]: NonNullable<TShape[K]> extends (
      ...args: any[]
    ) => any
      ? never
      : NonNullable<TShape[K]> extends (infer U)[]
      ? U extends object
        ? K | `${K}[*]` | `${K}[*].${CanonicalStringPaths<NonNullable<U>>}`
        : K | `${K}[*]`
      : NonNullable<TShape[K]> extends object
      ? K | `${K}.${CanonicalStringPaths<NonNullable<TShape[K]>>}`
      : K;
  }[keyof TShape & string];

  type ReplaceAll<
    TString extends string,
    TMatch extends string,
    TReplace extends string | number
  > = TString extends `${infer A}${TMatch}${infer B}`
    ? `${A}${TReplace}${ReplaceAll<B, TMatch, TReplace>}`
    : TString;

  export type ParseStringPath<TStrPath extends string> = ParseStringPathImpl<
    NormalizeStrPath<TStrPath>,
    []
  >;

  type ParseStringPathImpl<
    S extends string,
    Acc extends PropertyKey[]
  > = S extends ""
    ? Acc
    : S extends `.${infer Rest}`
    ? ParseStringPathImpl<Rest, Acc>
    : S extends `[${infer Bracket}]${infer Rest}`
    ? ParseStringPathImpl<Rest, [...Acc, ParseBracket<Bracket>]>
    : S extends `${infer Head}.${infer Rest}`
    ? ParseStringPathImpl<Rest, [...Acc, Head]>
    : S extends `${infer Head}[${infer Tail}`
    ? ParseStringPathImpl<`[${Tail}`, [...Acc, Head]>
    : [...Acc, S];

  type NormalizeStrPath<TPath extends string> =
    TPath extends `${infer A}[${infer B}]${infer Rest}`
      ? NormalizeStrPath<`${A}.${B}${Rest}`>
      : TPath extends `.${infer R}`
      ? NormalizeStrPath<R>
      : TPath;

  type ParseBracket<S extends string> = S extends `${infer N extends number}`
    ? N
    : S extends `"${infer K}"`
    ? K
    : S extends `'${infer K}'`
    ? K
    : never;
}

export namespace FieldPathBuilder {
  export type Proxy<
    TShape,
    TPath extends readonly PropertyKey[]
  > = TShape extends readonly (infer E)[]
    ? Proxy<E, [...TPath, number]> & {
        [K in number]: Proxy<E, [...TPath, K]>;
      }
    : TShape extends object
    ? {
        [K in keyof TShape]-?: Proxy<TShape[K], [...TPath, K]>;
      } & {
        [resolverCall]: TPath;
      }
    : {
        [resolverCall]: TPath;
      };
}

export class FieldPathBuilder<TShape extends object> {
  protected static wrap<
    TShape extends object,
    TPath extends readonly PropertyKey[]
  >(paths: TPath): FieldPathBuilder.Proxy<TShape, TPath> {
    return new Proxy<TShape>(paths as any, {
      get(_target, p, _receiver) {
        if (p === resolverCall) return paths;
        // TODO: Branch instead of reallocating a copy
        return FieldPathBuilder.wrap<any, [...TPath, typeof p]>([...paths, p]);
      },
    }) as any;
  }

  public static getValue<TShape extends object, TPath extends PropertyKey[]>(
    data: TShape,
    path: TPath
  ): FieldPath.Resolve<TShape, TPath> | undefined {
    let current: any = data;

    for (const pathFragment of path) {
      if (current == null) return undefined;
      current = current[pathFragment];
    }

    return current;
  }

  public resolve<TProxy extends FieldPathBuilder.Proxy<any, any>>(
    pathProxy: TProxy
  ): TProxy[typeof resolverCall] {
    return pathProxy[resolverCall];
  }

  public createPathProxy() {
    return FieldPathBuilder.wrap<TShape, []>([]);
  }

  public createPathFromString() {
    return <TStrPath extends FieldPath.StringPaths<TShape>>(
      stringPath: TStrPath
    ): FieldPath.ParseStringPath<TStrPath> => {
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

          result.push(num);
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
    };
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
const pathFromString = builder.createPathFromString();

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

const path = builder.resolve(pathProxy);
//    ^?
const value = FieldPathBuilder.getValue(data, path);
//    ^?

const path2 = pathFromString("friends[0].tags[0]");
//    ^?
const value2 = FieldPathBuilder.getValue(data, path);
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
