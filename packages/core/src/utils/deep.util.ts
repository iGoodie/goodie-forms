import { NativeFormValue } from "../types/NativeForm";

export function deepEquals<
  V1 extends NativeFormValue,
  V2 extends NativeFormValue,
>(value1: V1 | undefined, value2: V2 | undefined): boolean {
  if (Object.is(value1, value2)) {
    return true;
  }

  // null / undefined
  if (value1 == null || value2 == null) {
    return (value1 as any) === (value2 as any);
  }

  // Date
  if (value1 instanceof Date) {
    if (!(value2 instanceof Date)) return false;
    return value1.getTime() === value2.getTime();
  }

  // File
  if (value1 instanceof File) {
    if (!(value2 instanceof File)) return false;
    return (
      value1.name === value2.name &&
      value1.size === value2.size &&
      value1.type === value2.type &&
      value1.lastModified === value2.lastModified
    );
  }

  // Blob
  if (value1 instanceof Blob) {
    if (!(value2 instanceof Blob)) return false;
    return value1.size === value2.size && value1.type === value2.type;
  }

  // Array
  if (Array.isArray(value1)) {
    if (!Array.isArray(value2)) return false;

    if (value1.length !== value2.length) {
      return false;
    }

    for (let i = 0; i < value1.length; i++) {
      if (!deepEquals(value1[i], value2[i])) {
        return false;
      }
    }

    return true;
  }

  // Object
  if (typeof value1 === "object" && typeof value2 === "object") {
    const keys1 = Object.keys(value1) as (keyof V1)[];
    const keys2 = Object.keys(value2) as (keyof V2)[];

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      if (!(key in value2)) {
        return false;
      }

      if (!deepEquals(value1[key as never], value2[key as never])) {
        return false;
      }
    }

    return true;
  }

  return false;
}

export function deepClone<V extends NativeFormValue>(value: V): V {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  // Primitives (including null / undefined)
  if (value === null || typeof value !== "object") {
    return value;
  }

  // Date
  if (value instanceof Date) {
    return new Date(value.getTime()) as V;
  }

  // File
  if (value instanceof File) {
    return new File([value], value.name, {
      type: value.type,
      lastModified: value.lastModified,
    }) as V;
  }

  // Blob
  if (value instanceof Blob) {
    return value.slice(0, value.size, value.type) as V;
  }

  // Array
  if (Array.isArray(value)) {
    const cloned: unknown[] = new Array(value.length);
    for (let i = 0; i < value.length; i++) {
      cloned[i] = deepClone(value[i] as NativeFormValue);
    }
    return cloned as V;
  }

  // Object
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(value)) {
    result[key] = deepClone((value as Record<string, NativeFormValue>)[key]);
  }

  return result as V;
}
