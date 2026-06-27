import { useState } from "react";
import { useRevalidator } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/storage";
import { api } from "~/lib/api";
import { firearmLabel } from "~/lib/entities";
import { fmtDate, fmtMoney } from "~/lib/format";
import { useSessionUser } from "./app-layout";
import { can } from "~/lib/rbac";
import { PageWrap } from "~/components/common/misc";
import { PageHeader } from "~/components/common/page-header";
import { DataTable } from "~/components/common/data-table";
import { Mono } from "~/components/common/mono";
import { Button } from "~/components/ui/button";
import { FormDialog } from "~/components/modals/form-dialog";
import { Resolve, TableSkeleton } from "~/components/common/skeletons";
import type { FirearmResponse, StorageRecordResponse } from "~/lib/api-types";

export function clientLoader() {
  const storageP = api.storageActive().catch(() => [] as StorageRecordResponse[]);
  const firearmsP = api.firearms().catch(() => [] as FirearmResponse[]);
  return { data: Promise.all([storageP, firearmsP]) };
}

export default function Storage({ loaderData }: Route.ComponentProps) {
  const revalidator = useRevalidator();
  const user = useSessionUser();
  const [releasing, setReleasing] = useState<StorageRecordResponse | null>(null);

  return (
    <PageWrap>
      <PageHeader title="Storage Records" />
      <Resolve resolve={loaderData.data} fallback={<TableSkeleton cols={5} />}>
        {([storage, firearms]) => {
          const fireMap = Object.fromEntries(firearms.map((f) => [f.id, f]));
          return (
            <>
              <DataTable<StorageRecordResponse>
                rows={storage}
                empty="No active storage records."
                columns={[
          {
            key: "firearm",
            header: "Firearm",
            cell: (r) => (
              <div>
                <div className="text-[13px] font-semibold text-foreground">
                  {firearmLabel(fireMap[r.firearmId ?? ""])}
                </div>
                <Mono className="text-[11.5px] text-dim">
                  {fireMap[r.firearmId ?? ""]?.serialNumber ?? "—"}
                </Mono>
              </div>
            ),
          },
          {
            key: "location",
            header: "Location",
            cell: (r) => (
              <Mono className="text-[12.5px] text-muted-foreground">
                {[r.storageLocation, r.rackNumber, r.safeNumber]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </Mono>
            ),
          },
          {
            key: "from",
            header: "Stored from",
            cell: (r) => (
              <span className="text-[12.5px] text-muted-foreground">
                {fmtDate(r.storedFrom)}
              </span>
            ),
          },
          {
            key: "rate",
            header: "Monthly",
            align: "right",
            cell: (r) => (
              <Mono className="text-[12.5px] font-semibold">
                {fmtMoney(r.monthlyRate)}
              </Mono>
            ),
          },
          {
            key: "action",
            header: "",
            align: "right",
            width: "120px",
            cell: (r) =>
              can(user, "registry:write") ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReleasing(r)}
                >
                  Release
                </Button>
              ) : null,
          },
        ]}
              />

              {releasing && (
        <FormDialog
          open={!!releasing}
          onOpenChange={(v) => !v && setReleasing(null)}
          title="Release from storage"
          description={`${firearmLabel(fireMap[releasing.firearmId ?? ""])} — confirm release date.`}
          submitLabel="Release"
          fields={[
            {
              name: "storedUntil",
              label: "Released on",
              type: "date",
              full: true,
            },
          ]}
          onSubmit={async (v) => {
            await api.releaseStorage(releasing.id, {
              storedUntil: v.storedUntil || null,
            });
            toast.success("Storage released");
            setReleasing(null);
            revalidator.revalidate();
          }}
        />
              )}
            </>
          );
        }}
      </Resolve>
    </PageWrap>
  );
}
