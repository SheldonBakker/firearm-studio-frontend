import { useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { z } from "zod";
import { CheckIcon, MinusIcon, PlusIcon } from "lucide-react";
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
import { fmtMoney, fmtDate } from "~/lib/utils/format";
import { cn } from "~/lib/utils/cn";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
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

const contactSchema = z.object({
  fullName: requiredTextSchema("Full name"),
  email: requiredEmailSchema,
  phone: requiredSouthAfricanPhoneSchema,
});

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

// ── Cart (persisted wizard state) ──────────────────────────────────────────

type SlotRef = { startTime: string; endTime: string };

type Step = 1 | 2 | 3 | 4;

type CartState = {
  step: Step;
  rangeId: string;
  packageId: string;
  shooterCount: number;
  year: number;
  month: number; // 1-based
  selectedDate: string | null; // "YYYY-MM-DD"
  slot: SlotRef | null;
  fullName: string;
  email: string;
  phone: string;
};

type CartAction =
  | { type: "SET_RANGE"; rangeId: string }
  | { type: "SET_PACKAGE"; packageId: string; maxShooters: number }
  | { type: "SET_SHOOTERS"; value: number }
  | { type: "SET_MONTH"; year: number; month: number }
  | { type: "SET_DATE"; date: string | null }
  | { type: "SET_SLOT"; slot: SlotRef | null }
  | { type: "SET_CONTACT"; field: "fullName" | "email" | "phone"; value: string }
  | { type: "GOTO"; step: Step }
  | { type: "NEXT" }
  | { type: "BACK" }
  | { type: "RESET"; state: CartState }
  | { type: "HYDRATE"; state: CartState };

function clampShooters(n: number, max: number): number {
  const cap = Math.max(1, max);
  if (!Number.isFinite(n)) return 1;
  return Math.min(Math.max(1, Math.round(n)), cap);
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "SET_RANGE":
      return {
        ...state,
        rangeId: action.rangeId,
        selectedDate: null,
        slot: null,
      };
    case "SET_PACKAGE":
      return {
        ...state,
        packageId: action.packageId,
        shooterCount: clampShooters(state.shooterCount, action.maxShooters),
        selectedDate: null,
        slot: null,
      };
    case "SET_SHOOTERS":
      return { ...state, shooterCount: action.value };
    case "SET_MONTH":
      return {
        ...state,
        year: action.year,
        month: action.month,
        selectedDate: null,
        slot: null,
      };
    case "SET_DATE":
      return { ...state, selectedDate: action.date, slot: null };
    case "SET_SLOT":
      return { ...state, slot: action.slot };
    case "SET_CONTACT":
      return { ...state, [action.field]: action.value };
    case "GOTO":
      return { ...state, step: action.step };
    case "NEXT":
      return { ...state, step: Math.min(4, state.step + 1) as Step };
    case "BACK":
      return { ...state, step: Math.max(1, state.step - 1) as Step };
    case "RESET":
    case "HYDRATE":
      return action.state;
    default:
      return state;
  }
}

function makeInitialCart(options: PublicBookingOptionsResponse): CartState {
  const ranges = options.ranges ?? [];
  const packages = options.packages ?? [];
  const now = new Date();
  return {
    step: 1,
    rangeId: ranges[0]?.id ?? "",
    packageId: packages[0]?.id ?? "",
    shooterCount: 1,
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    selectedDate: null,
    slot: null,
    fullName: "",
    email: "",
    phone: "",
  };
}

const cartKey = (companyId: string) => `fs:booking-cart:${companyId}`;

/** Read + validate the persisted cart against the current options. Never throws. */
function readCart(
  companyId: string,
  options: PublicBookingOptionsResponse,
): CartState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(cartKey(companyId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CartState>;
    const base = makeInitialCart(options);
    const ranges = options.ranges ?? [];
    const packages = options.packages ?? [];

    const rangeId = ranges.some((r) => r.id === parsed.rangeId)
      ? (parsed.rangeId as string)
      : base.rangeId;
    const packageId = packages.some((p) => p.id === parsed.packageId)
      ? (parsed.packageId as string)
      : base.packageId;
    const maxShooters =
      packages.find((p) => p.id === packageId)?.maxShooters ?? 1;
    const shooterCount = clampShooters(Number(parsed.shooterCount), maxShooters);

    const year = Number.isInteger(parsed.year)
      ? (parsed.year as number)
      : base.year;
    const month =
      Number.isInteger(parsed.month) &&
      (parsed.month as number) >= 1 &&
      (parsed.month as number) <= 12
        ? (parsed.month as number)
        : base.month;

    const now = new Date();
    const todayKey = dateKey(
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate(),
    );
    let selectedDate =
      typeof parsed.selectedDate === "string" ? parsed.selectedDate : null;
    if (selectedDate && selectedDate < todayKey) selectedDate = null;

    let slot: SlotRef | null =
      parsed.slot &&
      typeof parsed.slot.startTime === "string" &&
      typeof parsed.slot.endTime === "string"
        ? { startTime: parsed.slot.startTime, endTime: parsed.slot.endTime }
        : null;
    if (!selectedDate) slot = null;

    return {
      step: 1, // always resume at step 1; the slot is re-validated on fetch
      rangeId,
      packageId,
      shooterCount,
      year,
      month,
      selectedDate,
      slot,
      fullName: typeof parsed.fullName === "string" ? parsed.fullName : "",
      email: typeof parsed.email === "string" ? parsed.email : "",
      phone: typeof parsed.phone === "string" ? parsed.phone : "",
    };
  } catch {
    return null;
  }
}

function writeCart(companyId: string, state: CartState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(cartKey(companyId), JSON.stringify(state));
  } catch {
    /* storage unavailable — ignore */
  }
}

function clearCart(companyId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(cartKey(companyId));
  } catch {
    /* storage unavailable — ignore */
  }
}

// ── Wizard ──────────────────────────────────────────────────────────────────

const STEP_LABELS = ["Selection", "Date & time", "Your details", "Review"];

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

  const [cart, dispatch] = useReducer(cartReducer, options, makeInitialCart);
  const {
    step,
    rangeId,
    packageId,
    shooterCount,
    year,
    month,
    selectedDate,
    slot,
    fullName,
    email,
    phone,
  } = cart;

  const [monthDays, setMonthDays] = useState<Map<string, boolean>>(new Map());
  const [slots, setSlots] = useState<AvailabilitySlotDto[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const hydratedRef = useRef(false);

  const selectedPackage = packages.find((p) => p.id === packageId);
  const selectedRange = ranges.find((r) => r.id === rangeId);
  const maxShooters = selectedPackage?.maxShooters ?? 1;

  const now = new Date();
  const todayKey = dateKey(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
  );

  // Restore persisted cart once, on mount.
  useEffect(() => {
    if (hydratedRef.current) return;
    const restored = readCart(companyId, options);
    if (restored) dispatch({ type: "HYDRATE", state: restored });
    hydratedRef.current = true;
  }, [companyId, options]);

  // Persist cart on every change (after hydration).
  useEffect(() => {
    if (!hydratedRef.current) return;
    writeCart(companyId, cart);
  }, [companyId, cart]);

  // Month availability.
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

  // Day availability (time slots).
  useEffect(() => {
    if (!selectedDate || !rangeId || !packageId) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
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

  // Drop a restored/stale slot that is no longer available for the day.
  useEffect(() => {
    if (slotsLoading || !slot) return;
    const ok = slots.some(
      (s) => s.startTime === slot.startTime && s.remainingLanes > 0,
    );
    if (!ok) dispatch({ type: "SET_SLOT", slot: null });
  }, [slots, slotsLoading, slot]);

  const slotValid =
    !!slot &&
    slots.some((s) => s.startTime === slot.startTime && s.remainingLanes > 0);

  const canNext =
    step === 1
      ? !!rangeId &&
        !!packageId &&
        shooterCount >= 1 &&
        shooterCount <= maxShooters
      : step === 2
        ? !!selectedDate && slotValid
        : step === 3
          ? Boolean(fullName.trim() && email.trim() && phone.trim())
          : false;

  const goMonth = (delta: number) => {
    let y = year;
    let m = month + delta;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    dispatch({ type: "SET_MONTH", year: y, month: m });
  };

  function handleNext() {
    if (step === 3) {
      const result = contactSchema.safeParse({ fullName, email, phone });
      if (!result.success) {
        setSubmitError(
          result.error.issues[0]?.message ?? "Please check your details.",
        );
        return;
      }
    }
    setSubmitError(null);
    dispatch({ type: "NEXT" });
  }

  async function requestBooking() {
    if (!slot || !selectedDate) return;
    const result = contactSchema.safeParse({ fullName, email, phone });
    if (!result.success) {
      setSubmitError(
        result.error.issues[0]?.message ?? "Please check your details.",
      );
      dispatch({ type: "GOTO", step: 3 });
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await publicBookingsApi.createBooking(companyId, {
        shootingRangeId: rangeId,
        packageId,
        bookingDate: selectedDate,
        startTime: slot.startTime,
        shooterCount,
        fullName: result.data.fullName,
        email: result.data.email,
        phone: result.data.phone,
        notes: null,
      });
      clearCart(companyId);
      setConfirmation(res?.bookingNumber ?? "confirmed");
    } catch (err) {
      setSubmitError(
        err instanceof ApiError ? err.message : "Something went wrong.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function bookAnother() {
    clearCart(companyId);
    dispatch({ type: "RESET", state: makeInitialCart(options) });
    setSubmitError(null);
    setConfirmation(null);
  }

  return (
    <div className="space-y-5">
      <CompanyHeader company={options.company} embed={embed} />

      {confirmation ? (
        <Confirmation bookingNumber={confirmation} onBookAnother={bookAnother} />
      ) : (
        <>
          <Stepper step={step} onGoto={(s) => dispatch({ type: "GOTO", step: s })} />

          {step === 1 && (
            <SelectionStep
              ranges={ranges}
              packages={packages}
              rangeId={rangeId}
              packageId={packageId}
              shooterCount={shooterCount}
              maxShooters={maxShooters}
              onPickRange={(id) => dispatch({ type: "SET_RANGE", rangeId: id })}
              onPickPackage={(id) =>
                dispatch({
                  type: "SET_PACKAGE",
                  packageId: id,
                  maxShooters:
                    packages.find((p) => p.id === id)?.maxShooters ?? 1,
                })
              }
              onShooters={(value) => dispatch({ type: "SET_SHOOTERS", value })}
            />
          )}

          {step === 2 && (
            <DateTimeStep
              year={year}
              month={month}
              monthDays={monthDays}
              todayKey={todayKey}
              selectedDate={selectedDate}
              slots={slots}
              slotsLoading={slotsLoading}
              slot={slot}
              onPrevMonth={() => goMonth(-1)}
              onNextMonth={() => goMonth(1)}
              onPickDate={(date) => dispatch({ type: "SET_DATE", date })}
              onPickSlot={(s) =>
                dispatch({
                  type: "SET_SLOT",
                  slot: { startTime: s.startTime, endTime: s.endTime },
                })
              }
            />
          )}

          {step === 3 && (
            <DetailsStep
              fullName={fullName}
              email={email}
              phone={phone}
              error={submitError}
              onChange={(field, value) =>
                dispatch({ type: "SET_CONTACT", field, value })
              }
            />
          )}

          {step === 4 && (
            <ReviewStep
              range={selectedRange}
              pkg={selectedPackage}
              shooterCount={shooterCount}
              selectedDate={selectedDate}
              slot={slot}
              fullName={fullName}
              email={email}
              phone={phone}
              error={submitError}
            />
          )}

          <WizardNav
            step={step}
            canNext={canNext}
            submitting={submitting}
            onBack={() => dispatch({ type: "BACK" })}
            onNext={handleNext}
            onSubmit={requestBooking}
          />
        </>
      )}
    </div>
  );
}

// ── Presentational pieces ────────────────────────────────────────────────────

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[11px] font-medium uppercase tracking-wide text-dim">
      {children}
    </h2>
  );
}

function CompanyHeader({
  company,
  embed,
}: {
  company: PublicCompanyResponse | null | undefined;
  embed: boolean;
}) {
  if (!company) return null;
  const addressLines = [
    company.addressLine1,
    company.addressLine2,
    [company.city, company.province].filter(Boolean).join(", ") || null,
    company.postalCode,
  ].filter(Boolean);
  return (
    <header className="space-y-2 border-b border-border pb-4">
      {!embed && (
        <h1 className="font-heading text-xl font-medium">
          {company.name ?? "Book a session"}
        </h1>
      )}
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-muted-foreground">
        {embed && company.name && (
          <span className="font-medium text-foreground">{company.name}</span>
        )}
        {company.email && (
          <a
            href={`mailto:${company.email}`}
            className="hover:text-foreground hover:underline"
          >
            {company.email}
          </a>
        )}
        {company.phone && (
          <a
            href={`tel:${company.phone}`}
            className="hover:text-foreground hover:underline"
          >
            {company.phone}
          </a>
        )}
        {addressLines.length > 0 && <span>{addressLines.join(", ")}</span>}
      </div>
    </header>
  );
}

function Stepper({ step, onGoto }: { step: Step; onGoto: (s: Step) => void }) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center gap-1.5">
        {STEP_LABELS.map((label, i) => {
          const n = (i + 1) as Step;
          const active = n === step;
          const done = n < step;
          return (
            <li key={label} className="flex flex-1 items-center gap-1.5">
              <button
                type="button"
                disabled={!done}
                onClick={() => done && onGoto(n)}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-lg py-1",
                  done && "cursor-pointer",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border text-[12px] font-medium",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : done
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border text-muted-foreground",
                  )}
                >
                  {done ? <CheckIcon className="size-3.5" /> : n}
                </span>
                <span
                  className={cn(
                    "hidden text-[12.5px] font-medium sm:inline",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </button>
              {i < STEP_LABELS.length - 1 && (
                <span
                  className={cn(
                    "h-px flex-1",
                    done ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function SelectionStep({
  ranges,
  packages,
  rangeId,
  packageId,
  shooterCount,
  maxShooters,
  onPickRange,
  onPickPackage,
  onShooters,
}: {
  ranges: PublicRangeResponse[];
  packages: PublicPackageResponse[];
  rangeId: string;
  packageId: string;
  shooterCount: number;
  maxShooters: number;
  onPickRange: (id: string) => void;
  onPickPackage: (id: string) => void;
  onShooters: (value: number) => void;
}) {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <SectionLabel>Choose a range</SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          {ranges.map((r) => (
            <RangeCard
              key={r.id}
              range={r}
              active={r.id === rangeId}
              onSelect={() => onPickRange(r.id)}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SectionLabel>Choose a package</SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          {packages.map((p) => (
            <PackageCard
              key={p.id}
              pkg={p}
              active={p.id === packageId}
              onSelect={() => onPickPackage(p.id)}
            />
          ))}
        </div>
      </section>

      <section>
        <ShooterStepper
          value={shooterCount}
          max={maxShooters}
          onChange={onShooters}
        />
      </section>
    </div>
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

function RangeCard({
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

function PackageCard({
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
          {pkg.maxShooters === 1 ? "shooter" : "shooters"}
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

function ShooterStepper({
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
      <Label htmlFor="pb-shooters">Shooters</Label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Fewer shooters"
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
          aria-label="More shooters"
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

function DateTimeStep({
  year,
  month,
  monthDays,
  todayKey,
  selectedDate,
  slots,
  slotsLoading,
  slot,
  onPrevMonth,
  onNextMonth,
  onPickDate,
  onPickSlot,
}: {
  year: number;
  month: number;
  monthDays: Map<string, boolean>;
  todayKey: string;
  selectedDate: string | null;
  slots: AvailabilitySlotDto[];
  slotsLoading: boolean;
  slot: SlotRef | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onPickDate: (date: string) => void;
  onPickSlot: (slot: AvailabilitySlotDto) => void;
}) {
  const { daysInMonth, leadingBlanks } = monthGrid(year, month);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">
          {MONTH_LABELS[month - 1]} {year}
        </h2>
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
    </div>
  );
}

function DetailsStep({
  fullName,
  email,
  phone,
  error,
  onChange,
}: {
  fullName: string;
  email: string;
  phone: string;
  error: string | null;
  onChange: (field: "fullName" | "email" | "phone", value: string) => void;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold">Your details</h3>
      <div className="flex flex-col gap-2">
        <Label htmlFor="pb-name">
          Full name<span className="text-destructive"> *</span>
        </Label>
        <Input
          id="pb-name"
          value={fullName}
          onChange={(e) => onChange("fullName", e.target.value)}
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
          onChange={(e) => onChange("email", e.target.value)}
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
          onValueChange={(v) => onChange("phone", v)}
          placeholder="68 150 1196"
        />
      </div>
      {error && (
        <p className="text-[13px] font-medium text-destructive">{error}</p>
      )}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function ReviewStep({
  range,
  pkg,
  shooterCount,
  selectedDate,
  slot,
  fullName,
  email,
  phone,
  error,
}: {
  range: PublicRangeResponse | undefined;
  pkg: PublicPackageResponse | undefined;
  shooterCount: number;
  selectedDate: string | null;
  slot: SlotRef | null;
  fullName: string;
  email: string;
  phone: string;
  error: string | null;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold">Review your booking</h3>
      <dl className="divide-y divide-border text-[13px]">
        <ReviewRow label="Range" value={range?.name ?? "—"} />
        <ReviewRow label="Package" value={pkg?.name ?? "—"} />
        <ReviewRow label="Price" value={fmtMoney(pkg?.price)} />
        <ReviewRow
          label="Duration"
          value={pkg ? `${pkg.durationMinutes} min` : "—"}
        />
        <ReviewRow label="Shooters" value={String(shooterCount)} />
        <ReviewRow label="Date" value={fmtDate(selectedDate)} />
        <ReviewRow
          label="Time"
          value={slot ? `${hhmm(slot.startTime)} – ${hhmm(slot.endTime)}` : "—"}
        />
        <ReviewRow label="Name" value={fullName || "—"} />
        <ReviewRow label="Email" value={email || "—"} />
        <ReviewRow label="Phone" value={phone || "—"} />
      </dl>
      {error && (
        <p className="text-[13px] font-medium text-destructive">{error}</p>
      )}
    </div>
  );
}

function WizardNav({
  step,
  canNext,
  submitting,
  onBack,
  onNext,
  onSubmit,
}: {
  step: Step;
  canNext: boolean;
  submitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
      <Button
        type="button"
        variant="outline"
        onClick={onBack}
        disabled={step === 1}
      >
        Back
      </Button>
      {step === 4 ? (
        <Button type="button" onClick={onSubmit} disabled={submitting}>
          {submitting ? "Booking…" : "Request booking"}
        </Button>
      ) : (
        <Button type="button" onClick={onNext} disabled={!canNext}>
          Next
        </Button>
      )}
    </div>
  );
}

function Confirmation({
  bookingNumber,
  onBookAnother,
}: {
  bookingNumber: string;
  onBookAnother: () => void;
}) {
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
        {bookingNumber !== "confirmed" ? (
          <>
            Your reference is{" "}
            <span className="font-mono font-medium text-foreground">
              {bookingNumber}
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
        onClick={onBookAnother}
      >
        Book another time
      </Button>
    </div>
  );
}
