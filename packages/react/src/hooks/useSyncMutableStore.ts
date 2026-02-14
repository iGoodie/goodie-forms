import { useCallback, useRef, useSyncExternalStore } from "react";

export function useSyncMutableStore<T>(
  subscribe: (onVersionChange: () => void) => () => void,
  getValue: () => T,
) {
  const versionRef = useRef(0);

  const subscribeWithVersion = useCallback(
    (onStoreChange: () => void) => {
      return subscribe(() => {
        versionRef.current++;
        onStoreChange();
      });
    },
    [subscribe],
  );

  const getSnapshot = useCallback(() => {
    return versionRef.current;
  }, []);

  useSyncExternalStore(subscribeWithVersion, getSnapshot, getSnapshot);

  return getValue();
}
