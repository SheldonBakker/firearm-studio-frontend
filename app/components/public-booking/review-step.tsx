import type {
  PublicPackageResponse,
  PublicRangeResponse,
} from "~/lib/api/public/types";
import { itemView, type CartItem } from "~/lib/booking/cart";
import { fmtMoney } from "~/lib/utils/format";

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

export function ReviewStep({
  items,
  ranges,
  packages,
  total,
  fullName,
  email,
  phone,
  error,
}: {
  items: CartItem[];
  ranges: PublicRangeResponse[];
  packages: PublicPackageResponse[];
  total: number;
  fullName: string;
  email: string;
  phone: string;
  error: string | null;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold">Sessions ({items.length})</h3>
        <ul className="divide-y divide-border">
          {items.map((item) => {
            const v = itemView(item, ranges, packages);
            return (
              <li
                key={item.key}
                className="flex items-start justify-between gap-3 py-2.5"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="text-[13px] font-medium">
                    {v.pkgName}{" "}
                    <span className="font-normal text-muted-foreground">
                      · {v.rangeName}
                    </span>
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    {v.dateLabel} · {v.timeLabel} · {v.shooterCount}{" "}
                    {v.shooterCount === 1 ? "person" : "people"}
                  </p>
                </div>
                <span className="shrink-0 text-[12.5px] font-medium tabular-nums">
                  {fmtMoney(v.price)}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center justify-between border-t border-border pt-3 text-sm font-semibold">
          <span>Total</span>
          <span>{fmtMoney(total)}</span>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold">Your details</h3>
        <dl className="divide-y divide-border text-[13px]">
          <ReviewRow label="Name" value={fullName || "—"} />
          <ReviewRow label="Email" value={email || "—"} />
          <ReviewRow label="Phone" value={phone || "—"} />
        </dl>
      </div>

      {error && (
        <p className="text-[13px] font-medium text-destructive">{error}</p>
      )}
    </div>
  );
}
