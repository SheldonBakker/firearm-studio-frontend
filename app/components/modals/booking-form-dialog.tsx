import { useEffect, useState } from "react";
import { MinusIcon, PlusIcon } from "lucide-react";
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
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { SearchSelectField } from "~/components/modals/form-dialog";
import { ApiError } from "~/lib/api/http";
import { useConfirm } from "~/context/confirm-context";
import { bookingsApi } from "~/lib/api/bookings/bookings";
import { customersApi } from "~/lib/api/customers/customers";
import { rangesApi } from "~/lib/api/ranges/ranges";
import type { ShootingRangeListItemDto } from "~/lib/api/ranges/types";
import type { AvailabilitySlotDto } from "~/lib/api/ranges/types";
import type { PackageListItemDto } from "~/lib/api/packages/types";
import { customerLabel } from "~/lib/utils/entities";
import { fmtMoney } from "~/lib/utils/format";
import { cn } from "~/lib/utils/cn";

const CUSTOMER_SEARCH_TYPES = [
  { value: "name", label: "Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
];

const hhmm = (t: string) => t.slice(0, 5);

async function searchCustomers(query: string, searchType: string) {
  const results = await customersApi.list({ [searchType]: query });
  return (results.items ?? []).map((c) => ({
    value: c.id,
    label: customerLabel(c),
    description: [c.email, c.phone].filter(Boolean).join(" · "),
  }));
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
      {children}
    </h3>
  );
}

export function BookingFormDialog({
  open,
  onOpenChange,
  ranges,
  packages,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ranges: ShootingRangeListItemDto[];
  packages: PackageListItemDto[];
  onCreated: (id: string | null) => void;
}) {
  const [rangeId, setRangeId] = useState("");
  const [packageId, setPackageId] = useState("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<AvailabilitySlotDto[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [shooterCount, setShooterCount] = useState("1");
  const [notes, setNotes] = useState("");
  const [confirmImmediately, setConfirmImmediately] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const confirm = useConfirm();

  const activeRanges = ranges.filter((r) => r.isActive);
  const activePackages = packages.filter((p) => p.isActive);
  const selectedPackage = activePackages.find((p) => p.id === packageId);
  const selectedSlot = slots.find((s) => s.startTime === startTime);
  const today = new Date().toISOString().slice(0, 10);
  const shooters = Number(shooterCount);

  const canSubmit =
    Boolean(rangeId && packageId && date && startTime && customerId) &&
    Number.isInteger(shooters) &&
    shooters >= 1 &&
    (!selectedPackage || shooters <= selectedPackage.maxShooters);

  useEffect(() => {
    if (!open) return;
    setRangeId("");
    setPackageId("");
    setDate("");
    setSlots([]);
    setStartTime("");
    setCustomerId("");
    setShooterCount("1");
    setNotes("");
    setConfirmImmediately(false);
    setError(null);
  }, [open]);

  useEffect(() => {
    setStartTime("");
    if (!rangeId || !packageId || !date) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    rangesApi
      .availability(rangeId, { packageId, date })
      .then((res) => {
        if (!cancelled) setSlots(res.slots ?? []);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [rangeId, packageId, date]);

  // Keep the shooter count within the selected package's limit.
  useEffect(() => {
    if (!selectedPackage) return;
    const n = Number(shooterCount);
    if (Number.isInteger(n) && n > selectedPackage.maxShooters) {
      setShooterCount(String(selectedPackage.maxShooters));
    }
  }, [packageId]);

  function stepShooters(delta: number) {
    const n = Number(shooterCount) || 0;
    let next = n + delta;
    if (next < 1) next = 1;
    if (selectedPackage && next > selectedPackage.maxShooters) {
      next = selectedPackage.maxShooters;
    }
    setShooterCount(String(next));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!rangeId || !packageId || !date || !startTime || !customerId) {
      setError("Pick a facility, package, date, time slot and customer.");
      return;
    }
    if (!Number.isInteger(shooters) || shooters < 1) {
      setError("Person count must be at least 1.");
      return;
    }
    if (selectedPackage && shooters > selectedPackage.maxShooters) {
      setError(
        `This package allows at most ${selectedPackage.maxShooters} ${
          selectedPackage.maxShooters === 1 ? "person" : "people"
        }.`,
      );
      return;
    }

    const confirmed = await confirm({
      title: "Create booking?",
      description: confirmImmediately
        ? "This will create the booking and confirm it immediately."
        : "This will create the booking as pending.",
      confirmLabel: "Create booking",
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      const created = await bookingsApi.create({
        shootingRangeId: rangeId,
        packageId,
        customerId,
        bookingDate: date,
        startTime,
        shooterCount: shooters,
        notes: notes.trim() || null,
        confirmImmediately,
      });
      onCreated(created?.id ?? null);
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
          <div className="flex items-center justify-between gap-3">
            <SheetTitle>New booking</SheetTitle>
            {selectedPackage && (
              <Badge variant="secondary" className="text-[13px]">
                {fmtMoney(selectedPackage.price)}
              </Badge>
            )}
          </div>
          <SheetDescription>
            Book a facility slot for a customer.
          </SheetDescription>
        </SheetHeader>

        <form
          noValidate
          onSubmit={submit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-6 overflow-y-auto px-4 pb-4">
            {/* Session */}
            <section className="space-y-3">
              <SectionHeading>Session</SectionHeading>
              <div className="flex flex-col gap-2">
                <Label htmlFor="booking-range">
                  Facility<span className="text-destructive"> *</span>
                </Label>
                <Select value={rangeId} onValueChange={setRangeId}>
                  <SelectTrigger id="booking-range">
                    <SelectValue placeholder="Select a facility…" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeRanges.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name ?? "Unnamed facility"} · capacity {r.laneCount}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="booking-package">
                  Package<span className="text-destructive"> *</span>
                </Label>
                <Select value={packageId} onValueChange={setPackageId}>
                  <SelectTrigger id="booking-package">
                    <SelectValue placeholder="Select a package…" />
                  </SelectTrigger>
                  <SelectContent>
                    {activePackages.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name ?? "Unnamed package"} · {fmtMoney(p.price)} ·{" "}
                        {p.durationMinutes} min · up to {p.maxShooters}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="booking-date">
                  Date<span className="text-destructive"> *</span>
                </Label>
                <Input
                  id="booking-date"
                  type="date"
                  min={today}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </section>

            <Separator />

            {/* Time slot */}
            <section className="space-y-3">
              <SectionHeading>Time slot</SectionHeading>
              {!rangeId || !packageId || !date ? (
                <p className="text-[12.5px] text-muted-foreground">
                  Pick a facility, package and date to see available slots.
                </p>
              ) : slotsLoading ? (
                <p className="text-[12.5px] text-muted-foreground">
                  Loading slots…
                </p>
              ) : slots.length === 0 ? (
                <p className="text-[12.5px] text-muted-foreground">
                  No available slots for this date.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {slots.map((slot) => {
                    const full = slot.remainingLanes <= 0;
                    const active = startTime === slot.startTime;
                    return (
                      <button
                        key={slot.startTime}
                        type="button"
                        disabled={full}
                        aria-pressed={active}
                        onClick={() => setStartTime(slot.startTime)}
                        className={cn(
                          "flex flex-col items-start gap-1 rounded-md border px-3 py-2 text-left transition-colors",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input hover:bg-accent hover:text-accent-foreground",
                          full &&
                            "cursor-not-allowed opacity-50 hover:bg-transparent hover:text-inherit",
                        )}
                      >
                        <span className="text-[13px] font-medium">
                          {hhmm(slot.startTime)} – {hhmm(slot.endTime)}
                        </span>
                        <span
                          className={cn(
                            "text-[11px]",
                            active
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground",
                          )}
                        >
                          {full ? "Full" : `${slot.remainingLanes} left`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              {selectedSlot && selectedPackage && (
                <p className="text-[12.5px] text-muted-foreground">
                  Ends {hhmm(selectedSlot.endTime)} ·{" "}
                  {selectedPackage.durationMinutes} min
                </p>
              )}
            </section>

            <Separator />

            {/* Customer & shooters */}
            <section className="space-y-3">
              <SectionHeading>Customer &amp; people</SectionHeading>
              <div className="flex flex-col gap-2">
                <Label htmlFor="booking-customer">
                  Customer<span className="text-destructive"> *</span>
                </Label>
                <SearchSelectField
                  id="booking-customer"
                  value={customerId}
                  options={[]}
                  placeholder="Search by name, email, or phone…"
                  searchTypes={CUSTOMER_SEARCH_TYPES}
                  defaultSearchType="name"
                  onSearch={searchCustomers}
                  invalid={false}
                  onChange={setCustomerId}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="booking-shooters">People</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label="Fewer people"
                    disabled={shooters <= 1}
                    onClick={() => stepShooters(-1)}
                  >
                    <MinusIcon />
                  </Button>
                  <Input
                    id="booking-shooters"
                    type="number"
                    min={1}
                    max={selectedPackage?.maxShooters}
                    value={shooterCount}
                    onChange={(e) => setShooterCount(e.target.value)}
                    className="w-16 text-center"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label="More people"
                    disabled={
                      !!selectedPackage &&
                      shooters >= selectedPackage.maxShooters
                    }
                    onClick={() => stepShooters(1)}
                  >
                    <PlusIcon />
                  </Button>
                  {selectedPackage && (
                    <span className="text-[12.5px] text-muted-foreground">
                      max {selectedPackage.maxShooters}
                    </span>
                  )}
                </div>
              </div>
            </section>

            <Separator />

            {/* Notes & options */}
            <section className="space-y-3">
              <SectionHeading>Notes &amp; options</SectionHeading>
              <div className="flex flex-col gap-2">
                <Label htmlFor="booking-notes">Notes</Label>
                <textarea
                  id="booking-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring"
                />
              </div>
              <label className="flex cursor-pointer items-center gap-3 rounded-md border border-input p-3 text-sm transition-colors hover:bg-accent/50">
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={confirmImmediately}
                  onChange={(e) => setConfirmImmediately(e.target.checked)}
                />
                <span>
                  Confirm booking immediately
                  <span className="block text-[12.5px] text-muted-foreground">
                    Skip the pending state and mark this booking confirmed.
                  </span>
                </span>
              </label>
            </section>

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
            <Button type="submit" disabled={loading || !canSubmit}>
              {loading ? "Creating…" : "Create booking"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
