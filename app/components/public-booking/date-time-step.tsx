import { PlusIcon, XIcon } from "lucide-react";
import type {
  AvailabilitySlotDto,
  PublicPackageResponse,
  PublicRangeResponse,
} from "~/lib/api/public/types";
import { itemView, type CartItem, type Draft } from "~/lib/booking/cart";
import { fmtMoney } from "~/lib/utils/format";
import { Button } from "~/components/ui/button";
import { SectionLabel } from "./cards";
import { MonthCalendar, SlotGrid } from "./calendar";

function CartList({
  items,
  ranges,
  packages,
  total,
  onRemove,
}: {
  items: CartItem[];
  ranges: PublicRangeResponse[];
  packages: PublicPackageResponse[];
  total: number;
  onRemove: (key: string) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          Your sessions{items.length > 0 ? ` (${items.length})` : ""}
        </h3>
        {items.length > 0 && (
          <span className="text-[13px] font-semibold">{fmtMoney(total)}</span>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-[12.5px] text-muted-foreground">
          No sessions added yet. Pick a date and time above, then choose “Add
          session”.
        </p>
      ) : (
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
                    {v.shooterCount === 1 ? "shooter" : "shooters"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[12.5px] font-medium tabular-nums">
                    {fmtMoney(v.price)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove session"
                    onClick={() => onRemove(item.key)}
                  >
                    <XIcon />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function DateTimeStep({
  ranges,
  packages,
  draft,
  monthDays,
  todayKey,
  slots,
  slotsLoading,
  items,
  total,
  canAddSession,
  isDuplicate,
  onPrevMonth,
  onNextMonth,
  onPickDate,
  onPickSlot,
  onAdd,
  onRemove,
}: {
  ranges: PublicRangeResponse[];
  packages: PublicPackageResponse[];
  draft: Draft;
  monthDays: Map<string, boolean>;
  todayKey: string;
  slots: AvailabilitySlotDto[];
  slotsLoading: boolean;
  items: CartItem[];
  total: number;
  canAddSession: boolean;
  isDuplicate: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onPickDate: (date: string) => void;
  onPickSlot: (slot: AvailabilitySlotDto) => void;
  onAdd: () => void;
  onRemove: (key: string) => void;
}) {
  const range = ranges.find((r) => r.id === draft.rangeId);
  const pkg = packages.find((p) => p.id === draft.packageId);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-lg border border-border bg-card px-3 py-2 text-[12.5px]">
        <span className="font-medium">{pkg?.name ?? "Package"}</span>
        <span className="text-muted-foreground">
          · {range?.name ?? "Facility"}
        </span>
        <span className="text-muted-foreground">
          · {draft.shooterCount}{" "}
          {draft.shooterCount === 1 ? "shooter" : "shooters"}
        </span>
        {pkg && (
          <span className="ml-auto font-medium">{fmtMoney(pkg.price)}</span>
        )}
      </div>

      <section className="space-y-3">
        <SectionLabel>Pick a date &amp; time</SectionLabel>
        <MonthCalendar
          year={draft.year}
          month={draft.month}
          monthDays={monthDays}
          todayKey={todayKey}
          selectedDate={draft.selectedDate}
          onPrevMonth={onPrevMonth}
          onNextMonth={onNextMonth}
          onPickDate={onPickDate}
        />
        <SlotGrid
          slots={slots}
          slotsLoading={slotsLoading}
          selectedDate={draft.selectedDate}
          slot={draft.slot}
          onPickSlot={onPickSlot}
        />
      </section>

      <div className="space-y-1.5">
        <Button
          type="button"
          className="w-full"
          disabled={!canAddSession}
          onClick={onAdd}
        >
          <PlusIcon /> Add session
        </Button>
        {isDuplicate && (
          <p className="text-center text-[12px] text-muted-foreground">
            This session is already in your cart.
          </p>
        )}
      </div>

      <CartList
        items={items}
        ranges={ranges}
        packages={packages}
        total={total}
        onRemove={onRemove}
      />
    </div>
  );
}
