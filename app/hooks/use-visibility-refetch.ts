import { useEffect, useRef } from "react";

export function useVisibilityRefetch(
  thresholdMs: number,
  onReturn: () => void,
): void {
  const hiddenAt = useRef<number | null>(null);
  const onReturnRef = useRef(onReturn);
  onReturnRef.current = onReturn;

  useEffect(() => {
    if (typeof document === "undefined") return;
    function handle() {
      if (document.hidden) {
        hiddenAt.current = Date.now();
        return;
      }
      const since = hiddenAt.current;
      hiddenAt.current = null;
      if (since !== null && Date.now() - since >= thresholdMs) {
        onReturnRef.current();
      }
    }
    document.addEventListener("visibilitychange", handle);
    return () => document.removeEventListener("visibilitychange", handle);
  }, [thresholdMs]);
}
