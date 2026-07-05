import { useState } from "react";
import { useNavigate, useRevalidator, useSearchParams } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/bookings";
import { Share2Icon } from "lucide-react";
import { bookingsApi } from "~/lib/api/bookings/bookings";
import { rangesApi } from "~/lib/api/ranges/ranges";
import { packagesApi } from "~/lib/api/packages/packages";
import { companyApi } from "~/lib/api/company/company";
import { fmtDate, fmtMoney } from "~/lib/utils/format";
import { useSessionUser } from "~/context/auth-context";
import { can } from "~/lib/utils/rbac";
import { PageWrap } from "~/components/common/misc";
import { PageActions } from "~/context/page-actions";
import { FilterBar } from "~/components/common/filter-bar";
import { DataTable, type Column } from "~/components/common/data-table";
import { StatusBadge } from "~/components/common/status-badge";
import { Mono } from "~/components/common/mono";
import { Icon } from "~/components/common/icon";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { BookingFormDialog } from "~/components/modals/booking-form-dialog";
import { ShareCalendarDialog } from "~/components/modals/share-calendar-dialog";
import { Resolve } from "~/components/common/skeletons";
import { BookingSource, BookingStatus, enumKey } from "~/lib/types/enums";
import type {
  BookingListItemDto,
  BookingListItemDtoPaginatedResponse,
} from "~/lib/api/bookings/types";

const PAGE_SIZE = 20;

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: String(BookingStatus.Pending), label: "Pending" },
  { id: String(BookingStatus.Confirmed), label: "Confirmed" },
  { id: String(BookingStatus.Completed), label: "Completed" },
  { id: String(BookingStatus.Cancelled), label: "Cancelled" },
  { id: String(BookingStatus.NoShow), label: "No-show" },
];

const BOOKING_STATUSES = new Set(STATUS_FILTERS.slice(1).map(({ id }) => id));

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function clientLoader({ request }: Route.ClientLoaderArgs) {
  const searchParams = new URL(request.url).searchParams;
  const requestedPage = Number(searchParams.get("page"));
  const pageNumber =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const requestedStatus = searchParams.get("status");
  const status =
    requestedStatus && BOOKING_STATUSES.has(requestedStatus)
      ? requestedStatus
      : undefined;

  const rangeId = searchParams.get("rangeId")?.trim() || undefined;
  const requestedFrom = searchParams.get("dateFrom") ?? "";
  const dateFrom = DATE_PATTERN.test(requestedFrom) ? requestedFrom : undefined;
  const requestedTo = searchParams.get("dateTo") ?? "";
  const dateTo = DATE_PATTERN.test(requestedTo) ? requestedTo : undefined;

  const bookingsP = bookingsApi
    .list({
      pageNumber,
      pageSize: PAGE_SIZE,
      sortOrder: "desc",
      status,
      rangeId,
      dateFrom,
      dateTo,
    })
    .catch(
      () =>
        ({
          items: [],
          pageNumber,
          pageSize: PAGE_SIZE,
          totalCount: 0,
        }) satisfies BookingListItemDtoPaginatedResponse,
    );
  const rangesP = rangesApi.all().catch(() => []);
  const packagesP = packagesApi.all().catch(() => []);
  const companyP = companyApi.get().catch(() => null);
  return {
    data: bookingsP,
    ranges: rangesP,
    packages: packagesP,
    company: companyP,
  };
}

export default function Bookings({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const revalidator = useRevalidator();
  const user = useSessionUser();
  const writable = can(user, "bookings:write");
  const [addOpen, setAddOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const activeStatus = BOOKING_STATUSES.has(searchParams.get("status") ?? "")
    ? searchParams.get("status")!
    : "all";
  const rangeId = searchParams.get("rangeId") ?? "all";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";

  const hasFilters =
    activeStatus !== "all" || rangeId !== "all" || !!dateFrom || !!dateTo;

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    next.delete("page");
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const navigatePage = (newPage: number) => {
    const next = new URLSearchParams(searchParams);
    if (newPage <= 1) next.delete("page");
    else next.set("page", String(newPage));
    setSearchParams(next);
  };

  const columns: Column<BookingListItemDto>[] = [
    {
      key: "num",
      header: "Booking",
      cell: (r) => (
        <Mono className="text-[12.5px] font-semibold text-foreground">
          {r.bookingNumber ?? r.id.slice(0, 8)}
        </Mono>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      cell: (r) => (
        <span className="text-[12.5px] text-foreground">
          {r.customerName ?? "—"}
        </span>
      ),
    },
    {
      key: "range",
      header: "Range",
      cell: (r) => (
        <span className="text-[12.5px] text-muted-foreground">
          {r.rangeName ?? "—"}
        </span>
      ),
    },
    {
      key: "package",
      header: "Package",
      cell: (r) => (
        <span className="flex flex-col">
          <span className="text-[12.5px] text-foreground">
            {r.packageName ?? "—"}
          </span>
          <span className="text-[11.5px] text-dim">
            {fmtMoney(r.packagePrice)}
          </span>
        </span>
      ),
    },
    {
      key: "when",
      header: "Date & time",
      cell: (r) => (
        <span className="flex flex-col">
          <span className="text-[12.5px] text-foreground">
            {fmtDate(r.bookingDate)}
          </span>
          <Mono className="text-[11.5px] text-dim">
            {r.startTime.slice(0, 5)}–{r.endTime.slice(0, 5)}
          </Mono>
        </span>
      ),
    },
    {
      key: "source",
      header: "Source",
      cell: (r) => (
        <span className="text-[12.5px] text-muted-foreground">
          {enumKey(BookingSource, r.source) ?? "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "right",
      cell: (r) => (
        <StatusBadge status={enumKey(BookingStatus, r.status) ?? "—"} />
      ),
    },
    {
      key: "go",
      header: "",
      align: "right",
      width: "40px",
      cell: () => (
        <span className="flex justify-end text-dim">
          <Icon name="arrow" size={16} />
        </span>
      ),
    },
  ];

  return (
    <PageWrap>
      <PageActions>
        <Button variant="outline" onClick={() => setShareOpen(true)}>
          <Share2Icon />
          Share calendar
        </Button>
        {writable && (
          <Button onClick={() => setAddOpen(true)}>
            <Icon name="plus" size={16} />
            New booking
          </Button>
        )}
      </PageActions>
      <FilterBar
        active={activeStatus}
        onChange={(status) =>
          setParam("status", status === "all" ? null : status)
        }
        options={STATUS_FILTERS}
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Resolve resolve={loaderData.ranges} fallback={null}>
              {(ranges) => (
                <Select
                  value={rangeId}
                  onValueChange={(v) =>
                    setParam("rangeId", v === "all" ? null : v)
                  }
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
            <Input
              type="date"
              aria-label="From date"
              value={dateFrom}
              onChange={(e) => setParam("dateFrom", e.target.value || null)}
              className="h-7 w-34 text-[0.8rem]"
            />
            <span className="text-dim">–</span>
            <Input
              type="date"
              aria-label="To date"
              value={dateTo}
              onChange={(e) => setParam("dateTo", e.target.value || null)}
              className="h-7 w-34 text-[0.8rem]"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate("/bookings/calendar")}
            >
              <Icon name="cal" size={14} />
              Calendar
            </Button>
          </div>
        }
      />
      <Resolve
        resolve={loaderData.data}
        fallback={
          <DataTable<BookingListItemDto> columns={columns} rows={[]} loading />
        }
      >
        {(bookingsPage) => {
          const bookings = bookingsPage.items ?? [];
          return (
            <>
              <DataTable<BookingListItemDto>
                columns={columns}
                rows={bookings}
                onRowClick={(r) => navigate(`/bookings/${r.id}`)}
                empty={
                  hasFilters
                    ? "No bookings match these filters."
                    : "No bookings yet."
                }
              />

              {bookingsPage.totalCount > bookingsPage.pageSize && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[12.5px] text-muted-foreground">
                    Showing{" "}
                    {(bookingsPage.pageNumber - 1) * bookingsPage.pageSize + 1}–
                    {Math.min(
                      bookingsPage.pageNumber * bookingsPage.pageSize,
                      bookingsPage.totalCount,
                    )}{" "}
                    of {bookingsPage.totalCount}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={bookingsPage.pageNumber <= 1}
                      onClick={() => navigatePage(bookingsPage.pageNumber - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={
                        bookingsPage.pageNumber * bookingsPage.pageSize >=
                        bookingsPage.totalCount
                      }
                      onClick={() => navigatePage(bookingsPage.pageNumber + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          );
        }}
      </Resolve>

      <Resolve resolve={loaderData.ranges} fallback={null}>
        {(ranges) => (
          <Resolve resolve={loaderData.packages} fallback={null}>
            {(packages) => (
              <BookingFormDialog
                open={addOpen}
                onOpenChange={setAddOpen}
                ranges={ranges}
                packages={packages}
                onCreated={(id) => {
                  toast.success("Booking created");
                  if (id) navigate(`/bookings/${id}`);
                  else revalidator.revalidate();
                }}
              />
            )}
          </Resolve>
        )}
      </Resolve>

      <Resolve resolve={loaderData.company} fallback={null}>
        {(company) => (
          <ShareCalendarDialog
            open={shareOpen}
            onOpenChange={setShareOpen}
            companyId={company?.id ?? null}
          />
        )}
      </Resolve>
    </PageWrap>
  );
}
