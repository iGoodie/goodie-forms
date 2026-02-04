import { StandardSchemaV1 } from "@standard-schema/spec";

/** @deprecated This approach has performance issues.
 * Switching to proxy based path declaration,
 * so TPath is not carried anywhere other than path declaring time. */
export namespace Field {
  type Unfoldable<T> = T & { _____foldMark?: never } & {};

  export type Paths<TShape extends object> = PathsImpl<CanonicalPaths<TShape>>;

  type PathsImpl<T> = T extends string
    ? T extends `${string}[*]${string}`
      ?
          | ReplaceAll<T, "[*]", "[0]">
          | Unfoldable<ReplaceAll<T, "[*]", `[${number}]`>>
      : T
    : never;

  type CanonicalPaths<TShape extends object> = {
    [K in keyof TShape & string]: NonNullable<TShape[K]> extends (
      ...args: any[]
    ) => any
      ? never
      : NonNullable<TShape[K]> extends (infer U)[]
      ? U extends object
        ? K | `${K}[*]` | `${K}[*].${CanonicalPaths<NonNullable<U>>}`
        : K | `${K}[*]`
      : NonNullable<TShape[K]> extends object
      ? K | `${K}.${CanonicalPaths<NonNullable<TShape[K]>>}`
      : K;
  }[keyof TShape & string];

  type ReplaceAll<
    TString extends string,
    TMatch extends string,
    TReplace extends string | number
  > = TString extends `${infer A}${TMatch}${infer B}`
    ? `${A}${TReplace}${ReplaceAll<B, TMatch, TReplace>}`
    : TString;

  export type GetValue<TShape, TPath extends string> = GetValueImpl<
    TShape,
    NormalizePath<TPath>
  >;

  type GetValueImpl<
    TShape,
    TPath extends string
  > = TPath extends `${infer Head}.${infer Tail}`
    ? GetValueImpl<ResolveFragment<NonNullable<TShape>, Head>, Tail>
    : ResolveFragment<NonNullable<TShape>, TPath>;

  type NormalizePath<TPath extends string> =
    TPath extends `${infer A}[${infer B}]${infer Rest}`
      ? NormalizePath<`${A}.${B}${Rest}`>
      : TPath extends `.${infer R}`
      ? NormalizePath<R>
      : TPath;

  type ResolveFragment<
    TShape,
    TFragment extends string
  > = TFragment extends `${number}`
    ? TShape extends readonly (infer U)[]
      ? U
      : never
    : TFragment extends keyof TShape
    ? TShape[TFragment]
    : never;

  export function deepEqual(
    a: any,
    b: any,
    customComparator?: (a: any, b: any) => boolean | undefined
  ) {
    if (a === b) return true;

    if (a === null || b === null) return false;
    if (typeof a !== "object" || typeof b !== "object") return false;

    // Arrays
    if (Array.isArray(a)) {
      if (!Array.isArray(b) || a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!deepEqual(a[i], b[i])) return false;
      }
      return true;
    }

    // Allow custom comparison
    if (customComparator != null) {
      const result = customComparator(a, b);
      if (result !== undefined) return result;
    }

    // Dates
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }

    // RegExp
    if (a instanceof RegExp && b instanceof RegExp) {
      return a.source === b.source && a.flags === b.flags;
    }

    // Map
    if (a instanceof Map && b instanceof Map) {
      if (a.size !== b.size) return false;
      for (const [key, val] of a) {
        if (!b.has(key) || !deepEqual(val, b.get(key))) return false;
      }
      return true;
    }

    // Set
    if (a instanceof Set && b instanceof Set) {
      if (a.size !== b.size) return false;
      for (const val of a) {
        if (!b.has(val)) return false;
      }
      return true;
    }

    // Plain / class objects
    if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) {
      return false;
    }

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }

    return true;
  }

  export function diff<T>(
    prev: readonly T[],
    next: readonly T[],
    equals: (a: T, b: T) => boolean,
    filter?: (a: T) => boolean
  ) {
    const added: T[] = [];
    const removed: T[] = [];
    const unchanged: T[] = [];

    for (const n of next) {
      if (prev.some((p) => equals(p, n))) {
        if (filter?.(n) ?? true) unchanged.push(n);
      } else {
        if (filter?.(n) ?? true) added.push(n);
      }
    }

    for (const p of prev) {
      if (!next.some((n) => equals(p, n))) {
        if (filter?.(p) ?? true) removed.push(p);
      }
    }

    return { added, removed, unchanged };
  }

  export function parsePathFragments(path: string) {
    const result: Array<string | number> = [];

    let i = 0;

    while (i < path.length) {
      const char = path[i];

      // dot separator
      if (char === ".") {
        i++;
        continue;
      }

      // bracket index: [123]
      if (char === "[") {
        i++; // skip '['
        let num = "";

        while (i < path.length && path[i] !== "]") {
          num += path[i];
          i++;
        }

        i++; // skip ']'

        if (!num || !/^\d+$/.test(num)) {
          throw new Error(`Invalid array index in path: ${path}`);
        }

        result.push(Number(num));
        continue;
      }

      // identifier
      let key = "";
      while (i < path.length && /[^\.\[]/.test(path[i])) {
        key += path[i];
        i++;
      }

      if (key) {
        result.push(key);
      }
    }

    return result;
  }

  export function parsePath(
    fragments: readonly (PropertyKey | StandardSchemaV1.PathSegment)[]
  ) {
    let result = "";

    for (const fragment of fragments) {
      const pathFragment =
        typeof fragment === "object" && "key" in fragment
          ? fragment.key
          : fragment;

      if (typeof pathFragment === "number") {
        result += `[${pathFragment}]`;
      } else {
        if (result.length > 0) {
          result += ".";
        }
        result += pathFragment.toString();
      }
    }

    return result;
  }

  export function isDescendant(parentPath: string, childPath: string) {
    const parentFrags = parsePathFragments(parentPath);
    const childFrags = parsePathFragments(childPath);

    if (parentFrags.length >= childFrags.length) return false;

    for (let i = 0; i < parentFrags.length; i++) {
      if (parentFrags[i] !== childFrags[i]) {
        return false;
      }
    }

    return true;
  }

  export function _getValue<
    TShape extends object,
    TPath extends Field.Paths<TShape>
  >(data: TShape, path: TPath): Field.GetValue<TShape, TPath> | undefined {
    if (data == null) return undefined;

    const pathFragments = parsePathFragments(path);

    let current: any = data;

    for (const pathFragment of pathFragments) {
      if (current == null) return undefined;
      current = current[pathFragment];
    }

    return current;
  }

  export function getValue<TShape extends object, TPath extends PropertyKey[]>(
    data: TShape,
    path: TPath
  ) {
    let current: any = data;

    for (const pathFragment of path) {
      if (current == null) return undefined;
      current = current[pathFragment];
    }

    return current;
  }

  export function setValue<
    TShape extends object,
    TPath extends Field.Paths<TShape>
  >(data: TShape, key: TPath, value: Field.GetValue<TShape, TPath>) {
    return modifyValue(data, key, () => value);
  }

  export function modifyValue<
    TShape extends object,
    TPath extends Field.Paths<TShape>
  >(
    data: TShape,
    path: TPath,
    modifier: (
      currentValue: Field.GetValue<TShape, TPath>
    ) => Field.GetValue<TShape, TPath> | void
  ) {
    const pathFragments = parsePathFragments(path);

    let current: any = data;

    for (let i = 0; i < pathFragments.length - 1; i++) {
      const pathFragment = pathFragments[i];
      const nextFragment = pathFragments[i + 1];

      if (current[pathFragment] == null) {
        current[pathFragment] = typeof nextFragment === "number" ? [] : {};
      }

      current = current[pathFragment];
    }

    const lastFragment = pathFragments[pathFragments.length - 1];

    const oldValue = current[lastFragment];
    const newValue = modifier(oldValue);

    if (newValue !== undefined) {
      current[lastFragment] = newValue;
    }
  }

  export function deleteValue<
    TShape extends object,
    TPath extends Field.Paths<TShape>
  >(data: TShape, path: TPath) {
    const pathFragments = parsePathFragments(path);

    let current: any = data;

    for (let i = 0; i < pathFragments.length - 1; i++) {
      const pathFragment = pathFragments[i];

      if (current[pathFragment] == null) return;

      current = current[pathFragment];
    }

    const lastFragment = pathFragments[pathFragments.length - 1];

    delete current[lastFragment];
  }
}
