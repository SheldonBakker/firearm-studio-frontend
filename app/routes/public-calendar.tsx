import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { z } from "zod";
import { MinusIcon, PlusIcon } from "lucide-react";
import type { Route } from "./+types/public-calendar";
import { publicBookingsApi } from "~/lib/api/public/public";
import type {
  AvailabilitySlotDto,
  PublicBookingOptionsResponse,
  PublicCompanyResponse,
  PublicPackageResponse,
  PublicRangeResponse,
} from "~/lib/api/public/types";
import { ApiError } from "~/lib/api/http";
import { pageMeta } from "~/lib/utils/seo";
import {
  WEEKDAYS,
  DAY_NAMES,
  MONTH_LABELS,
  monthGrid,
  dateKey,
} from "~/lib/utils/date";
import { fmtMoney } from "~/lib/utils/format";
import { cn } from "~/lib/utils/cn";
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
import { SouthAfricanPhoneInput } from "~/components/common/south-african-phone-input";
import { Resolve } from "~/components/common/skeletons";
import {
  requiredEmailSchema,
  requiredTextSchema,
} from "~/lib/utils/validation";
import { requiredSouthAfricanPhoneSchema } from "~/lib/utils/phone";

export function meta({ location }: Route.MetaArgs) {
  return pageMeta({
    title: "Book a session",
    description: "Check availability and book a shooting range session online.",
    pathname: location.pathname,
    noIndex: true,
  });
}

export function clientLoader({ params }: Route.ClientLoaderArgs) {
  const companyId = params.companyId;
  return {
    companyId,
    options: publicBookingsApi.options(companyId).catch(() => null),
  };
}

const hhmm = (t: string) => t.slice(0, 5);

export default function PublicCalendar({ loaderData }: Route.ComponentProps) {
  const [searchParams] = useSearchParams();
  const embed = searchParams.get("embed") === "1";

  return (
    <div
      className={cn(
        "min-h-dvh bg-background text-foreground",
        embed ? "p-3" : "p-4 sm:p-8",
      )}
    >
      <div className="mx-auto max-w-3xl">
        <Resolve
          resolve={loaderData.options}
          fallback={
            <div className="space-y-4">
              <div className="h-7 w-48 animate-pulse rounded bg-card" />
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: 42 }).map((_, i) => (
                  <div
                    key={i}
                    className="min-h-16 animate-pulse rounded-lg border border-border bg-card"
                  />
                ))}
              </div>
            </div>
          }
        >
          {(options) => {
            const ranges = options?.ranges ?? [];
            const packages = options?.packages ?? [];
            return options && ranges.length > 0 && packages.length > 0 ? (
              <CalendarView
                companyId={loaderData.companyId}
                options={options}
                embed={embed}
              />
            ) : (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <h1 className="font-heading text-lg font-medium">
                  Calendar unavailable
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  This booking calendar isn&apos;t available right now. Please
                  check the link or try again later.
                </p>
              </div>
            );
          }}
        </Resolve>
      </div>
    </div>
  );
}

function CalendarView({
  companyId,
  options,
  embed,
}: {
  companyId: string;
  options: PublicBookingOptionsResponse;
  embed: boolean;
}) {
  const ranges = options.ranges ?? [];
  const packages = options.packages ?? [];

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-based
  const [rangeId, setRangeId] = useState(ranges[0]?.id ?? "");
  const [packageId, setPackageId] = useState(packages[0]?.id ?? "");

  const [monthDays, setMonthDays] = useState<Map<string, boolean>>(new Map());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlotDto[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slot, setSlot] = useState<AvailabilitySlotDto | null>(null);

  const selectedPackage = packages.find((p) => p.id === packageId);
  const selectedRange = ranges.find((r) => r.id === rangeId);
  const todayKey = dateKey(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
  );
  const { daysInMonth, leadingBlanks } = monthGrid(year, month);

  useEffect(() => {
    if (!rangeId || !packageId) {
      setMonthDays(new Map());
      return;
    }
    let cancelled = false;
    publicBookingsApi
      .monthAvailability(companyId, rangeId, { packageId, year, month })
      .then((res) => {
        if (cancelled) return;
        setMonthDays(
          new Map(
            (res.days ?? []).map((d) => [
              d.date.slice(0, 10),
              d.hasAvailability,
            ]),
          ),
        );
      })
      .catch(() => {
        if (!cancelled) setMonthDays(new Map());
      });
    return () => {
      cancelled = true;
    };
  }, [companyId, rangeId, packageId, year, month]);

  useEffect(() => {
    setSelectedDate(null);
    setSlot(null);
    setSlots([]);
  }, [rangeId, packageId, year, month]);

  useEffect(() => {
    if (!selectedDate || !rangeId || !packageId) return;
    let cancelled = false;
    setSlotsLoading(true);
    setSlot(null);
    publicBookingsApi
      .dayAvailability(companyId, rangeId, { packageId, date: selectedDate })
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
  }, [companyId, rangeId, packageId, selectedDate]);

  const previousMonth = () =>
    month === 1 ? (setYear(year - 1), setMonth(12)) : setMonth(month - 1);
  const nextMonth = () =>
    month === 12 ? (setYear(year + 1), setMonth(1)) : setMonth(month + 1);

  return (
    <div className="space-y-5">
      <header className="space-y-3">
        {!embed && (
          <h1 className="font-heading text-xl font-medium">
            {options.company?.name ?? "Book a session"}
          </h1>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Select value={rangeId} onValueChange={setRangeId}>
            <SelectTrigger size="sm" className="w-40">
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent>
              {ranges.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name ?? "Range"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={packageId} onValueChange={setPackageId}>
            <SelectTrigger size="sm" className="w-56">
              <SelectValue placeholder="Package" />
            </SelectTrigger>
            <SelectContent>
              {packages.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name ?? "Package"} · {fmtMoney(p.price)} ·{" "}
                  {p.durationMinutes} min
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(selectedPackage || selectedRange) && (
          <div className="grid gap-3 sm:grid-cols-2">
            {selectedPackage && <PackageDetails pkg={selectedPackage} />}
            {selectedRange && <RangeDetails range={selectedRange} />}
          </div>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">
            {MONTH_LABELS[month - 1]} {year}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={previousMonth}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={nextMonth}
            >
              Next
            </Button>
          </div>
        </div>
      </header>

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
              onClick={() => setSelectedDate(key)}
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

      {selectedDate && (
        <BookingPanel
          companyId={companyId}
          rangeId={rangeId}
          packageId={packageId}
          maxShooters={selectedPackage?.maxShooters ?? 1}
          date={selectedDate}
          slots={slots}
          slotsLoading={slotsLoading}
          slot={slot}
          onPickSlot={setSlot}
        />
      )}

      {options.company && <CompanyDetails company={options.company} />}
    </div>
  );
}

function DetailCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function PackageDetails({ pkg }: { pkg: PublicPackageResponse }) {
  const items = pkg.items ?? [];
  return (
    <DetailCard title={pkg.name ?? "Package"}>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
        <span className="font-medium">{fmtMoney(pkg.price)}</span>
        <span className="text-muted-foreground">
          {pkg.durationMinutes} min
        </span>
        <span className="text-muted-foreground">
          up to {pkg.maxShooters}{" "}
          {pkg.maxShooters === 1 ? "shooter" : "shooters"}
        </span>
      </div>
      {pkg.description && (
        <p className="whitespace-pre-line text-[12.5px] text-muted-foreground">
          {pkg.description}
        </p>
      )}
      {items.length > 0 && (
        <div className="space-y-1 border-t pt-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-dim">
            Included
          </p>
          <ul className="space-y-1">
            {items.map((item, i) => (
              <li
                key={i}
                className="flex items-center justify-between text-[12.5px]"
              >
                <span>{item.description ?? "Item"}</span>
                <span className="font-medium tabular-nums">
                  {item.quantity}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </DetailCard>
  );
}

function RangeDetails({ range }: { range: PublicRangeResponse }) {
  const hours = (range.operatingHours ?? [])
    .slice()
    .sort((a, b) => ((a.day + 6) % 7) - ((b.day + 6) % 7));
  return (
    <DetailCard title={range.name ?? "Range"}>
      {range.description && (
        <p className="whitespace-pre-line text-[12.5px] text-muted-foreground">
          {range.description}
        </p>
      )}
      {hours.length > 0 && (
        <div className="space-y-1 border-t pt-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-dim">
            Operating hours
          </p>
          <ul className="space-y-1">
            {hours.map((h) => (
              <li
                key={h.day}
                className="flex items-center justify-between text-[12.5px]"
              >
                <span>{DAY_NAMES[h.day] ?? `Day ${h.day}`}</span>
                <span className="text-muted-foreground tabular-nums">
                  {hhmm(h.openTime)} – {hhmm(h.closeTime)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </DetailCard>
  );
}

function CompanyDetails({ company }: { company: PublicCompanyResponse }) {
  const addressLines = [
    company.addressLine1,
    company.addressLine2,
    [company.city, company.province].filter(Boolean).join(", ") || null,
    company.postalCode,
  ].filter(Boolean);
  return (
    <DetailCard title={company.name ?? "Contact"}>
      <div className="grid gap-3 text-[12.5px] sm:grid-cols-2">
        <div className="space-y-1">
          {company.email && (
            <p>
              <a
                href={`mailto:${company.email}`}
                className="text-foreground hover:underline"
              >
                {company.email}
              </a>
            </p>
          )}
          {company.phone && (
            <p>
              <a
                href={`tel:${company.phone}`}
                className="text-foreground hover:underline"
              >
                {company.phone}
              </a>
            </p>
          )}
        </div>
        {addressLines.length > 0 && (
          <address className="not-italic text-muted-foreground">
            {addressLines.map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </address>
        )}
      </div>
    </DetailCard>
  );
}

function BookingPanel({
  companyId,
  rangeId,
  packageId,
  maxShooters,
  date,
  slots,
  slotsLoading,
  slot,
  onPickSlot,
}: {
  companyId: string;
  rangeId: string;
  packageId: string;
  maxShooters: number;
  date: string;
  slots: AvailabilitySlotDto[];
  slotsLoading: boolean;
  slot: AvailabilitySlotDto | null;
  onPickSlot: (slot: AvailabilitySlotDto | null) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [shooterCount, setShooterCount] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const shooters = Number(shooterCount);

  function stepShooters(delta: number) {
    const next = Math.min(
      Math.max(1, (Number(shooterCount) || 0) + delta),
      maxShooters,
    );
    setShooterCount(String(next));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!slot) return;

    const result = z
      .object({
        fullName: requiredTextSchema("Full name"),
        email: requiredEmailSchema,
        phone: requiredSouthAfricanPhoneSchema,
      })
      .safeParse({ fullName, email, phone });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Please check your details.");
      return;
    }
    if (!Number.isInteger(shooters) || shooters < 1) {
      setError("Shooter count must be at least 1.");
      return;
    }

    setLoading(true);
    try {
      const res = await publicBookingsApi.createBooking(companyId, {
        shootingRangeId: rangeId,
        packageId,
        bookingDate: date,
        startTime: slot.startTime,
        shooterCount: shooters,
        fullName: result.data.fullName,
        email: result.data.email,
        phone: result.data.phone,
        notes: null,
      });
      setConfirmation(res?.bookingNumber ?? "confirmed");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (confirmation) {
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
          Booking requested
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {confirmation !== "confirmed" ? (
            <>
              Your reference is{" "}
              <span className="font-mono font-medium text-foreground">
                {confirmation}
              </span>
              .{" "}
            </>
          ) : null}
          We&apos;ll be in touch to confirm your session.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => {
            setConfirmation(null);
            onPickSlot(null);
            setFullName("");
            setEmail("");
            setPhone("");
            setShooterCount("1");
          }}
        >
          Book another time
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold">Available times</h3>
      {slotsLoading ? (
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

      {slot && (
        <form noValidate onSubmit={submit} className="space-y-3 border-t pt-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="pb-name">
              Full name<span className="text-destructive"> *</span>
            </Label>
            <Input
              id="pb-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Mokoena"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pb-email">
              Email<span className="text-destructive"> *</span>
            </Label>
            <Input
              id="pb-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pb-phone">
              Phone<span className="text-destructive"> *</span>
            </Label>
            <SouthAfricanPhoneInput
              id="pb-phone"
              value={phone}
              onValueChange={setPhone}
              placeholder="68 150 1196"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pb-shooters">Shooters</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Fewer shooters"
                disabled={shooters <= 1}
                onClick={() => stepShooters(-1)}
              >
                <MinusIcon />
              </Button>
              <Input
                id="pb-shooters"
                type="number"
                min={1}
                max={maxShooters}
                value={shooterCount}
                onChange={(e) => setShooterCount(e.target.value)}
                className="w-16 text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="More shooters"
                disabled={shooters >= maxShooters}
                onClick={() => stepShooters(1)}
              >
                <PlusIcon />
              </Button>
              <span className="text-[12.5px] text-muted-foreground">
                max {maxShooters}
              </span>
            </div>
          </div>

          {error && (
            <p className="text-[13px] font-medium text-destructive">{error}</p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Booking…" : "Request booking"}
          </Button>
        </form>
      )}
    </div>
  );
}
