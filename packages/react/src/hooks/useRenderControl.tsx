import { useRef, useState } from "react";

export function useRenderControl() {
  const [, rerender] = useState(0);
  const renderCount = useRef(0);
  renderCount.current++;

  return {
    renderCount: renderCount.current,
    forceRerender: () => rerender((i) => i + 1),
  };
}
