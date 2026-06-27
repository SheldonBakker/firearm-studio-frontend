import { redirect } from "react-router";
import type { Route } from "./+types/audit";
import { api } from "~/lib/api";
import { requireAuth } from "~/lib/auth";
import { canSeeNav } from "~/lib/rbac";
import { fmtDate } from "~/lib/format";
import { PageWrap } from "~/components/common/misc";
import { PageHeader } from "~/components/common/page-header";
import { DataTable } from "~/components/common/data-table";
import { Mono } from "~/components/common/mono";
import { Resolve, TableSkeleton } from "~/components/common/skeletons";
import type { AuditLogResponse } from "~/lib/api-types";

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const user = await requireAuth(request);
  if (!canSeeNav(user, "audit")) throw redirect("/dashboard");
  return {
    logs: api.auditLogs({ take: 100 }).catch(() => [] as AuditLogResponse[]),
  };
}

export default function Audit({ loaderData }: Route.ComponentProps) {
  return (
    <PageWrap>
      <PageHeader title="Audit Log" />
      <Resolve resolve={loaderData.logs} fallback={<TableSkeleton cols={5} />}>
        {(logs) => (
          <DataTable<AuditLogResponse>
            rows={logs}
            empty="No audit entries."
            columns={[
          {
            key: "when",
            header: "When",
            cell: (r) => (
              <Mono className="text-[12px] text-muted-foreground">
                {fmtDate(r.occurredAt)}
              </Mono>
            ),
          },
          {
            key: "user",
            header: "User",
            cell: (r) => (
              <span className="text-[12.5px] text-foreground">
                {r.userName ?? "—"}
              </span>
            ),
          },
          {
            key: "entity",
            header: "Entity",
            cell: (r) => (
              <span className="text-[12.5px] text-muted-foreground">
                {r.entityType ?? "—"}
              </span>
            ),
          },
          {
            key: "action",
            header: "Action",
            cell: (r) => (
              <span className="text-[12.5px] font-semibold text-foreground">
                {r.action ?? "—"}
              </span>
            ),
          },
          {
            key: "summary",
            header: "Detail",
            cell: (r) => (
              <span className="text-[12.5px] text-muted-foreground">
                {r.summary ?? "—"}
              </span>
            ),
          },
        ]}
          />
        )}
      </Resolve>
    </PageWrap>
  );
}
