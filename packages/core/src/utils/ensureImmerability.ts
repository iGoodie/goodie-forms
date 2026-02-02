import { immerable } from "immer";

export function ensureImmerability(value: any) {
  if (typeof value !== "object" || value === null) return;

  // Skip plain objects
  const proto = Object.getPrototypeOf(value);
  if (proto === Object.prototype || proto === null) return;

  const ctor = proto.constructor;
  if (typeof ctor !== "function") return;

  // Skip known built-ins
  if (
    value instanceof Date ||
    value instanceof RegExp ||
    value instanceof Map ||
    value instanceof Set ||
    value instanceof WeakMap ||
    value instanceof WeakSet ||
    ArrayBuffer.isView(value)
  ) {
    return;
  }

  if (ctor[immerable] === true) return;

  // Define non-enumerable immerable flag
  ctor[immerable] = true;
}
