import type { AvailabilitySlotDto } from "~/lib/api/public/types";
import { hhmm, type SlotRef } from "~/lib/booking/cart";
import { WEEKDAYS, MONTH_LABELS, monthGrid, dateKey } from "~/lib/utils/date";
import { cn } from "~/lib/utils/cn";
import { Button } from "~/components/ui/button";

export function MonthCalendar({
  year,
  month,
  monthDays,
  todayKey,
  selectedDate,
  onPrevMonth,
  onNextMonth,
  onPickDate,
}: {
  year: number;
  month: number;
  monthDays: Map<string, boolean>;
  todayKey: string;
  selectedDate: string | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onPickDate: (date: string) => void;
}) {
  const { daysInMonth, leadingBlanks } = monthGrid(year, month);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">
          {MONTH_LABELS[month - 1]} {year}
        </h3>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onPrevMonth}>
            Previous
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onNextMonth}>
            Next
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="px-1.5 pb-1 text-[11px] font-medium uppercase tracking-wide text-dim"
          >
            {d}
          </div>
        ))}
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const key = dateKey(year, month, day);
          const available = monthDays.get(key) === true;
          const past = key < todayKey;
          const selectable = available && !past;
          const isSelected = selectedDate === key;
          return (
            <button
              key={key}
              type="button"
              disabled={!selectable}
              aria-pressed={isSelected}
              onClick={() => onPickDate(key)}
              className={cn(
                "flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg border p-1.5 text-sm transition-colors",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card",
                selectable && !isSelected && "hover:bg-accent",
                !selectable && "cursor-not-allowed opacity-40",
              )}
            >
              <span className="font-medium">{day}</span>
              {selectable && (
                <span
                  className="size-1.5 rounded-full"
                  style={{
                    backgroundColor: isSelected
                      ? "currentColor"
                      : "var(--status-green)",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SlotGrid({
  slots,
  slotsLoading,
  selectedDate,
  slot,
  onPickSlot,
}: {
  slots: AvailabilitySlotDto[];
  slotsLoading: boolean;
  selectedDate: string | null;
  slot: SlotRef | null;
  onPickSlot: (slot: AvailabilitySlotDto) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold">Available times</h3>
      {!selectedDate ? (
        <p className="text-[12.5px] text-muted-foreground">
          Select a day above to see available times.
        </p>
      ) : slotsLoading ? (
        <p className="text-[12.5px] text-muted-foreground">Loading times…</p>
      ) : slots.length === 0 ? (
        <p className="text-[12.5px] text-muted-foreground">
          No available times for this day.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {slots.map((s) => {
            const full = s.remainingLanes <= 0;
            const active = slot?.startTime === s.startTime;
            return (
              <button
                key={s.startTime}
                type="button"
                disabled={full}
                aria-pressed={active}
                onClick={() => onPickSlot(s)}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-md border px-3 py-2 text-left transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input hover:bg-accent",
                  full && "cursor-not-allowed opacity-50",
                )}
              >
                <span className="text-[13px] font-medium">
                  {hhmm(s.startTime)} – {hhmm(s.endTime)}
                </span>
                <span
                  className={cn(
                    "text-[11px]",
                    active
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground",
                  )}
                >
                  {full
                    ? "Full"
                    : `${s.remainingLanes} ${
                        s.remainingLanes === 1 ? "lane" : "lanes"
                      } left`}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
