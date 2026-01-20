import { ExtractKeys } from "./type.utils";

export function getByKey<TObj, TKey extends ExtractKeys<TObj>>(
  obj: TObj,
  key: TKey,
): unknown {
  if (obj == null) return undefined;

  const parts = (key as string).split(".");

  let current: any = obj;
  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }

  return current;
}
