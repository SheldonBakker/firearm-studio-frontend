import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
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
import { SearchSelectField } from "~/components/modals/form-dialog";
import { ApiError } from "~/lib/api/http";
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

async function searchCustomers(query: string, searchType: string) {
  const results = await customersApi.list({ [searchType]: query });
  return (results.items ?? []).map((c) => ({
    value: c.id,
    label: customerLabel(c),
    description: [c.email, c.phone].filter(Boolean).join(" · "),
  }));
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

  const activeRanges = ranges.filter((r) => r.isActive);
  const activePackages = packages.filter((p) => p.isActive);
  const selectedPackage = activePackages.find((p) => p.id === packageId);
  const today = new Date().toISOString().slice(0, 10);

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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!rangeId || !packageId || !date || !startTime || !customerId) {
      setError("Pick a range, package, date, time slot and customer.");
      return;
    }
    const shooters = Number(shooterCount);
    if (!Number.isInteger(shooters) || shooters < 1) {
      setError("Shooter count must be at least 1.");
      return;
    }
    if (selectedPackage && shooters > selectedPackage.maxShooters) {
      setError(
        `This package allows at most ${selectedPackage.maxShooters} shooter${
          selectedPackage.maxShooters === 1 ? "" : "s"
        }.`,
      );
      return;
    }

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
      setError(
        err instanceof ApiError ? err.message : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-140 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New booking</DialogTitle>
          <DialogDescription>
            Book a range slot for a customer.
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={submit}
          className="grid grid-cols-1 gap-4 py-1 sm:grid-cols-2"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="booking-range">
              Range<span className="text-destructive"> *</span>
            </Label>
            <Select value={rangeId} onValueChange={setRangeId}>
              <SelectTrigger id="booking-range">
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                {activeRanges.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name ?? "Unnamed range"}
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
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                {activePackages.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name ?? "Unnamed package"} · {fmtMoney(p.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
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

          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label>
              Time slot<span className="text-destructive"> *</span>
            </Label>
            {!rangeId || !packageId || !date ? (
              <p className="text-[12.5px] text-muted-foreground">
                Pick a range, package and date to see available slots.
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
              <div className="flex flex-wrap gap-1.5">
                {slots.map((slot) => (
                  <button
                    key={slot.startTime}
                    type="button"
                    aria-pressed={startTime === slot.startTime}
                    onClick={() => setStartTime(slot.startTime)}
                    className={cn(
                      "rounded-md border px-2.5 py-1.5 text-[12.5px] font-medium transition-colors",
                      startTime === slot.startTime
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    {slot.startTime.slice(0, 5)}
                    <span
                      className={cn(
                        "ml-1.5 text-[11px]",
                        startTime === slot.startTime
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground",
                      )}
                    >
                      {slot.remainingLanes}{" "}
                      {slot.remainingLanes === 1 ? "lane" : "lanes"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2">
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
            <Label htmlFor="booking-shooters">Shooters</Label>
            <Input
              id="booking-shooters"
              type="number"
              min={1}
              max={selectedPackage?.maxShooters}
              value={shooterCount}
              onChange={(e) => setShooterCount(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="booking-notes">Notes</Label>
            <textarea
              id="booking-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              className="accent-primary"
              checked={confirmImmediately}
              onChange={(e) => setConfirmImmediately(e.target.checked)}
            />
            Confirm booking immediately
          </label>

          {error && (
            <p className="text-[13px] font-medium text-destructive sm:col-span-2">
              {error}
            </p>
          )}
          <DialogFooter className="mt-1 sm:col-span-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create booking"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
