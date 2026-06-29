import { useState } from "react";
import { useNavigate, useRevalidator, useSearchParams } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/invoices";
import { api } from "~/lib/api";
import { customerNameMap, inv } from "~/lib/entities";
import { fmtMoney } from "~/lib/format";
import { useSessionUser } from "./app-layout";
import { can } from "~/lib/rbac";
import { PageWrap } from "~/components/common/misc";
import { PageHeader } from "~/components/common/page-header";
import { FilterBar } from "~/components/common/filter-bar";
import { DataTable } from "~/components/common/data-table";
import { StatusBadge } from "~/components/common/status-badge";
import { Mono } from "~/components/common/mono";
import { Icon } from "~/components/common/icon";
import { Button } from "~/components/ui/button";
import { FormDialog } from "~/components/modals/form-dialog";
import { Resolve, ListSkeleton } from "~/components/common/skeletons";
import type {
  CustomerListItemDto,
  InvoiceListItemDtoPaginatedResponse,
  InvoiceResponse,
} from "~/lib/api-types";

const PAGE_SIZE = 20;
const STATUSES = ["Paid", "Sent", "Overdue", "Draft", "Cancelled"];

export function clientLoader({ request }: Route.ClientLoaderArgs) {
  const requestedPage = Number(
    new URL(request.url).searchParams.get("page"),
  );
  const pageNumber =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const invoicesP = api
    .invoices({ pageNumber, pageSize: PAGE_SIZE })
    .catch(
      () =>
        ({
          items: [],
          pageNumber,
          pageSize: PAGE_SIZE,
          totalCount: 0,
        }) satisfies InvoiceListItemDtoPaginatedResponse,
    );
  const customersP = api
    .allCustomers()
    .catch(() => [] as CustomerListItemDto[]);
  return { data: Promise.all([invoicesP, customersP]) };
}

export default function Invoices({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const user = useSessionUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState("all");
  const [genOpen, setGenOpen] = useState(false);

  const navigatePage = (newPage: number) => {
    const next = new URLSearchParams(searchParams);
    if (newPage <= 1) next.delete("page");
    else next.set("page", String(newPage));
    setSearchParams(next);
  };

  return (
    <PageWrap>
      <PageHeader
        title="Invoices"
        actions={
          can(user, "invoices:write") && (
            <Button onClick={() => setGenOpen(true)}>
              <Icon name="file" size={16} />
              Generate monthly invoices
            </Button>
          )
        }
      />
      <Resolve resolve={loaderData.data} fallback={<ListSkeleton cols={5} />}>
        {([invoicesPage, customers]) => {
          const invoices = invoicesPage.items ?? [];
          const names = customerNameMap(customers);
          const rows =
            filter === "all"
              ? invoices
              : invoices.filter((i) => inv.status(i) === filter);
          return (
            <>
              <FilterBar
                active={filter}
                onChange={setFilter}
                options={[
                  { id: "all", label: "All", n: invoicesPage.totalCount },
                  ...STATUSES.map((s) => ({
                    id: s,
                    label: s,
                    n: invoices.filter((i) => inv.status(i) === s).length,
                  })),
                ]}
              />
              <DataTable<InvoiceResponse>
                rows={rows}
                onRowClick={(r) => navigate(`/invoices/${r.id}`)}
                empty="No invoices match this filter."
                columns={[
                  {
                    key: "num",
                    header: "Invoice",
                    cell: (r) => (
                      <div>
                        <Mono className="text-[12.5px] font-semibold text-foreground">
                          {inv.number(r)}
                        </Mono>
                        <div className="mt-0.5 text-[11.5px] text-dim">
                          {names[inv.customerId(r)] ?? "—"}
                        </div>
                      </div>
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

      <FormDialog
        open={genOpen}
        onOpenChange={setGenOpen}
        title="Generate monthly invoices"
        description="Create invoices for all active storage records for the chosen month."
        submitLabel="Generate"
        fields={[
          {
            name: "invoiceMonth",
            label: "Invoice month",
            type: "date",
            required: true,
            full: true,
          },
          {
            name: "vatRate",
            label: "VAT rate (%)",
            type: "number",
            defaultValue: "15",
          },
          {
            name: "dueDays",
            label: "Due in (days)",
            type: "number",
            defaultValue: "14",
          },
        ]}
        onSubmit={async (v) => {
          await api.generateMonthlyInvoices({
            invoiceMonth: v.invoiceMonth,
            vatRate: Number(v.vatRate || 0) / 100,
            dueDays: Number(v.dueDays || 0),
          });
          toast.success("Monthly invoices generated");
          revalidator.revalidate();
        }}
      />
    </PageWrap>
  );
}
