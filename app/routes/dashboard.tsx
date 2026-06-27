import { useNavigate } from "react-router";
import type { Route } from "./+types/dashboard";
import { api } from "~/lib/api";
import { fmtMoneyShort, fmtMoney, fmtDate } from "~/lib/format";
import { customerNameMap, inv, firearmLabel } from "~/lib/entities";
import { PageWrap, SectionTitle, StatDot } from "~/components/common/misc";
import { StatCard } from "~/components/common/stat-card";
import { DataTable } from "~/components/common/data-table";
import { StatusBadge } from "~/components/common/status-badge";
import { Mono } from "~/components/common/mono";
import { Icon } from "~/components/common/icon";
import {
  Resolve,
  StatGridSkeleton,
  TableSkeleton,
  AttentionListSkeleton,
} from "~/components/common/skeletons";
import type {
  CustomerResponse,
  FirearmResponse,
  InvoiceResponse,
  LicenceResponse,
  StorageRecordResponse,
} from "~/lib/api-types";

export function clientLoader() {
  const firearmsP = api.firearms().catch(() => [] as FirearmResponse[]);
  const storageP = api.storageActive().catch(() => [] as StorageRecordResponse[]);
  const invoicesP = api.invoices().catch(() => [] as InvoiceResponse[]);
  const dueP = api.licencesDueRenewal().catch(() => [] as LicenceResponse[]);
  const expiredP = api.licencesExpired().catch(() => [] as LicenceResponse[]);
  const customersP = api.customers().catch(() => [] as CustomerResponse[]);
  return {
    stats: Promise.all([firearmsP, storageP, invoicesP, dueP, expiredP]),
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
          {([firearms, storage, invoices, due, expired]) => {
            const mrr = storage.reduce((a, s) => a + (s.monthlyRate ?? 0), 0);
            const outstanding = invoices
              .filter((i) => ["Sent", "Overdue"].includes(inv.status(i)))
              .reduce((a, i) => a + inv.total(i), 0);
            const overdueN = invoices.filter(
              (i) => inv.status(i) === "Overdue",
            ).length;
            return (
              <div className="grid grid-cols-4 gap-3.5">
                <StatCard
                  label="Firearms in storage"
                  value={storage.length}
                  sub={`${firearms.length} total on registry`}
                  icon="box"
                  color="var(--status-blue)"
                  onClick={() => navigate("/storage")}
                />
                <StatCard
                  label="Monthly recurring"
                  value={fmtMoneyShort(mrr)}
                  sub={`across ${storage.length} active records`}
                  icon="money"
                  color="var(--status-green)"
                  onClick={() => navigate("/invoices")}
                />
                <StatCard
                  label="Outstanding"
                  value={fmtMoneyShort(outstanding)}
                  sub={`${overdueN} overdue · needs follow-up`}
                  icon="alert"
                  color="var(--status-red)"
                  onClick={() => navigate("/invoices")}
                />
                <StatCard
                  label="Licence alerts"
                  value={due.length + expired.length}
                  sub={`${due.length} due · ${expired.length} expired`}
                  icon="shield"
                  color="var(--status-amber)"
                  onClick={() => navigate("/licences")}
                />
              </div>
            );
          }}
        </Resolve>
      </div>

      <div className="grid grid-cols-[1.55fr_1fr] gap-5">
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
            {([invoices, customers]) => {
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
            {([expired, invoices, due, customers]) => {
              const names = customerNameMap(customers);
              const attention = [
                ...expired.map((l) => ({
                  color: "var(--status-red)",
                  t: "Licence expired",
                  d: `${l.licenceNumber ?? "—"}`,
                  tag: "Expired",
                  go: () => navigate("/licences"),
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
                  go: () => navigate("/licences"),
                })),
              ].slice(0, 6);
              return (
                <div className="flex flex-col gap-2.5">
                  {attention.length === 0 && (
                    <div className="rounded-xl border border-border bg-card px-3.5 py-8 text-center text-[13px] text-dim">
                      All clear — nothing needs attention.
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
