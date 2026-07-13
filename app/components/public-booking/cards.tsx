import type { ReactNode } from "react";
import { CheckIcon, MinusIcon, PlusIcon } from "lucide-react";
import type {
  PublicPackageResponse,
  PublicRangeResponse,
} from "~/lib/api/public/types";
import { hhmm } from "~/lib/booking/cart";
import { DAY_NAMES } from "~/lib/utils/date";
import { fmtMoney } from "~/lib/utils/format";
import { cn } from "~/lib/utils/cn";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[11px] font-medium uppercase tracking-wide text-dim">
      {children}
    </h2>
  );
}

function OptionCard({
  active,
  onSelect,
  title,
  children,
}: {
  active: boolean;
  onSelect: () => void;
  title: string;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onSelect}
      className={cn(
        "flex flex-col gap-2 rounded-xl border bg-card p-4 text-left transition-colors",
        active
          ? "border-primary ring-1 ring-primary"
          : "border-border hover:bg-accent",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-heading text-sm font-medium">{title}</span>
        {active && <CheckIcon className="size-4 shrink-0 text-primary" />}
      </div>
      {children}
    </button>
  );
}

function summarizeHours(
  hours: NonNullable<PublicRangeResponse["operatingHours"]>,
): string[] {
  const groups = new Map<string, number[]>();
  for (const h of hours) {
    const k = `${hhmm(h.openTime)} – ${hhmm(h.closeTime)}`;
    const days = groups.get(k);
    if (days) days.push(h.day);
    else groups.set(k, [h.day]);
  }
  return [...groups.entries()].map(([time, days]) => {
    const labels = days
      .slice()
      .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
      .map((d) => DAY_NAMES[d]?.slice(0, 3) ?? `Day ${d}`);
    return `${labels.join(", ")} · ${time}`;
  });
}

export function RangeCard({
  range,
  active,
  onSelect,
}: {
  range: PublicRangeResponse;
  active: boolean;
  onSelect: () => void;
}) {
  const hours = summarizeHours(range.operatingHours ?? []);
  return (
    <OptionCard active={active} onSelect={onSelect} title={range.name ?? "Range"}>
      {range.description && (
        <p className="whitespace-pre-line text-[12.5px] text-muted-foreground">
          {range.description}
        </p>
      )}
      {hours.length > 0 && (
        <ul className="mt-auto space-y-0.5 border-t border-border pt-2 text-[11.5px] text-muted-foreground">
          {hours.map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ul>
      )}
    </OptionCard>
  );
}

export function PackageCard({
  pkg,
  active,
  onSelect,
}: {
  pkg: PublicPackageResponse;
  active: boolean;
  onSelect: () => void;
}) {
  const items = pkg.items ?? [];
  return (
    <OptionCard active={active} onSelect={onSelect} title={pkg.name ?? "Package"}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <span className="text-base font-semibold">{fmtMoney(pkg.price)}</span>
        <span className="text-[12.5px] text-muted-foreground">
          {pkg.durationMinutes} min · up to {pkg.maxShooters}{" "}
          {pkg.maxShooters === 1 ? "person" : "people"}
        </span>
      </div>
      {pkg.description && (
        <p className="whitespace-pre-line text-[12.5px] text-muted-foreground">
          {pkg.description}
        </p>
      )}
      {items.length > 0 && (
        <div className="mt-auto space-y-1 border-t border-border pt-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-dim">
            Included
          </p>
          <ul className="space-y-0.5">
            {items.map((item, i) => (
              <li
                key={i}
                className="flex items-center justify-between text-[12px]"
              >
                <span>{item.description ?? "Item"}</span>
                <span className="font-medium tabular-nums">{item.quantity}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </OptionCard>
  );
}

export function ShooterStepper({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (n: number) => void;
}) {
  const clamp = (n: number) => Math.min(Math.max(1, n), Math.max(1, max));
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="pb-shooters">People</Label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Fewer people"
          disabled={value <= 1}
          onClick={() => onChange(clamp(value - 1))}
        >
          <MinusIcon />
        </Button>
        <Input
          id="pb-shooters"
          type="number"
          min={1}
          max={max}
          value={String(value)}
          onChange={(e) => onChange(clamp(Number(e.target.value) || 1))}
          className="w-16 text-center"
        />
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="More people"
          disabled={value >= max}
          onClick={() => onChange(clamp(value + 1))}
        >
          <PlusIcon />
        </Button>
        <span className="text-[12.5px] text-muted-foreground">max {max}</span>
      </div>
    </div>
  );
}
