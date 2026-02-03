import { startTransition, useRef, useState } from "react";

export function useRenderControl() {
  const [, rerender] = useState(0);
  const renderCount = useRef(0);
  const renderScheduled = useRef(false);
  renderCount.current++;

  const scheduleRerender = () => {
    if (renderScheduled.current) return;
    renderScheduled.current = true;

    queueMicrotask(() => {
      startTransition(() => {
        rerender((i) => i + 1);
      });

      renderScheduled.current = false;
    });
  };

  return {
    renderCount: renderCount.current,
    forceRerender: scheduleRerender,
  };
}
