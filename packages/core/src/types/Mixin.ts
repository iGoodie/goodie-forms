export type Mixin<T extends object, U extends Partial<T>> = Omit<T, keyof U> &
  U;
