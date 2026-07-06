import type { ConfirmationState } from "~/lib/booking/cart";
import { fmtMoney } from "~/lib/utils/format";
import { Button } from "~/components/ui/button";

export function Confirmation({
  confirmation,
  onBookAnother,
}: {
  confirmation: NonNullable<ConfirmationState>;
  onBookAnother: () => void;
}) {
  const refs = confirmation.refs.filter((r) => r !== "confirmed");
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
        {confirmation.count === 1
          ? "Booking requested"
          : `${confirmation.count} bookings requested`}
      </h3>
      {refs.length > 0 && (
        <div className="mt-2 space-y-0.5">
          <p className="text-[12.5px] text-muted-foreground">
            {refs.length === 1 ? "Your reference:" : "Your references:"}
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
      {(confirmation.invoiceNumber || confirmation.total > 0) && (
        <div className="mx-auto mt-3 max-w-xs space-y-1 border-t border-border pt-3 text-[12.5px]">
          {confirmation.invoiceNumber && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Invoice</span>
              <span className="font-mono font-medium text-foreground">
                {confirmation.invoiceNumber}
              </span>
            </div>
          )}
          {confirmation.total > 0 && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium text-foreground">
                {fmtMoney(confirmation.total)}
              </span>
            </div>
          )}
        </div>
      )}
      <p className="mt-3 text-sm text-muted-foreground">
        We&apos;ll be in touch to confirm your{" "}
        {confirmation.count === 1 ? "session" : "sessions"}.
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
