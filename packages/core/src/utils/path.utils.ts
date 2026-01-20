export type ExtractPaths<T extends object> = {
  [K in keyof T & string]: NonNullable<T[K]> extends object
    ? K | `${K}.${ExtractPaths<NonNullable<T[K]>>}`
    : K;
}[keyof T & string];

export type ValueByPath<
  T,
  P extends string,
> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? ValueByPath<NonNullable<T[K]>, Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

export function getByPath<
  TObj extends object,
  TPath extends ExtractPaths<TObj>,
>(obj: TObj, path: TPath): ValueByPath<TObj, TPath> | undefined {
  if (obj == null) return undefined;

  const parts = (path as string).split(".");

  let current: any = obj;
  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }

  return current;
}

export function setByPath<TObj extends object, TKey extends ExtractPaths<TObj>>(
  obj: TObj,
  key: TKey,
  value: ValueByPath<TObj, TKey>,
) {
  const parts = (key as string).split(".");

  let current: any = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] == null) {
      current[part] = {};
    }
    current = current[part];
  }

  current[parts[parts.length - 1]] = value;
}
