import type { ConfirmationState } from "~/lib/booking/cart";
import { EMDASH, fmtMoney } from "~/lib/utils/format";
import { Button } from "~/components/ui/button";

function PayRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}

function fmtDueAt(d: string | null): string {
  if (!d) return EMDASH;
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Confirmation({
  confirmation,
  onBookAnother,
}: {
  confirmation: NonNullable<ConfirmationState>;
  onBookAnother: () => void;
}) {
  const { count, invoiceNumber, total, depositAmount, depositDueAt, email, banking } =
    confirmation;
  const refs = confirmation.refs.filter((r) => r !== "confirmed");
  const hasDeposit = depositAmount != null;
  const hasBanking =
    !!banking &&
    (banking.bankName ||
      banking.bankAccountHolder ||
      banking.bankAccountNumber ||
      banking.bankBranchCode ||
      banking.bankAccountType ||
      banking.bankSwiftCode);

  return (
    <div className="rounded-xl border border-border bg-card p-6 text-center">
      <div
        className="mx-auto flex size-10 items-center justify-center rounded-full"
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--status-green) 16%, transparent)",
          color: "var(--status-green)",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <h3 className="mt-3 font-heading text-base font-medium">
        {count === 1 ? "Booking requested" : `${count} bookings requested`}
      </h3>
      {refs.length > 0 && (
        <div className="mt-2 space-y-0.5">
          <p className="text-[12.5px] text-muted-foreground">
            {refs.length === 1 ? "Your booking:" : "Your bookings:"}
          </p>
          {refs.map((r) => (
            <p
              key={r}
              className="font-mono text-[13px] font-medium text-foreground"
            >
              {r}
            </p>
          ))}
        </div>
      )}

      {(hasBanking || invoiceNumber || total > 0 || hasDeposit) && (
        <div className="mx-auto mt-4 max-w-sm rounded-lg border border-border bg-panel2 p-4 text-left">
          <p className="text-[11px] font-medium uppercase tracking-wide text-dim">
            Payment details
          </p>
          <dl className="mt-2 divide-y divide-border text-[12.5px]">
            {hasDeposit ? (
              <>
                <PayRow
                  label="Deposit due now"
                  value={fmtMoney(depositAmount)}
                />
                <PayRow label="Pay by" value={fmtDueAt(depositDueAt)} />
                {total > 0 && (
                  <PayRow label="Booking total" value={fmtMoney(total)} />
                )}
              </>
            ) : (
              total > 0 && <PayRow label="Amount due" value={fmtMoney(total)} />
            )}
            {banking?.bankName && (
              <PayRow label="Bank" value={banking.bankName} />
            )}
            {banking?.bankAccountHolder && (
              <PayRow label="Account holder" value={banking.bankAccountHolder} />
            )}
            {banking?.bankAccountNumber && (
              <PayRow label="Account number" value={banking.bankAccountNumber} />
            )}
            {banking?.bankBranchCode && (
              <PayRow label="Branch code" value={banking.bankBranchCode} />
            )}
            {banking?.bankAccountType && (
              <PayRow label="Account type" value={banking.bankAccountType} />
            )}
            {banking?.bankSwiftCode && (
              <PayRow label="SWIFT" value={banking.bankSwiftCode} />
            )}
          </dl>
          {invoiceNumber && (
            <div className="mt-3 rounded-md border border-primary/40 bg-primary/10 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-dim">
                Use as your payment reference
              </p>
              <p className="font-mono text-sm font-semibold text-foreground">
                {invoiceNumber}
              </p>
            </div>
          )}
        </div>
      )}

      <p className="mt-3 text-sm text-muted-foreground">
        We&apos;ve emailed your {count === 1 ? "booking" : "bookings"} and
        payment details{email ? ` to ${email}` : ""}.
      </p>
      <Button
        type="button"
        variant="outline"
        className="mt-4"
        onClick={onBookAnother}
      >
        Make another booking
      </Button>
    </div>
  );
}
