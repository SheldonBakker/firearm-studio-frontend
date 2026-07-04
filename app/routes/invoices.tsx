import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import type { Route } from "./+types/invoices";
import { invoicesApi } from "~/lib/api/invoices/invoices";
import { inv } from "~/lib/utils/entities";
import { fmtMoney } from "~/lib/utils/format";
import { PageWrap } from "~/components/common/misc";
import { PageHeader } from "~/components/common/page-header";
import { FilterBar } from "~/components/common/filter-bar";
import { DataTable } from "~/components/common/data-table";
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
import { Resolve, ListSkeleton } from "~/components/common/skeletons";
import { InvoiceStatus } from "~/lib/types/enums";
import type {
  InvoiceListItemDtoPaginatedResponse,
  InvoiceResponse,
} from "~/lib/api/invoices/types";

const PAGE_SIZE = 20;

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: String(InvoiceStatus.Draft), label: "Draft" },
  { id: String(InvoiceStatus.Sent), label: "Sent" },
  { id: String(InvoiceStatus.Paid), label: "Paid" },
  { id: String(InvoiceStatus.Overdue), label: "Overdue" },
  { id: String(InvoiceStatus.Cancelled), label: "Cancelled" },
];

const INVOICE_STATUSES = new Set(STATUS_FILTERS.slice(1).map(({ id }) => id));

const SORT_OPTIONS = [
  { id: "invoiceMonth", label: "Month" },
  { id: "invoiceNumber", label: "Invoice #" },
  { id: "total", label: "Total" },
];

const SORT_FIELDS = new Set(SORT_OPTIONS.map(({ id }) => id));
const DEFAULT_SORT_BY = "invoiceMonth";
const DEFAULT_SORT_ORDER = "desc";

const SEARCH_FIELDS = [
  { id: "customerName", label: "Customer" },
  { id: "invoiceNumber", label: "Invoice #" },
] as const;

type SearchField = (typeof SEARCH_FIELDS)[number]["id"];

export function clientLoader({ request }: Route.ClientLoaderArgs) {
  const searchParams = new URL(request.url).searchParams;
  const requestedPage = Number(searchParams.get("page"));
  const pageNumber =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const requestedStatus = searchParams.get("status");
  const status =
    requestedStatus && INVOICE_STATUSES.has(requestedStatus)
      ? requestedStatus
      : undefined;

  const requestedSortBy = searchParams.get("sortBy");
  const sortBy =
    requestedSortBy && SORT_FIELDS.has(requestedSortBy)
      ? requestedSortBy
      : DEFAULT_SORT_BY;
  const sortOrder =
    searchParams.get("sortOrder") === "asc" ? "asc" : DEFAULT_SORT_ORDER;

  const invoiceNumber = searchParams.get("invoiceNumber")?.trim() || undefined;
  const customerName = searchParams.get("customerName")?.trim() || undefined;

  const invoicesP = invoicesApi
    .list({
      pageNumber,
      pageSize: PAGE_SIZE,
      sortBy,
      sortOrder,
      status,
      invoiceNumber,
      customerName,
    })
    .catch(
      () =>
        ({
          items: [],
          pageNumber,
          pageSize: PAGE_SIZE,
          totalCount: 0,
        }) satisfies InvoiceListItemDtoPaginatedResponse,
    );
  return { data: invoicesP };
}

export default function Invoices({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeStatus = INVOICE_STATUSES.has(searchParams.get("status") ?? "")
    ? searchParams.get("status")!
    : "all";
  const sortBy = SORT_FIELDS.has(searchParams.get("sortBy") ?? "")
    ? searchParams.get("sortBy")!
    : DEFAULT_SORT_BY;
  const sortOrder =
    searchParams.get("sortOrder") === "asc" ? "asc" : DEFAULT_SORT_ORDER;

  const [searchField, setSearchField] = useState<SearchField>(() =>
    searchParams.get("invoiceNumber") ? "invoiceNumber" : "customerName",
  );
  const [searchText, setSearchText] = useState(
    () =>
      searchParams.get("customerName") ??
      searchParams.get("invoiceNumber") ??
      "",
  );

  const hasFilters =
    activeStatus !== "all" ||
    !!searchParams.get("invoiceNumber")?.trim() ||
    !!searchParams.get("customerName")?.trim();

  // Debounce the search input into the URL search params.
  useEffect(() => {
    const current = searchParams.get(searchField)?.trim() ?? "";
    const next = searchText.trim();
    if (current === next) return;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      params.delete("page");
      params.delete("customerName");
      params.delete("invoiceNumber");
      if (next) params.set(searchField, next);
      setSearchParams(params);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [searchText, searchField, searchParams, setSearchParams]);

  const setStatusFilter = (status: string) => {
    const next = new URLSearchParams(searchParams);
    next.delete("page");
    if (status === "all") next.delete("status");
    else next.set("status", status);
    setSearchParams(next);
  };

  const setSort = (nextSortBy: string, nextSortOrder: string) => {
    const next = new URLSearchParams(searchParams);
    next.delete("page");
    if (nextSortBy === DEFAULT_SORT_BY) next.delete("sortBy");
    else next.set("sortBy", nextSortBy);
    if (nextSortOrder === DEFAULT_SORT_ORDER) next.delete("sortOrder");
    else next.set("sortOrder", nextSortOrder);
    setSearchParams(next);
  };

  const navigatePage = (newPage: number) => {
    const next = new URLSearchParams(searchParams);
    if (newPage <= 1) next.delete("page");
    else next.set("page", String(newPage));
    setSearchParams(next);
  };

  return (
    <PageWrap>
      <PageHeader title="Invoices" />
      <Resolve resolve={loaderData.data} fallback={<ListSkeleton cols={5} />}>
        {(invoicesPage) => {
          const invoices = invoicesPage.items ?? [];
          return (
            <>
              <FilterBar
                active={activeStatus}
                onChange={setStatusFilter}
                options={[
                  { id: "all", label: "All", n: invoicesPage.totalCount },
                  ...STATUS_FILTERS.slice(1),
                ]}
                right={
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Select
                        value={searchField}
                        onValueChange={(v) => setSearchField(v as SearchField)}
                      >
                        <SelectTrigger size="sm" className="w-[110px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SEARCH_FIELDS.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-dim">
                          <Icon name="search" size={14} />
                        </span>
                        <Input
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          placeholder="Search…"
                          className="h-8 w-[180px] pl-8 text-[12.5px]"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={sortBy}
                        onValueChange={(v) => setSort(v, sortOrder)}
                      >
                        <SelectTrigger size="sm" className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SORT_OPTIONS.map((o) => (
                            <SelectItem key={o.id} value={o.id}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setSort(sortBy, sortOrder === "asc" ? "desc" : "asc")
                        }
                        title={
                          sortOrder === "asc" ? "Ascending" : "Descending"
                        }
                      >
                        {sortOrder === "asc" ? "Asc" : "Desc"}
                      </Button>
                    </div>
                  </div>
                }
              />
              <DataTable<InvoiceResponse>
                rows={invoices}
                onRowClick={(r) => navigate(`/invoices/${r.id}`)}
                empty={
                  hasFilters
                    ? "No invoices match these filters."
                    : "No invoices yet."
                }
                columns={[
                  {
                    key: "num",
                    header: "Invoice",
                    cell: (r) => (
                      <Mono className="text-[12.5px] font-semibold text-foreground">
                        {inv.number(r)}
                      </Mono>
                    ),
                  },
                  {
                    key: "month",
                    header: "Month",
                    cell: (r) => (
                      <Mono className="text-[12.5px] text-muted-foreground">
                        {inv.month(r)}
                      </Mono>
                    ),
                  },
                  {
                    key: "total",
                    header: "Total",
                    align: "right",
                    cell: (r) => (
                      <Mono className="text-[12.5px] font-semibold">
                        {fmtMoney(inv.total(r))}
                      </Mono>
                    ),
                  },
                  {
                    key: "status",
                    header: "Status",
                    align: "right",
                    cell: (r) => <StatusBadge status={inv.status(r)} />,
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
                ]}
              />

              {invoicesPage.totalCount > invoicesPage.pageSize && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[12.5px] text-muted-foreground">
                    Showing{" "}
                    {(invoicesPage.pageNumber - 1) * invoicesPage.pageSize + 1}–
                    {Math.min(
                      invoicesPage.pageNumber * invoicesPage.pageSize,
                      invoicesPage.totalCount,
                    )}{" "}
                    of {invoicesPage.totalCount}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={invoicesPage.pageNumber <= 1}
                      onClick={() =>
                        navigatePage(invoicesPage.pageNumber - 1)
                      }
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={
                        invoicesPage.pageNumber * invoicesPage.pageSize >=
                        invoicesPage.totalCount
                      }
                      onClick={() =>
                        navigatePage(invoicesPage.pageNumber + 1)
                      }
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
