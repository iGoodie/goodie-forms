import { FieldPath } from "./FieldPath";

const resolverCall = Symbol("PathResolver");

export namespace FieldPathBuilder {
  export type Proxy<TObject, TPath extends readonly PropertyKey[]> =
    NonNullable<TObject> extends readonly (infer E)[]
      ? {
          [K in number]: Proxy<NonNullable<E>, [...TPath, K]>;
        } & {
          [resolverCall]: TPath;
        }
      : NonNullable<TObject> extends object
        ? {
            [K in keyof TObject]-?: Proxy<
              NonNullable<TObject[K]>,
              [...TPath, K]
            >;
          } & {
            [resolverCall]: TPath;
          }
        : {
            [resolverCall]: TPath;
          };
}

export class FieldPathBuilder<TOutput extends object> {
  protected static wrap<
    TObject extends object,
    TPath extends readonly PropertyKey[],
  >(paths: TPath): FieldPathBuilder.Proxy<TObject, TPath> {
    return new Proxy<TObject>(paths as any, {
      get(_target, p, _receiver) {
        if (p === resolverCall) return paths;
        const key =
          typeof p === "string" ? (/^\d+$/.test(p) ? Number(p) : p) : p;

        // TODO: Branch instead of reallocating a copy
        return FieldPathBuilder.wrap<any, [...TPath, typeof key]>([
          ...paths,
          key,
        ]);
      },
    }) as any;
  }

  public of<TStrPath extends FieldPath.StringPaths<TOutput>>(
    stringPath: TStrPath,
  ): FieldPath.ParseStringPath<TStrPath>;

  public of<TProxy extends FieldPathBuilder.Proxy<any, any>>(
    consumer: (data: FieldPathBuilder.Proxy<TOutput, []>) => TProxy,
  ): TProxy[typeof resolverCall];

  public of(
    arg:
      | FieldPath.StringPaths<TOutput>
      | ((data: FieldPathBuilder.Proxy<TOutput, []>) => any),
  ) {
    if (typeof arg === "function") {
      return arg(FieldPathBuilder.wrap<TOutput, []>([]))[resolverCall];
    }

    return FieldPath.fromStringPath(arg as any);
  }
}
