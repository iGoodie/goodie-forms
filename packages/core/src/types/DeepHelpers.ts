export type DeepPartial<T> = {
  [K in keyof T as T[K] extends (...args: any[]) => any ? K : never]: T[K];
} & {
  [K in keyof T as T[K] extends (...args: any[]) => any
    ? never
    : K]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export type DeepReadonly<T> = {
  [K in keyof T as T[K] extends (...args: any[]) => any ? K : never]: T[K];
} & {
  readonly [K in keyof T as T[K] extends (...args: any[]) => any
    ? never
    : K]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};
