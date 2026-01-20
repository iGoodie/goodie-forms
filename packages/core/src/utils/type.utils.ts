export type Prettify<T> = { [K in keyof T]: T[K] } & {};

export type ExtractKeys<T> = T extends readonly (infer U)[]
  ? ExtractKeys<U>
  : T extends object
    ? {
        [K in keyof T & string]: T[K] extends object
          ? K | `${K}.${ExtractKeys<T[K]>}`
          : K;
      }[keyof T & string]
    : never;
