import { statusMeta } from "~/lib/utils/format";

/** Pill badge driven by the shared status map (color dot + label). */
export function StatusBadge({
  status,
  dot = true,
}: {
  status: string | null | undefined;
  dot?: boolean;
}) {
  const { color, label } = statusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold whitespace-nowrap"
      style={{
        color,
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 28%, transparent)`,
      }}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: color, boxShadow: `0 0 6px ${color}` }}
        />
      )}
      {label}
    </span>
  );
}
