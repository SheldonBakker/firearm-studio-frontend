import { useNavigate } from "react-router";
import type { Route } from "./+types/dashboard";
import { api } from "~/lib/api/client";
import { fmtMoneyShort, fmtMoney, fmtDate } from "~/lib/utils/format";
import { customerNameMap, inv, firearmLabel } from "~/lib/utils/entities";
import { PageWrap, SectionTitle, StatDot } from "~/components/common/misc";
import { StatCard } from "~/components/common/stat-card";
import { DataTable } from "~/components/common/data-table";
import { StatusBadge } from "~/components/common/status-badge";
import { Mono } from "~/components/common/mono";
import { Icon } from "~/components/common/icon";
import { LicenceStatus } from "~/lib/types/enums";
import {
  Resolve,
  StatGridSkeleton,
  TableSkeleton,
  AttentionListSkeleton,
} from "~/components/common/skeletons";
import type {
  CustomerListItemDto,
  DashboardStatsResponse,
  InvoiceListItemDtoPaginatedResponse,
  InvoiceResponse,
  LicenceListItemDtoPaginatedResponse,
} from "~/lib/types/api";

const EMPTY_DASHBOARD_STATS: DashboardStatsResponse = {
  activeStorageCount: 0,
  totalMonthlyRate: 0,
  firearmsCount: 0,
  outstandingAmount: 0,
  overdueCount: 0,
  licenceAlerts: { renewalDue: 0, expired: 0 },
};
const EMPTY_INVOICE_PAGE: InvoiceListItemDtoPaginatedResponse = {
  items: [],
  pageNumber: 1,
  pageSize: 200,
  totalCount: 0,
};
const EMPTY_LICENCE_PAGE: LicenceListItemDtoPaginatedResponse = {
  items: [],
  pageNumber: 1,
  pageSize: 200,
  totalCount: 0,
};

export function clientLoader() {
  const invoicesP = api
    .invoices({ pageSize: 200 })
    .catch(() => EMPTY_INVOICE_PAGE);
  const dueP = api
    .licences({ sortOrder: "asc", status: LicenceStatus.RenewalDue, pageSize: 200 })
    .catch(() => EMPTY_LICENCE_PAGE);
  const expiredP = api
    .licences({ sortOrder: "asc", status: LicenceStatus.Expired, pageSize: 200 })
    .catch(() => EMPTY_LICENCE_PAGE);
  const customersP = api
    .allCustomers()
    .catch(() => [] as CustomerListItemDto[]);
  return {
    stats: api.dashboardStats().catch(() => EMPTY_DASHBOARD_STATS),
    recent: Promise.all([invoicesP, customersP]),
    attention: Promise.all([expiredP, invoicesP, dueP, customersP]),
  };
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();

  return (
    <PageWrap>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[22px] font-bold tracking-tight text-foreground">
            {greeting()}
          </div>
          <div className="mt-1 text-[13.5px] text-muted-foreground">
            {new Date().toLocaleDateString("en-ZA", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <Resolve resolve={loaderData.stats} fallback={<StatGridSkeleton />}>
          {(stats) => (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Firearms in storage"
                value={stats.activeStorageCount}
                sub={`${stats.firearmsCount} total on registry`}
                icon="box"
                color="var(--status-blue)"
                onClick={() => navigate("/storage")}
              />
              <StatCard
                label="Monthly recurring"
                value={fmtMoneyShort(stats.totalMonthlyRate)}
                sub={`across ${stats.activeStorageCount} active records`}
                icon="money"
                color="var(--status-green)"
                onClick={() => navigate("/invoices")}
              />
              <StatCard
                label="Outstanding"
                value={fmtMoneyShort(stats.outstandingAmount)}
                sub={`${stats.overdueCount} overdue · needs follow-up`}
                icon="alert"
                color="var(--status-red)"
                onClick={() => navigate("/invoices")}
              />
              <StatCard
                label="Licence alerts"
                value={stats.licenceAlerts.renewalDue + stats.licenceAlerts.expired}
                sub={`${stats.licenceAlerts.renewalDue} due · ${stats.licenceAlerts.expired} expired`}
                icon="shield"
                color="var(--status-amber)"
                onClick={() => navigate("/licences")}
              />
            </div>
          )}
        </Resolve>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.55fr_1fr]">
        <div>
          <SectionTitle
            right={
              <button
                onClick={() => navigate("/invoices")}
                className="flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground hover:text-foreground"
              >
                View all <Icon name="arrow" size={14} />
              </button>
            }
          >
            Recent invoices
          </SectionTitle>
          <Resolve
            resolve={loaderData.recent}
            fallback={<TableSkeleton cols={4} rows={5} />}
          >
            {([invoicesPage, customers]) => {
              const invoices = invoicesPage.items ?? [];
              const names = customerNameMap(customers);
              return (
                <DataTable<InvoiceResponse>
                  rows={invoices.slice(0, 5)}
                  onRowClick={(r) => navigate(`/invoices/${r.id}`)}
                  empty="No invoices yet."
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
            ]}
                />
              );
            }}
          </Resolve>
        </div>

        <div>
          <SectionTitle>Needs attention</SectionTitle>
          <Resolve
            resolve={loaderData.attention}
            fallback={<AttentionListSkeleton />}
          >
            {([expiredPage, invoicesPage, duePage, customers]) => {
              const expired = expiredPage.items ?? [];
              const invoices = invoicesPage.items ?? [];
              const due = duePage.items ?? [];
              const names = customerNameMap(customers);
              const attention = [
                ...expired.map((l) => ({
                  color: "var(--status-red)",
                  t: "Licence expired",
                  d: `${l.licenceNumber ?? "—"}`,
                  tag: "Expired",
                  go: () =>
                    navigate(`/licences?status=${LicenceStatus.Expired}`),
                })),
                ...invoices
                  .filter((i) => inv.status(i) === "Overdue")
                  .map((i) => ({
                    color: "var(--status-red)",
                    t: "Invoice overdue",
                    d: `${inv.number(i)} · ${names[inv.customerId(i)] ?? "—"}`,
                    tag: fmtMoney(inv.total(i)),
                    go: () => navigate(`/invoices/${i.id}`),
                  })),
                ...due.map((l) => ({
                  color: "var(--status-amber)",
                  t: "Renewal due soon",
                  d: `${l.licenceNumber ?? "—"} · expires ${fmtDate(l.expiresOn)}`,
                  tag: "Renew",
                  go: () =>
                    navigate(`/licences?status=${LicenceStatus.RenewalDue}`),
                })),
              ].slice(0, 6);
              return (
                <div className="flex flex-col gap-2.5">
                  {attention.length === 0 && (
                    <div className="rounded-xl border border-border bg-card px-3.5 py-8 text-center text-[13px] text-dim">
                      All clear - nothing needs attention.
                    </div>
                  )}
                  {attention.map((a, i) => (
                    <button
                      key={i}
                      onClick={a.go}
                      className="flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3 text-left transition-colors hover:border-border2"
                    >
                      <StatDot color={a.color} />
                      <span className="min-w-0 flex-1">
                        <div className="text-[13px] font-semibold text-foreground">
                          {a.t}
                        </div>
                        <div className="mt-0.5 truncate font-mono text-[11.5px] text-muted-foreground">
                          {a.d}
                        </div>
                      </span>
                      <span
                        className="shrink-0 font-mono text-[11px] font-bold"
                        style={{ color: a.color }}
                      >
                        {a.tag}
                      </span>
                    </button>
                  ))}
                </div>
              );
            }}
          </Resolve>
        </div>
      </div>
    </PageWrap>
  );
}
