export type Suppliable<T> = T | (() => T);

export function supply<T>(suppliable: T | (() => T)): T {
  return typeof suppliable === "function"
    ? (suppliable as () => T)()
    : suppliable;
}
