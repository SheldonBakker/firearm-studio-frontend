import { useState } from "react";
import type { Route } from "./+types/licences";
import { api } from "~/lib/api";
import { firearmLabel } from "~/lib/entities";
import { fmtDate } from "~/lib/format";
import { PageWrap } from "~/components/common/misc";
import { PageHeader } from "~/components/common/page-header";
import { FilterBar } from "~/components/common/filter-bar";
import { DataTable } from "~/components/common/data-table";
import { StatusBadge } from "~/components/common/status-badge";
import { Mono } from "~/components/common/mono";
import { Resolve, ListSkeleton } from "~/components/common/skeletons";
import { LicenceStatus, enumKey } from "~/lib/enums";
import type { FirearmResponse, LicenceResponse } from "~/lib/api-types";

export function clientLoader() {
  const dueP = api.licencesDueRenewal().catch(() => [] as LicenceResponse[]);
  const expiredP = api.licencesExpired().catch(() => [] as LicenceResponse[]);
  const firearmsP = api.firearms().catch(() => [] as FirearmResponse[]);
  const data = Promise.all([dueP, expiredP, firearmsP]).then(
    ([due, expired, firearms]) => {
      // Tag and de-dupe by id.
      const seen = new Set<string>();
      const licences: LicenceResponse[] = [];
      for (const l of [
        ...due.map((l) => ({
          ...l,
          status: enumKey(LicenceStatus, l.status) ?? "RenewalDue",
        })),
        ...expired.map((l) => ({
          ...l,
          status: enumKey(LicenceStatus, l.status) ?? "Expired",
        })),
      ]) {
        if (seen.has(l.id)) continue;
        seen.add(l.id);
        licences.push(l);
      }
      return { licences, firearms };
    },
  );
  return { data };
}

export default function Licences({ loaderData }: Route.ComponentProps) {
  const [filter, setFilter] = useState("all");

  return (
    <PageWrap>
      <PageHeader title="Licences" />
      <Resolve resolve={loaderData.data} fallback={<ListSkeleton cols={5} />}>
        {({ licences, firearms }) => {
          const fireMap = Object.fromEntries(firearms.map((f) => [f.id, f]));
          const rows =
            filter === "all"
              ? licences
              : licences.filter((l) => l.status === filter);
          return (
            <>
              <FilterBar
                active={filter}
                onChange={setFilter}
                options={[
                  { id: "all", label: "All", n: licences.length },
                  {
                    id: "RenewalDue",
                    label: "Renewal due",
                    n: licences.filter((l) => l.status === "RenewalDue").length,
                  },
                  {
                    id: "Expired",
                    label: "Expired",
                    n: licences.filter((l) => l.status === "Expired").length,
                  },
                ]}
              />
              <DataTable<LicenceResponse>
                rows={rows}
                empty="No licences need attention."
                columns={[
          {
            key: "num",
            header: "Licence",
            cell: (r) => (
              <Mono className="text-[12.5px] font-semibold text-foreground">
                {r.licenceNumber ?? "—"}
              </Mono>
            ),
          },
          {
            key: "firearm",
            header: "Firearm",
            cell: (r) => (
              <span className="text-[12.5px] text-muted-foreground">
                {firearmLabel(fireMap[r.firearmId ?? ""])}
              </span>
            ),
          },
          {
            key: "issued",
            header: "Issued",
            cell: (r) => (
              <span className="text-[12.5px] text-muted-foreground">
                {fmtDate(r.issuedOn)}
              </span>
            ),
          },
          {
            key: "expires",
            header: "Expires",
            cell: (r) => (
              <span className="text-[12.5px] text-muted-foreground">
                {fmtDate(r.expiresOn)}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            align: "right",
            cell: (r) => <StatusBadge status={r.status as string | undefined} />,
          },
        ]}
              />
            </>
          );
        }}
      </Resolve>
    </PageWrap>
  );
}
