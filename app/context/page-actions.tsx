import { createContext, useContext, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Lets a route publish its primary action button (e.g. "Add firearm") into the
 * Topbar without lifting the button's dialog state out of the page. The Topbar
 * renders a slot element; pages portal their actions into it.
 */
const SlotContext = createContext<HTMLElement | null>(null);
const SetSlotContext = createContext<(el: HTMLElement | null) => void>(() => {});

export function PageActionsProvider({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  return (
    <SetSlotContext.Provider value={setSlot}>
      <SlotContext.Provider value={slot}>{children}</SlotContext.Provider>
    </SetSlotContext.Provider>
  );
}

/** Rendered once by the Topbar as the destination for page actions. */
export function PageActionsSlot({ className }: { className?: string }) {
  const setSlot = useContext(SetSlotContext);
  return <div ref={setSlot} className={className} />;
}

/** Rendered by a route to inject its action buttons into the Topbar slot. */
export function PageActions({ children }: { children: ReactNode }) {
  const slot = useContext(SlotContext);
  if (!slot) return null;
  return createPortal(children, slot);
}
