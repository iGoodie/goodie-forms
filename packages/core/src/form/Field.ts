export namespace Field {
  export type Paths<TShape extends object> = {
    [K in keyof TShape & string]: NonNullable<TShape[K]> extends (
      ...args: any[]
    ) => any
      ? never
      : NonNullable<TShape[K]> extends any[]
        ? K
        : NonNullable<TShape[K]> extends object
          ? K | `${K}.${Paths<NonNullable<TShape[K]>>}`
          : K;
  }[keyof TShape & string];

  export type GetValue<
    TShape extends object,
    TPath extends string,
  > = TPath extends `${infer K}.${infer Rest}`
    ? K extends keyof TShape
      ? GetValue<NonNullable<TShape[K]>, Rest>
      : never
    : TPath extends keyof TShape
      ? TShape[TPath]
      : never;

  export function getValue<
    TShape extends object,
    TPath extends Field.Paths<TShape>,
  >(data: TShape, path: TPath): Field.GetValue<TShape, TPath> | undefined {
    if (data == null) return undefined;

    const parts = (path as string).split(".");

    let current: any = data;

    for (const part of parts) {
      if (current == null) return undefined;
      current = current[part];
    }

    return current;
  }

  export function deepEqual(
    a: any,
    b: any,
    customComparator?: (a: any, b: any) => boolean | undefined,
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
    filter?: (a: T) => boolean,
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

  export function setValue<
    TShape extends object,
    TPath extends Field.Paths<TShape>,
  >(data: TShape, key: TPath, value: Field.GetValue<TShape, TPath>) {
    return modifyValue(data, key, () => value);
  }

  export function modifyValue<
    TShape extends object,
    TPath extends Field.Paths<TShape>,
  >(
    data: TShape,
    key: TPath,
    modifier: (
      currentValue: Field.GetValue<TShape, TPath>,
    ) => Field.GetValue<TShape, TPath> | void,
  ) {
    const parts = (key as string).split(".");

    let current: any = data;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (current[part] == null) {
        current[part] = {};
      }
      current = current[part];
    }

    const oldValue = current[parts[parts.length - 1]];
    const newValue = modifier(oldValue);

    if (newValue !== undefined) {
      current[parts[parts.length - 1]] = newValue;
    }
  }

  export function deleteValue<
    TShape extends object,
    TPath extends Field.Paths<TShape>,
  >(data: TShape, key: TPath) {
    const parts = (key as string).split(".");

    let current: any = data;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (current[part] == null) {
        return;
      }
      current = current[part];
    }

    delete current[parts[parts.length - 1]];
  }
}
