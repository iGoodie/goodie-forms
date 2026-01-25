export namespace Field {
  export type Paths<TShape extends object> = {
    [K in keyof TShape & string]: NonNullable<TShape[K]> extends object
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
    ) => Field.GetValue<TShape, TPath>,
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
    current[parts[parts.length - 1]] = modifier(oldValue);
  }
}
