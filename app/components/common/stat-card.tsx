import { Icon, type IconName } from "./icon";
import { cn } from "~/lib/utils";

/** Dashboard stat tile: label, big mono value, sub-line, accent icon chip. */
export function StatCard({
  label,
  value,
  sub,
  icon,
  color,
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  sub: React.ReactNode;
  icon: IconName;
  color: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col gap-3.5 rounded-2xl border border-border bg-card p-[18px] text-left transition-all",
        onClick && "cursor-pointer hover:-translate-y-0.5 hover:border-border2",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">
          {label}
        </span>
        <span
          className="flex h-8 w-8 items-center justify-center rounded-[9px]"
          style={{
            color,
            background: `color-mix(in srgb, ${color} 14%, transparent)`,
          }}
        >
          <Icon name={icon} size={17} />
        </span>
      </div>
      <div>
        <div className="font-mono text-[27px] font-bold leading-none tracking-tight text-foreground">
          {value}
        </div>
        <div className="mt-1.5 text-xs text-dim">{sub}</div>
      </div>
    </button>
  );
}
