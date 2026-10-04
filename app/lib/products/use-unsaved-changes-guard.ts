import { useEffect, type RefObject } from "react";
import { useBlocker } from "react-router";
import { useConfirm } from "~/context/confirm-context";

export function useUnsavedChangesGuard({
  dirtyRef,
  savedRef,
}: {
  dirtyRef: RefObject<boolean>;
  savedRef: RefObject<boolean>;
}) {
  const confirm = useConfirm();
  const blocker = useBlocker(
    (args) =>
      dirtyRef.current &&
      !savedRef.current &&
      args.nextLocation.pathname !== args.currentLocation.pathname,
  );

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    let active = true;
    (async () => {
      const ok = await confirm({
        title: "Discard changes?",
        description: "You have unsaved changes.",
        confirmLabel: "Discard",
        cancelLabel: "Keep editing",
        destructive: true,
      });
      if (!active) return;
      if (ok) blocker.proceed();
      else blocker.reset();
    })();
    return () => {
      active = false;
    };
  }, [blocker, confirm]);
}
