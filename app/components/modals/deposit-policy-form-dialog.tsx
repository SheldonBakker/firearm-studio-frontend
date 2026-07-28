import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { ApiError } from "~/lib/api/http";
import { useConfirm } from "~/context/confirm-context";
import { companyApi } from "~/lib/api/company/company";
import type { CompanyDetailsResponse } from "~/lib/api/company/types";
import { DepositMode } from "~/lib/types/enums";

const MODE_OPTIONS: { value: string; label: string }[] = [
  { value: String(DepositMode.None), label: "No deposit required" },
  { value: String(DepositMode.FixedAmount), label: "Fixed amount" },
  { value: String(DepositMode.Percentage), label: "Percentage of total" },
];

export function DepositPolicyFormDialog({
  open,
  onOpenChange,
  company,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  company: CompanyDetailsResponse;
  onSaved: () => void;
}) {
  const [mode, setMode] = useState(String(DepositMode.None));
  const [value, setValue] = useState("0");
  const [windowHours, setWindowHours] = useState("48");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const confirm = useConfirm();

  useEffect(() => {
    if (!open) return;
    setMode(String(company.depositMode));
    setValue(String(company.depositValue));
    setWindowHours(String(company.depositWindowHours || 48));
    setError(null);
  }, [open, company]);

  const modeValue = Number(mode) as DepositMode;
  const isNone = modeValue === DepositMode.None;
  const isPercentage = modeValue === DepositMode.Percentage;
  const valueLabel = isPercentage ? "Deposit value (%)" : "Deposit value (R)";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const numericValue = Number(value);
    const hours = Number(windowHours);

    if (!isNone) {
      if (!Number.isFinite(numericValue) || numericValue < 0) {
        setError("Deposit value must be zero or greater.");
        return;
      }
      if (isPercentage && numericValue > 100) {
        setError("Percentage deposit cannot exceed 100%.");
        return;
      }
      if (!Number.isInteger(hours) || hours < 1 || hours > 336) {
        setError("Payment window must be between 1 and 336 hours.");
        return;
      }
    }

    const confirmed = await confirm({
      title: "Save deposit policy?",
      description:
        "This applies to new bookings made through the public calendar.",
      confirmLabel: "Save changes",
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      await companyApi.update({
        depositMode: modeValue,
        depositValue: isNone ? 0 : numericValue,
        depositWindowHours: isNone ? company.depositWindowHours || 48 : hours,
      });
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-xl">
        <SheetHeader className="gap-1 pr-12">
          <SheetTitle>Deposit policy</SheetTitle>
          <SheetDescription>
            Require a deposit from customers who book online.
          </SheetDescription>
        </SheetHeader>
        <form
          noValidate
          onSubmit={submit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="deposit-mode">Deposit mode</Label>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger id="deposit-mode" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="deposit-value">{valueLabel}</Label>
                <Input
                  id="deposit-value"
                  type="number"
                  min={0}
                  max={isPercentage ? 100 : undefined}
                  step="0.01"
                  disabled={isNone}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="deposit-window">
                  Payment window (hours)
                </Label>
                <Input
                  id="deposit-window"
                  type="number"
                  min={1}
                  max={336}
                  disabled={isNone}
                  value={windowHours}
                  onChange={(e) => setWindowHours(e.target.value)}
                />
              </div>
            </div>
            <p className="text-[12px] text-muted-foreground">
              {isPercentage
                ? "Percentage of the booking total, up to 100%."
                : "A fixed rand amount per invoice."}{" "}
              Customers must pay within the payment window (1-336 hours) of
              booking confirmation.
            </p>
            {error && (
              <p className="text-[13px] font-medium text-destructive">
                {error}
              </p>
            )}
          </div>
          <SheetFooter className="border-t bg-muted/50 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
