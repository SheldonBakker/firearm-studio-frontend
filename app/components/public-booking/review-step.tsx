import type {
  PublicCompanyResponse,
  PublicPackageResponse,
  PublicRangeResponse,
} from "~/lib/api/public/types";
import { itemView, type CartItem } from "~/lib/booking/cart";
import { fmtMoney } from "~/lib/utils/format";
import { formatPhoneForDisplay } from "~/lib/utils/phone";
import { DepositMode } from "~/lib/types/enums";

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

const VAT_RATE_PERCENT = 15;

function round2AwayFromZero(n: number): number {
  return (Math.sign(n) || 1) * (Math.round(Math.abs(n) * 100) / 100);
}

function invoiceTotalFor(company: PublicCompanyResponse, subtotal: number): number {
  if (!company.isVatRegistered) return subtotal;
  const vat = round2AwayFromZero((subtotal * VAT_RATE_PERCENT) / 100);
  return subtotal + vat;
}

function depositAmountFor(company: PublicCompanyResponse, invoiceTotal: number): number {
  if (invoiceTotal <= 0) return 0;

  let amount: number;
  if (company.depositMode === DepositMode.FixedAmount) {
    amount = company.depositValue;
  } else if (company.depositMode === DepositMode.Percentage) {
    amount = round2AwayFromZero((invoiceTotal * company.depositValue) / 100);
  } else {
    amount = 0;
  }

  if (amount <= 0) return 0;
  return Math.min(amount, invoiceTotal);
}

export function ReviewStep({
  items,
  ranges,
  packages,
  company,
  total,
  fullName,
  email,
  phone,
  error,
}: {
  items: CartItem[];
  ranges: PublicRangeResponse[];
  packages: PublicPackageResponse[];
  company: PublicCompanyResponse;
  total: number;
  fullName: string;
  email: string;
  phone: string;
  error: string | null;
}) {
  const invoiceTotal = invoiceTotalFor(company, total);
  const depositAmount = depositAmountFor(company, invoiceTotal);
  const hasDeposit = depositAmount > 0;

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
          <ReviewRow label="Phone" value={formatPhoneForDisplay(phone, "ZA")} />
        </dl>
      </div>

      {hasDeposit && (
        <div className="space-y-1.5 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <h3 className="text-sm font-semibold">Deposit required</h3>
          <p className="text-[12.5px] text-muted-foreground">
            A deposit of {fmtMoney(depositAmount)} is required within{" "}
            {company.depositWindowHours}{" "}
            {company.depositWindowHours === 1 ? "hour" : "hours"} of
            confirmation to secure{" "}
            {items.length === 1 ? "this booking" : "these bookings"}. Payment
            details and your reference will be included with your
            confirmation.
          </p>
        </div>
      )}

      {error && (
        <p className="text-[13px] font-medium text-destructive">{error}</p>
      )}
    </div>
  );
}
