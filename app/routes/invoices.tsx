import { useNavigate, useSearchParams } from "react-router";
import type { Route } from "./+types/invoices";
import { invoicesApi } from "~/lib/api/invoices/invoices";
import { inv } from "~/lib/utils/entities";
import { fmtMoney } from "~/lib/utils/format";
import { PageWrap } from "~/components/common/misc";
import { PageHeader } from "~/components/common/page-header";
import { DataTable } from "~/components/common/data-table";
import { StatusBadge } from "~/components/common/status-badge";
import { Mono } from "~/components/common/mono";
import { Icon } from "~/components/common/icon";
import { Button } from "~/components/ui/button";
import { Resolve, ListSkeleton } from "~/components/common/skeletons";
import type {
  InvoiceListItemDtoPaginatedResponse,
  InvoiceResponse,
} from "~/lib/api/invoices/types";

const PAGE_SIZE = 20;

export function clientLoader({ request }: Route.ClientLoaderArgs) {
  const requestedPage = Number(
    new URL(request.url).searchParams.get("page"),
  );
  const pageNumber =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const invoicesP = invoicesApi
    .list({ pageNumber, pageSize: PAGE_SIZE })
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
              <DataTable<InvoiceResponse>
                rows={invoices}
                onRowClick={(r) => navigate(`/invoices/${r.id}`)}
                empty="No invoices yet."
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
