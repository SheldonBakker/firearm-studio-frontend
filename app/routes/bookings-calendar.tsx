import { useNavigate, useSearchParams } from "react-router";
import type { Route } from "./+types/bookings-calendar";
import { bookingsApi } from "~/lib/api/bookings/bookings";
import { rangesApi } from "~/lib/api/ranges/ranges";
import { statusMeta } from "~/lib/utils/format";
import { PageWrap, BackLink } from "~/components/common/misc";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Resolve } from "~/components/common/skeletons";
import { BookingStatus, enumKey } from "~/lib/types/enums";
import type { BookingCalendarItemDto } from "~/lib/api/bookings/types";
import { cn } from "~/lib/utils/cn";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function parseMonthParams(searchParams: URLSearchParams) {
  const now = new Date();
  const requestedYear = Number(searchParams.get("year"));
  const requestedMonth = Number(searchParams.get("month"));
  const year =
    Number.isInteger(requestedYear) && requestedYear >= 2000
      ? requestedYear
      : now.getFullYear();
  const month =
    Number.isInteger(requestedMonth) &&
    requestedMonth >= 1 &&
    requestedMonth <= 12
      ? requestedMonth
      : now.getMonth() + 1;
  return { year, month };
}

export function clientLoader({ request }: Route.ClientLoaderArgs) {
  const searchParams = new URL(request.url).searchParams;
  const { year, month } = parseMonthParams(searchParams);
  const rangeId = searchParams.get("rangeId")?.trim() || undefined;

  const bookingsP = bookingsApi
    .calendar({ year, month, rangeId })
    .catch(() => [] as BookingCalendarItemDto[]);
  const rangesP = rangesApi.all().catch(() => []);
  return { data: bookingsP, ranges: rangesP, year, month };
}

const MAX_CHIPS_PER_DAY = 3;

export default function BookingsCalendar({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { year, month } = loaderData;
  const rangeId = searchParams.get("rangeId") ?? "all";

  const setMonth = (nextYear: number, nextMonth: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("year", String(nextYear));
    next.set("month", String(nextMonth));
    setSearchParams(next);
  };

  const previousMonth = () =>
    month === 1 ? setMonth(year - 1, 12) : setMonth(year, month - 1);
  const nextMonth = () =>
    month === 12 ? setMonth(year + 1, 1) : setMonth(year, month + 1);

  const daysInMonth = new Date(year, month, 0).getDate();
  // getDay() is Sunday-first; shift so Monday leads the grid.
  const leadingBlanks = (new Date(year, month - 1, 1).getDay() + 6) % 7;

  return (
    <PageWrap>
      <BackLink label="Back to bookings" onClick={() => navigate("/bookings")} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">
          {MONTH_LABELS[month - 1]} {year}
        </h2>
        <div className="flex items-center gap-2">
          <Resolve resolve={loaderData.ranges} fallback={null}>
            {(ranges) => (
              <Select
                value={rangeId}
                onValueChange={(v) => {
                  const next = new URLSearchParams(searchParams);
                  if (v === "all") next.delete("rangeId");
                  else next.set("rangeId", v);
                  setSearchParams(next);
                }}
              >
                <SelectTrigger size="sm" className="w-36">
                  <SelectValue placeholder="Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All ranges</SelectItem>
                  {ranges.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name ?? "Unnamed range"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Resolve>
          <Button type="button" variant="outline" size="sm" onClick={previousMonth}>
            Previous
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={nextMonth}>
            Next
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="px-1.5 pb-1 text-[11px] font-medium uppercase tracking-wide text-dim"
          >
            {day}
          </div>
        ))}
        <Resolve
          resolve={loaderData.data}
          fallback={Array.from({ length: leadingBlanks + daysInMonth }).map(
            (_, i) => (
              <div
                key={i}
                className="min-h-24 animate-pulse rounded-lg border border-border bg-card"
              />
            ),
          )}
        >
          {(items) => {
            const byDate = new Map<string, BookingCalendarItemDto[]>();
            for (const item of items) {
              const key = item.bookingDate.slice(0, 10);
              const list = byDate.get(key) ?? [];
              list.push(item);
              byDate.set(key, list);
            }
            for (const list of byDate.values()) {
              list.sort((a, b) => a.startTime.localeCompare(b.startTime));
            }

            return (
              <>
                {Array.from({ length: leadingBlanks }).map((_, i) => (
                  <div key={`blank-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const dayBookings = byDate.get(dateKey) ?? [];
                  const overflow = dayBookings.length - MAX_CHIPS_PER_DAY;
                  return (
                    <div
                      key={dateKey}
                      className={cn(
                        "min-h-24 rounded-lg border border-border bg-card p-1.5",
                        dayBookings.length === 0 && "opacity-70",
                      )}
                    >
                      <div className="text-right text-[11px] text-dim">
                        {day}
                      </div>
                      <div className="mt-0.5 flex flex-col gap-0.5">
                        {dayBookings
                          .slice(0, MAX_CHIPS_PER_DAY)
                          .map((booking) => (
                            <button
                              key={booking.id}
                              type="button"
                              onClick={() =>
                                navigate(`/bookings/${booking.id}`)
                              }
                              className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[11px] text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                              title={`${booking.startTime.slice(0, 5)} ${booking.customerName ?? ""}`}
                            >
                              <span
                                className="size-1.5 shrink-0 rounded-full"
                                style={{
                                  backgroundColor: statusMeta(
                                    enumKey(BookingStatus, booking.status),
                                  ).color,
                                }}
                              />
                              <span className="shrink-0 font-medium text-foreground">
                                {booking.startTime.slice(0, 5)}
                              </span>
                              <span className="truncate">
                                {booking.customerName ?? "—"}
                              </span>
                            </button>
                          ))}
                        {overflow > 0 && (
                          <span className="px-1 text-[11px] text-dim">
                            +{overflow} more
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            );
          }}
        </Resolve>
      </div>
    </PageWrap>
  );
}
