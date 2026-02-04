export namespace FieldPath {
  export type Segments = readonly PropertyKey[];
  export type CanonicalPath = string;
  export type StringPath = string;

  export function toCanonicalPath(path: Segments) {
    return path.join(".") as CanonicalPath;
  }

  export function toStringPath(path: Segments) {
    const normalizedPath = normalize(path);
    let result = "";

    for (const fragment of normalizedPath) {
      if (typeof fragment === "number") {
        result += `[${fragment}]`;
      } else {
        if (result.length > 0) {
          result += ".";
        }
        result += fragment.toString();
      }
    }

    return result;
  }

  export function fromStringPath<TStrPath extends string>(
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

  export function normalize<T extends readonly any[] | undefined>(path: T) {
    return path?.map((segment) => {
      if (typeof segment === "string") return segment;
      if (typeof segment === "number") return segment;
      if (typeof segment === "symbol") return segment;
      if (typeof segment === "object" && "key" in segment) {
        if (typeof segment === "string") return segment;
        if (typeof segment === "number") return segment;
        if (typeof segment === "symbol") return segment;
        return segment.key;
      }
    }) as Segments;
  }

  export function equals(path1?: Segments, path2?: Segments) {
    if (path1 === path2) return true;
    if (path1 == null) return false;
    if (path2 == null) return false;
    if (path1.length !== path2.length) return false;
    for (let i = 0; i < path1.length; i++) {
      if (path1[i] !== path2[i]) return false;
    }
    return true;
  }
  export function isDescendant(parentPath: Segments, childPath: Segments) {
    if (parentPath.length >= childPath.length) return false;

    for (let i = 0; i < parentPath.length; i++) {
      if (parentPath[i] !== childPath[i]) {
        return false;
      }
    }

    return true;
  }

  type Unfoldable<T> = T & { _____foldMark?: never } & {};

  export type Resolve<
    TObject,
    TPath extends readonly PropertyKey[],
  > = TPath extends []
    ? TObject
    : TPath extends readonly [infer Prop, ...infer Rest]
      ? Rest extends readonly PropertyKey[]
        ? Resolve<ResolveStep<TObject, Prop>, Rest>
        : never
      : never;

  type ResolveStep<TObject, TKey> =
    NonNullable<TObject> extends infer U
      ? U extends readonly unknown[]
        ? number extends U["length"]
          ? TKey extends number | `${number}`
            ? U[number]
            : never
          : TKey extends keyof U
            ? U[TKey]
            : TKey extends `${infer N extends number}`
              ? U[N]
              : never
        : TKey extends keyof U
          ? U[TKey]
          : never
      : never;

  export type StringPaths<TObject extends object> = StringPathsImpl<
    CanonicalStringPaths<TObject>
  >;

  type StringPathsImpl<TCanonicalStringPaths extends string> =
    TCanonicalStringPaths extends `${string}[*]${string}`
      ?
          | ReplaceAll<TCanonicalStringPaths, "[*]", "[0]">
          | Unfoldable<ReplaceAll<TCanonicalStringPaths, "[*]", `[${number}]`>>
      : TCanonicalStringPaths;

  type CanonicalStringPaths<TObject extends object> = {
    [K in keyof TObject & string]: NonNullable<TObject[K]> extends (
      ...args: any[]
    ) => any
      ? never
      : NonNullable<TObject[K]> extends (infer U)[]
        ? U extends object
          ? K | `${K}[*]` | `${K}[*].${CanonicalStringPaths<NonNullable<U>>}`
          : K | `${K}[*]`
        : NonNullable<TObject[K]> extends object
          ? K | `${K}.${CanonicalStringPaths<NonNullable<TObject[K]>>}`
          : K;
  }[keyof TObject & string];

  type ReplaceAll<
    TString extends string,
    TMatch extends string,
    TReplace extends string | number,
  > = TString extends `${infer A}${TMatch}${infer B}`
    ? `${A}${TReplace}${ReplaceAll<B, TMatch, TReplace>}`
    : TString;

  export type ParseStringPath<TStrPath extends string> = ParseStringPathImpl<
    NormalizeStrPath<TStrPath>,
    []
  >;

  type ParseStringPathImpl<
    TStrPath extends string,
    TPath extends PropertyKey[],
  > = TStrPath extends ""
    ? TPath
    : TStrPath extends `.${infer Rest}`
      ? ParseStringPathImpl<Rest, TPath>
      : TStrPath extends `[${infer Bracket}]${infer Rest}`
        ? ParseStringPathImpl<Rest, [...TPath, ParseBracket<Bracket>]>
        : TStrPath extends `${infer Head}.${infer Rest}`
          ? ParseStringPathImpl<Rest, [...TPath, Head]>
          : TStrPath extends `${infer Head}[${infer Tail}`
            ? ParseStringPathImpl<`[${Tail}`, [...TPath, Head]>
            : [...TPath, TStrPath];

  type NormalizeStrPath<TStringPath extends string> =
    TStringPath extends `${infer A}[${infer B}]${infer Rest}`
      ? NormalizeStrPath<`${A}.${B}${Rest}`>
      : TStringPath extends `.${infer R}`
        ? NormalizeStrPath<R>
        : TStringPath;

  type ParseBracket<TString extends string> =
    TString extends `${infer N extends number}`
      ? N
      : TString extends `"${infer K}"`
        ? K
        : TString extends `'${infer K}'`
          ? K
          : never;

  export function getValue<
    TObject extends object,
    const TPath extends readonly PropertyKey[],
  >(
    object: TObject,
    path: TPath,
  ): FieldPath.Resolve<TObject, TPath> | undefined {
    let current: any = object;

    for (const pathFragment of path) {
      if (current == null) return undefined;
      current = current[pathFragment];
    }

    return current;
  }

  export function setValue<
    TObject extends object,
    const TPath extends readonly PropertyKey[],
  >(object: TObject, key: TPath, value: FieldPath.Resolve<TObject, TPath>) {
    return FieldPath.modifyValue(object, key, () => value);
  }

  export function modifyValue<
    TObject extends object,
    const TPath extends readonly PropertyKey[],
  >(
    object: TObject,
    path: TPath,
    modifier: (
      currentValue: FieldPath.Resolve<TObject, TPath>,
    ) => FieldPath.Resolve<TObject, TPath> | void,
  ) {
    let current: any = object;

    for (let i = 0; i < path.length - 1; i++) {
      const pathFragment = path[i];
      const nextFragment = path[i + 1];

      if (current[pathFragment] == null) {
        current[pathFragment] = typeof nextFragment === "number" ? [] : {};
      }

      current = current[pathFragment];
    }

    const lastFragment = path[path.length - 1];

    const oldValue = current[lastFragment];
    const newValue = modifier(oldValue);

    if (newValue !== undefined) {
      current[lastFragment] = newValue;
    }
  }

  export function deleteValue<
    TObject extends object,
    TPath extends readonly PropertyKey[],
  >(object: TObject, path: TPath) {
    let current: any = object;

    for (let i = 0; i < path.length - 1; i++) {
      const pathFragment = path[i];

      if (current[pathFragment] == null) return;

      current = current[pathFragment];
    }

    const lastFragment = path[path.length - 1];

    delete current[lastFragment];
  }
}

const x = {} as { foo: { bar: string[] } };
FieldPath.setValue(x, FieldPath.fromStringPath("foo.bar[9]"), "C");
console.log(x); // <-- { foo: { bar: [<9xempty>, "C"] } }
