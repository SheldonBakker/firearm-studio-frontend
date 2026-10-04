import { useEffect, useState } from "react";
import { Icon } from "~/components/common/icon";
import { cn } from "~/lib/utils/cn";

export function StockStepper({
  value,
  disabled,
  onCommit,
}: {
  value: number;
  disabled?: boolean;
  onCommit: (next: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  function commit(raw: string) {
    const next = Number(raw);
    if (!Number.isInteger(next) || next < 0) {
      setDraft(String(value));
      return;
    }
    if (next !== value) onCommit(next);
    else setDraft(String(value));
  }

  function step(delta: number) {
    const next = value + delta;
    if (next < 0) return;
    onCommit(next);
  }

  return (
    <div
      className="inline-flex items-center gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        aria-label="Decrease stock"
        disabled={disabled || value <= 0}
        onClick={() => step(-1)}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        <span aria-hidden="true" className="h-0.5 w-3 rounded-full bg-current" />
      </button>
      <input
        aria-label="Stock quantity"
        inputMode="numeric"
        disabled={disabled}
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit((e.target as HTMLInputElement).value);
          }
        }}
        className={cn(
          "h-7 w-12 rounded-lg border border-border bg-background text-center font-mono text-[12.5px] outline-none focus:border-primary disabled:opacity-50",
          value === 0 && "text-[color:var(--status-amber)]",
        )}
      />
      <button
        type="button"
        aria-label="Increase stock"
        disabled={disabled}
        onClick={() => step(1)}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        <Icon name="plus" size={14} />
      </button>
    </div>
  );
}
