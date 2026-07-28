import { useState } from "react";
import { redirect, useSearchParams } from "react-router";
import { toast } from "sonner";
import { DownloadIcon } from "lucide-react";
import type { Route } from "./+types/register";
import { registerApi } from "~/lib/api/register/register";
import { rangesApi } from "~/lib/api/ranges/ranges";
import { ApiError } from "~/lib/api/http";
import { EMDASH, fmtDate, fmtDateTime } from "~/lib/utils/format";
import { requireAuth, useSessionUser } from "~/context/auth-context";
import { can, canSeeNav } from "~/lib/utils/rbac";
import { PageWrap } from "~/components/common/misc";
import { PageActions } from "~/context/page-actions";
import { DataTable, type Column } from "~/components/common/data-table";
import { Mono } from "~/components/common/mono";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Resolve } from "~/components/common/skeletons";
import { FirearmOrigin, enumKey } from "~/lib/types/enums";
import type { RegisterRowDto } from "~/lib/api/register/types";

const PAGE_SIZE = 20;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const user = await requireAuth(request);
  if (!canSeeNav(user, "register")) throw redirect("/dashboard");

  const searchParams = new URL(request.url).searchParams;
  const requestedPage = Number(searchParams.get("page"));
  const pageNumber =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const rangeId = searchParams.get("rangeId")?.trim() || undefined;
  const requestedFrom = searchParams.get("dateFrom") ?? "";
  const dateFrom = DATE_PATTERN.test(requestedFrom) ? requestedFrom : undefined;
  const requestedTo = searchParams.get("dateTo") ?? "";
  const dateTo = DATE_PATTERN.test(requestedTo) ? requestedTo : undefined;

  const registerP = registerApi.list({
    pageNumber,
    pageSize: PAGE_SIZE,
    rangeId,
    dateFrom,
    dateTo,
  });
  const rangesP = rangesApi.all().catch(() => []);
  return { data: registerP, ranges: rangesP };
}

export default function Register({ loaderData }: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useSessionUser();
  const canExport = can(user, "bookings:export-register");
  const [exporting, setExporting] = useState(false);

  const rangeId = searchParams.get("rangeId") ?? "all";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";
  const hasFilters = rangeId !== "all" || !!dateFrom || !!dateTo;

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

  async function exportCsv() {
    setExporting(true);
    try {
      await registerApi.exportCsv({
        rangeId: rangeId === "all" ? undefined : rangeId,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not export register");
    } finally {
      setExporting(false);
    }
  }

  const columns: Column<RegisterRowDto>[] = [
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
      key: "range",
      header: "Range",
      cell: (r) => (
        <span className="text-[12.5px] text-muted-foreground">
          {r.rangeName ?? EMDASH}
        </span>
      ),
    },
    {
      key: "booking",
      header: "Booking",
      cell: (r) => (
        <Mono className="text-[12.5px] font-semibold text-foreground">
          {r.bookingNumber ?? EMDASH}
        </Mono>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      cell: (r) => (
        <span className="text-[12.5px] text-foreground">
          {r.customerName ?? EMDASH}
        </span>
      ),
    },
    {
      key: "attendee",
      header: "Attendee",
      cell: (r) => (
        <span className="flex flex-col">
          <span className="text-[12.5px] text-foreground">
            {r.attendeeFullName ?? EMDASH}
          </span>
          <Mono className="text-[11.5px] text-dim">
            {r.attendeeIdNumber ?? EMDASH}
          </Mono>
        </span>
      ),
    },
    {
      key: "firearm",
      header: "Firearm",
      cell: (r) => (
        <span className="flex flex-col">
          <span className="text-[12.5px] text-foreground">
            {r.firearmMakeModel ?? EMDASH}
          </span>
          <Mono className="text-[11.5px] text-dim">
            {[r.firearmSerialNumber, r.calibre].filter(Boolean).join(" · ") ||
              EMDASH}
          </Mono>
        </span>
      ),
    },
    {
      key: "licence",
      header: "Licence",
      cell: (r) => (
        <Mono className="text-[12.5px] text-muted-foreground">
          {r.licenceNumber ?? EMDASH}
        </Mono>
      ),
    },
    {
      key: "origin",
      header: "Origin",
      cell: (r) => (
        <span className="text-[12.5px] text-muted-foreground">
          {enumKey(FirearmOrigin, r.firearmOrigin) === "RangeRental"
            ? "Range rental"
            : "Own"}
        </span>
      ),
    },
    {
      key: "indemnity",
      header: "Indemnity",
      align: "center",
      cell: (r) => (
        <span className="text-[12.5px] text-muted-foreground">
          {r.signedIndemnity ? "Yes" : "No"}
        </span>
      ),
    },
    {
      key: "checkedIn",
      header: "Checked in",
      cell: (r) => (
        <span className="text-[12.5px] text-muted-foreground">
          {fmtDateTime(r.checkedInAt)}
        </span>
      ),
    },
  ];

  return (
    <PageWrap>
      {canExport && (
        <PageActions>
          <Button
            variant="outline"
            disabled={exporting}
            onClick={exportCsv}
          >
            <DownloadIcon />
            {exporting ? "Exporting…" : "Export CSV"}
          </Button>
        </PageActions>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Resolve resolve={loaderData.ranges} fallback={null}>
          {(ranges) => (
            <Select
              value={rangeId}
              onValueChange={(v) => setParam("rangeId", v === "all" ? null : v)}
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
      </div>

      <Resolve
        resolve={loaderData.data}
        fallback={
          <DataTable<RegisterRowDto> columns={columns} rows={[]} loading />
        }
      >
        {(registerPage) => {
          const rows = registerPage.items ?? [];
          return (
            <>
              <DataTable<RegisterRowDto>
                columns={columns}
                rows={rows}
                empty={
                  hasFilters
                    ? "No register entries match these filters."
                    : "No range register entries yet."
                }
              />

              {registerPage.totalCount > registerPage.pageSize && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[12.5px] text-muted-foreground">
                    Showing{" "}
                    {(registerPage.pageNumber - 1) * registerPage.pageSize + 1}–
                    {Math.min(
                      registerPage.pageNumber * registerPage.pageSize,
                      registerPage.totalCount,
                    )}{" "}
                    of {registerPage.totalCount}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={registerPage.pageNumber <= 1}
                      onClick={() => navigatePage(registerPage.pageNumber - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={
                        registerPage.pageNumber * registerPage.pageSize >=
                        registerPage.totalCount
                      }
                      onClick={() => navigatePage(registerPage.pageNumber + 1)}
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
    </PageWrap>
  );
}
