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
import { Separator } from "~/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { SectionHeading } from "~/components/modals/form-dialog";
import { ApiError } from "~/lib/api/http";
import { rangesApi } from "~/lib/api/ranges/ranges";
import type { ShootingRangeResponse } from "~/lib/api/ranges/types";
import { DayOfWeek } from "~/lib/types/enums";

// Monday-first display order while keeping .NET day values (Sunday = 0).
const DAY_ORDER: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0];
const DAY_LABELS: Record<DayOfWeek, string> = {
  [DayOfWeek.Sunday]: "Sun",
  [DayOfWeek.Monday]: "Mon",
  [DayOfWeek.Tuesday]: "Tue",
  [DayOfWeek.Wednesday]: "Wed",
  [DayOfWeek.Thursday]: "Thu",
  [DayOfWeek.Friday]: "Fri",
  [DayOfWeek.Saturday]: "Sat",
};

interface HourRow {
  day: DayOfWeek;
  enabled: boolean;
  open: string;
  close: string;
}

function initialHours(range?: ShootingRangeResponse | null): HourRow[] {
  return DAY_ORDER.map((day) => {
    const existing = range?.operatingHours?.find((h) => h.day === day);
    return {
      day,
      enabled: Boolean(existing),
      open: existing ? existing.openTime.slice(0, 5) : "09:00",
      close: existing ? existing.closeTime.slice(0, 5) : "17:00",
    };
  });
}

export function RangeFormDialog({
  open,
  onOpenChange,
  range,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  range?: ShootingRangeResponse | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [laneCount, setLaneCount] = useState("1");
  const [slotInterval, setSlotInterval] = useState("30");
  const [active, setActive] = useState("true");
  const [hours, setHours] = useState<HourRow[]>(() => initialHours(range));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(range?.name ?? "");
    setDescription(range?.description ?? "");
    setLaneCount(String(range?.laneCount ?? 1));
    setSlotInterval(String(range?.slotIntervalMinutes ?? 30));
    setActive(String(range?.isActive ?? true));
    setHours(initialHours(range));
    setError(null);
  }, [open, range]);

  function setHour(day: DayOfWeek, patch: Partial<HourRow>) {
    setHours((prev) =>
      prev.map((h) => (h.day === day ? { ...h, ...patch } : h)),
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    const lanes = Number(laneCount);
    const interval = Number(slotInterval);
    if (!Number.isInteger(lanes) || lanes < 1) {
      setError("Lane count must be at least 1.");
      return;
    }
    if (!Number.isInteger(interval) || interval < 1) {
      setError("Slot interval must be at least 1 minute.");
      return;
    }
    const invalidDay = hours.find(
      (h) => h.enabled && (!h.open || !h.close || h.close <= h.open),
    );
    if (invalidDay) {
      setError(
        `${DAY_LABELS[invalidDay.day]}: closing time must be after opening time.`,
      );
      return;
    }

    const operatingHours = hours
      .filter((h) => h.enabled)
      .map((h) => ({
        day: h.day,
        openTime: `${h.open}:00`,
        closeTime: `${h.close}:00`,
      }));

    setLoading(true);
    try {
      if (range) {
        await rangesApi.update(range.id, {
          name: name.trim(),
          description: description.trim() || null,
          laneCount: lanes,
          slotIntervalMinutes: interval,
          isActive: active === "true",
          operatingHours,
        });
      } else {
        await rangesApi.create({
          name: name.trim(),
          description: description.trim() || null,
          laneCount: lanes,
          slotIntervalMinutes: interval,
          operatingHours,
        });
      }
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
          <SheetTitle>{range ? "Edit range" : "Add range"}</SheetTitle>
          <SheetDescription>
            {range
              ? "Update the range details and weekly operating hours."
              : "Set up a shooting range with its weekly operating hours."}
          </SheetDescription>
        </SheetHeader>
        <form
          noValidate
          onSubmit={submit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-6 overflow-y-auto px-4 pb-4">
            <section className="space-y-3">
              <SectionHeading>Details</SectionHeading>
              <div className="flex flex-col gap-2">
                <Label htmlFor="range-name">
                  Name<span className="text-destructive"> *</span>
                </Label>
                <Input
                  id="range-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Indoor 25m"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="range-description">Description</Label>
                <textarea
                  id="range-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring"
                />
              </div>
            </section>

            <Separator />

            <section className="space-y-3">
              <SectionHeading>Capacity</SectionHeading>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="range-lanes">Lanes</Label>
                  <Input
                    id="range-lanes"
                    type="number"
                    min={1}
                    value={laneCount}
                    onChange={(e) => setLaneCount(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="range-interval">
                    Slot interval (minutes)
                  </Label>
                  <Input
                    id="range-interval"
                    type="number"
                    min={1}
                    step={5}
                    value={slotInterval}
                    onChange={(e) => setSlotInterval(e.target.value)}
                  />
                </div>
              </div>
              {range && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="range-active">Status</Label>
                  <Select value={active} onValueChange={setActive}>
                    <SelectTrigger id="range-active">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </section>

            <Separator />

            <section className="space-y-3">
              <SectionHeading>Operating hours</SectionHeading>
              <div className="flex flex-col gap-1.5">
                {hours.map((h) => (
                  <div key={h.day} className="flex items-center gap-3">
                    <label className="flex w-16 shrink-0 cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="accent-primary"
                        checked={h.enabled}
                        onChange={(e) =>
                          setHour(h.day, { enabled: e.target.checked })
                        }
                      />
                      {DAY_LABELS[h.day]}
                    </label>
                    <Input
                      type="time"
                      aria-label={`${DAY_LABELS[h.day]} opening time`}
                      disabled={!h.enabled}
                      value={h.open}
                      onChange={(e) => setHour(h.day, { open: e.target.value })}
                      className="h-9 w-full"
                    />
                    <span className="text-muted-foreground">–</span>
                    <Input
                      type="time"
                      aria-label={`${DAY_LABELS[h.day]} closing time`}
                      disabled={!h.enabled}
                      value={h.close}
                      onChange={(e) =>
                        setHour(h.day, { close: e.target.value })
                      }
                      className="h-9 w-full"
                    />
                  </div>
                ))}
              </div>
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
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : range ? "Save changes" : "Add range"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
