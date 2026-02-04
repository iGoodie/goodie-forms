export namespace Reconsile {
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
}
