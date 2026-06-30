import { cn } from "~/lib/utils/cn";

export interface FilterOption {
  id: string;
  label: string;
  n?: number;
}

/** Pill-style segmented filter row. */
export function FilterBar({
  options,
  active,
  onChange,
  right,
}: {
  options: FilterOption[];
  active: string;
  onChange: (id: string) => void;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {options.map((f) => {
        const on = active === f.id;
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onChange(f.id)}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[12.5px] font-semibold transition-colors",
              on
                ? "border-border2 bg-secondary text-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
            {f.n != null && (
              <span
                className={cn(
                  "font-mono text-[11px]",
                  on ? "text-primary" : "text-dim",
                )}
              >
                {f.n}
              </span>
            )}
          </button>
        );
      })}
      {right && <div className="ml-auto">{right}</div>}
    </div>
  );
}
