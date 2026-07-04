import { useNavigate, useSearchParams } from "react-router";
import type { Route } from "./+types/invoices";
import { invoicesApi } from "~/lib/api/invoices/invoices";
import { inv } from "~/lib/utils/entities";
import { fmtMoney } from "~/lib/utils/format";
import { PageWrap } from "~/components/common/misc";
import { PageHeader } from "~/components/common/page-header";
import { FilterBar } from "~/components/common/filter-bar";
import { DataTable, type Column } from "~/components/common/data-table";
import { StatusBadge } from "~/components/common/status-badge";
import { Mono } from "~/components/common/mono";
import { Icon } from "~/components/common/icon";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Resolve } from "~/components/common/skeletons";
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

  const hasFilters =
    activeStatus !== "all" ||
    !!searchParams.get("invoiceNumber")?.trim() ||
    !!searchParams.get("customerName")?.trim();

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

  const columns: Column<InvoiceResponse>[] = [
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
  ];

  return (
    <PageWrap>
      <PageHeader title="Invoices" />
      <FilterBar
        active={activeStatus}
        onChange={setStatusFilter}
        options={STATUS_FILTERS}
        right={
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wide text-dim">
              Sort
            </span>
            <Select value={sortBy} onValueChange={(v) => setSort(v, sortOrder)}>
              <SelectTrigger size="sm" className="w-30">
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
              title={sortOrder === "asc" ? "Ascending" : "Descending"}
            >
              {sortOrder === "asc" ? "Asc" : "Desc"}
            </Button>
          </div>
        }
      />
      <Resolve
        resolve={loaderData.data}
        fallback={
          <DataTable<InvoiceResponse> columns={columns} rows={[]} loading />
        }
      >
        {(invoicesPage) => {
          const invoices = invoicesPage.items ?? [];
          return (
            <>
              <DataTable<InvoiceResponse>
                columns={columns}
                rows={invoices}
                onRowClick={(r) => navigate(`/invoices/${r.id}`)}
                empty={
                  hasFilters
                    ? "No invoices match these filters."
                    : "No invoices yet."
                }
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
