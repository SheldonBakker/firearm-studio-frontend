import { useEffect, useReducer, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { z } from "zod";
import type { Route } from "./+types/public-calendar";
import { publicBookingsApi } from "~/lib/api/public/public";
import type {
  AvailabilitySlotDto,
  PublicBookingOptionsResponse,
} from "~/lib/api/public/types";
import { ApiError } from "~/lib/api/http";
import { pageMeta } from "~/lib/utils/seo";
import { dateKey } from "~/lib/utils/date";
import { cn } from "~/lib/utils/cn";
import { Resolve } from "~/components/common/skeletons";
import {
  requiredEmailSchema,
  requiredTextSchema,
} from "~/lib/utils/validation";
import { requiredSouthAfricanPhoneSchema } from "~/lib/utils/phone";
import {
  cartReducer,
  cartTotal,
  clearCart,
  makeInitialCart,
  newKey,
  readCart,
  writeCart,
  type ConfirmationState,
} from "~/lib/booking/cart";
import { CompanyHeader } from "~/components/public-booking/company-header";
import { Stepper } from "~/components/public-booking/stepper";
import { SelectionStep } from "~/components/public-booking/selection-step";
import { DateTimeStep } from "~/components/public-booking/date-time-step";
import { DetailsStep } from "~/components/public-booking/details-step";
import { ReviewStep } from "~/components/public-booking/review-step";
import { WizardNav } from "~/components/public-booking/wizard-nav";
import { Confirmation } from "~/components/public-booking/confirmation";

export function meta({ location }: Route.MetaArgs) {
  return pageMeta({
    title: "Book a session",
    description: "Check availability and book a facility session online.",
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
  const { step, items, draft, fullName, email, phone } = cart;

  const [monthDays, setMonthDays] = useState<Map<string, boolean>>(new Map());
  const [slots, setSlots] = useState<AvailabilitySlotDto[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationState>(null);

  const hydratedRef = useRef(false);

  const draftPackage = packages.find((p) => p.id === draft.packageId);
  const maxShooters = draftPackage?.maxShooters ?? 1;

  const now = new Date();
  const todayKey = dateKey(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
  );

  useEffect(() => {
    if (hydratedRef.current) return;
    const restored = readCart(companyId, options);
    if (restored) dispatch({ type: "HYDRATE", state: restored });
    hydratedRef.current = true;
  }, [companyId, options]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    writeCart(companyId, cart);
  }, [companyId, cart]);

  useEffect(() => {
    if (!draft.rangeId || !draft.packageId) {
      setMonthDays(new Map());
      return;
    }
    let cancelled = false;
    publicBookingsApi
      .monthAvailability(companyId, draft.rangeId, {
        packageId: draft.packageId,
        year: draft.year,
        month: draft.month,
      })
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
  }, [companyId, draft.rangeId, draft.packageId, draft.year, draft.month]);

  useEffect(() => {
    if (!draft.selectedDate || !draft.rangeId || !draft.packageId) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    publicBookingsApi
      .dayAvailability(companyId, draft.rangeId, {
        packageId: draft.packageId,
        date: draft.selectedDate,
      })
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
  }, [companyId, draft.rangeId, draft.packageId, draft.selectedDate]);

  useEffect(() => {
    if (slotsLoading || !draft.slot) return;
    const ok = slots.some(
      (s) => s.startTime === draft.slot!.startTime && s.remainingLanes > 0,
    );
    if (!ok) dispatch({ type: "SET_SLOT", slot: null });
  }, [slots, slotsLoading, draft.slot]);

  const draftSlotValid =
    !!draft.slot &&
    slots.some(
      (s) => s.startTime === draft.slot!.startTime && s.remainingLanes > 0,
    );

  const draftIsDuplicate =
    !!draft.selectedDate &&
    !!draft.slot &&
    items.some(
      (i) =>
        i.rangeId === draft.rangeId &&
        i.date === draft.selectedDate &&
        i.slot.startTime === draft.slot!.startTime,
    );

  const canAddSession =
    !!draft.rangeId &&
    !!draft.packageId &&
    !!draft.selectedDate &&
    draftSlotValid &&
    draft.shooterCount >= 1 &&
    draft.shooterCount <= maxShooters &&
    !draftIsDuplicate;

  const canNext =
    step === 1
      ? !!draft.rangeId &&
        !!draft.packageId &&
        draft.shooterCount >= 1 &&
        draft.shooterCount <= maxShooters
      : step === 2
        ? items.length > 0
        : step === 3
          ? Boolean(fullName.trim() && email.trim() && phone.trim())
          : false;

  const total = cartTotal(items, packages);

  const goMonth = (delta: number) => {
    let y = draft.year;
    let m = draft.month + delta;
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

  async function requestBookings() {
    if (items.length === 0) return;
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
      const res = await publicBookingsApi.createBookings(companyId, {
        sessions: items.map((item) => ({
          shootingRangeId: item.rangeId,
          packageId: item.packageId,
          bookingDate: item.date,
          startTime: item.slot.startTime,
          shooterCount: item.shooterCount,
          notes: null,
        })),
        fullName: result.data.fullName,
        email: result.data.email,
        phone: result.data.phone,
        notes: null,
      });
      const refs = (res.bookings ?? [])
        .map((b) => b.bookingNumber)
        .filter((n): n is string => !!n);
      clearCart(companyId);
      setConfirmation({
        count: res.bookings?.length ?? items.length,
        refs,
        invoiceNumber: res.invoiceNumber,
        total: res.total,
        email: result.data.email,
        banking: res.banking ?? null,
      });
    } catch (err) {
      setSubmitError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. No sessions were booked — please try again.",
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
        <Confirmation confirmation={confirmation} onBookAnother={bookAnother} />
      ) : (
        <>
          <Stepper step={step} onGoto={(s) => dispatch({ type: "GOTO", step: s })} />

          {step === 1 && (
            <SelectionStep
              ranges={ranges}
              packages={packages}
              draft={draft}
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
              ranges={ranges}
              packages={packages}
              draft={draft}
              monthDays={monthDays}
              todayKey={todayKey}
              slots={slots}
              slotsLoading={slotsLoading}
              items={items}
              total={total}
              canAddSession={canAddSession}
              isDuplicate={draftIsDuplicate}
              onPrevMonth={() => goMonth(-1)}
              onNextMonth={() => goMonth(1)}
              onPickDate={(date) => dispatch({ type: "SET_DATE", date })}
              onPickSlot={(s) =>
                dispatch({
                  type: "SET_SLOT",
                  slot: { startTime: s.startTime, endTime: s.endTime },
                })
              }
              onAdd={() => dispatch({ type: "ADD_ITEM", key: newKey() })}
              onRemove={(key) => dispatch({ type: "REMOVE_ITEM", key })}
            />
          )}

          {step === 3 && (
            <DetailsStep
              fullName={fullName}
              email={email}
              phone={phone}
              error={submitError}
              onChange={(field, value) =>
                dispatch({
                  type: "SET_CONTACT",
                  field,
                  value: field === "email" ? value.toLowerCase() : value,
                })
              }
            />
          )}

          {step === 4 && (
            <ReviewStep
              items={items}
              ranges={ranges}
              packages={packages}
              total={total}
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
            submitLabel={
              items.length === 1
                ? "Request booking"
                : `Request ${items.length} bookings`
            }
            onBack={() => dispatch({ type: "BACK" })}
            onNext={handleNext}
            onSubmit={requestBookings}
          />
        </>
      )}
    </div>
  );
}
