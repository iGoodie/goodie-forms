export function composeFns<TFns extends (() => void)[]>(...fns: TFns) {
  return () => {
    for (const fn of fns) {
      fn();
    }
  };
}
