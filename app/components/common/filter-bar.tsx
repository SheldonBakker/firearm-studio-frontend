import { cn } from "~/lib/utils/cn";
import { statusMeta } from "~/lib/utils/format";

export interface FilterOption {
  id: string;
  label: string;
  n?: number;
}

// Turn a filter label into its STATUS map key, e.g.
// "Renewal due" → "RenewalDue", "No-show" → "NoShow", "In Storage" → "InStorage".
function statusKeyFromLabel(label: string): string {
  return label
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join("");
}

/** Pill-style segmented filter row. The active pill rings in its status color. */
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
        // "All" (and any non-status option) stays neutral; the rest take their
        // status colour from the shared STATUS map. Colored pills always show a
        // tinted background + coloured text; the active one adds a ring border.
        const color =
          f.id === "all" ? null : statusMeta(statusKeyFromLabel(f.label)).color;
        const style: React.CSSProperties | undefined = color
          ? {
              color,
              borderColor: "transparent",
              backgroundColor: `color-mix(in srgb, ${color} ${on ? 20 : 12}%, transparent)`,
              boxShadow: on ? `0 0 0 2px ${color}` : undefined,
            }
          : undefined;
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onChange(f.id)}
            style={style}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[12.5px] font-semibold transition-[color,background-color,box-shadow]",
              !color &&
                (on
                  ? "border-border2 bg-secondary text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"),
            )}
          >
            {f.label}
            {f.n != null && (
              <span
                className={cn(
                  "font-mono text-[11px]",
                  !color && (on ? "text-primary" : "text-dim"),
                )}
                style={color ? { color } : undefined}
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
