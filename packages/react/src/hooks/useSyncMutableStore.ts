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
    const value = getValue();

    // Here to handle the case when the store initially returns undefined, but later has a value.
    // This ensures that the component will re-render when the store gets its initial value.
    if (value == null) return `EMPTY::${versionRef.current}`;

    return versionRef.current;
  }, []);

  useSyncExternalStore(subscribeWithVersion, getSnapshot, getSnapshot);

  return getValue();
}
