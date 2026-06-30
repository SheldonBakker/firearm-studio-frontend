import { cn } from "~/lib/utils/cn";

export interface KVPair {
  k: string;
  v: React.ReactNode;
  full?: boolean;
  strong?: boolean;
}

/** Two-column key/value grid used on detail panels. */
export function KeyValue({ pairs }: { pairs: KVPair[] }) {
  return (
    <div className="grid grid-cols-1 gap-x-7 gap-y-4 sm:grid-cols-2">
      {pairs.map((p, i) => (
        <div key={i} className={cn(p.full && "sm:col-span-2")}>
          <div className="mb-1.5 font-mono text-[11px] font-bold uppercase tracking-wide text-dim">
            {p.k}
          </div>
          <div
            className={cn(
              "text-[13.5px] text-foreground",
              p.strong && "font-semibold",
            )}
          >
            {p.v}
          </div>
        </div>
      ))}
    </div>
  );
}
