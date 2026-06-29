import { useState } from "react";
import { useNavigate, useRevalidator, useSearchParams } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/storage";
import { api } from "~/lib/api";
import { firearmLabel } from "~/lib/entities";
import { fmtDate, fmtMoney } from "~/lib/format";
import { useSessionUser } from "./app-layout";
import { can } from "~/lib/rbac";
import { PageWrap } from "~/components/common/misc";
import { PageHeader } from "~/components/common/page-header";
import { FilterBar } from "~/components/common/filter-bar";
import { DataTable } from "~/components/common/data-table";
import { StatusBadge } from "~/components/common/status-badge";
import { Mono } from "~/components/common/mono";
import { Button } from "~/components/ui/button";
import { FormDialog } from "~/components/modals/form-dialog";
import { Resolve, TableSkeleton } from "~/components/common/skeletons";
import { StorageStatus, enumKey } from "~/lib/enums";
import type { FirearmResponse, StorageRecordResponse } from "~/lib/api-types";

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: String(StorageStatus.Active), label: "Active" },
  { id: String(StorageStatus.Released), label: "Released" },
  { id: String(StorageStatus.Cancelled), label: "Cancelled" },
];

const STORAGE_STATUSES = new Set(STATUS_FILTERS.slice(1).map(({ id }) => id));

export function clientLoader({ request }: Route.ClientLoaderArgs) {
  const searchParams = new URL(request.url).searchParams;
  const requestedStatus = searchParams.get("storageStatus");
  const storageStatus =
    requestedStatus && STORAGE_STATUSES.has(requestedStatus)
      ? requestedStatus
      : undefined;
  const serialNumber = searchParams.get("serialNumber")?.trim() || undefined;
  const customerName = searchParams.get("customerName")?.trim() || undefined;
  const storageParams = { storageStatus, serialNumber, customerName };
  const hasStorageParams = Object.values(storageParams).some(
    (value) => value !== undefined,
  );

  const storageP = (
    hasStorageParams ? api.storageActive(storageParams) : api.storageActive()
  ).catch(() => [] as StorageRecordResponse[]);
  const firearmsP = api.firearms().catch(() => [] as FirearmResponse[]);
  return { data: Promise.all([storageP, firearmsP]) };
}

export default function Storage({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useSessionUser();
  const [releasing, setReleasing] = useState<StorageRecordResponse | null>(null);
  const activeStatus = STORAGE_STATUSES.has(
    searchParams.get("storageStatus") ?? "",
  )
    ? searchParams.get("storageStatus")!
    : "all";
  const hasFilters =
    activeStatus !== "all" ||
    !!searchParams.get("serialNumber")?.trim() ||
    !!searchParams.get("customerName")?.trim();

  const setStatusFilter = (status: string) => {
    const next = new URLSearchParams(searchParams);
    if (status === "all") next.delete("storageStatus");
    else next.set("storageStatus", status);
    setSearchParams(next);
  };

  return (
    <PageWrap>
      <PageHeader title="Storage Records" />
      <Resolve resolve={loaderData.data} fallback={<TableSkeleton cols={7} />}>
        {([storage, firearms]) => {
          const fireMap = Object.fromEntries(firearms.map((f) => [f.id, f]));
          return (
            <>
              <FilterBar
                active={activeStatus}
                onChange={setStatusFilter}
                options={STATUS_FILTERS}
              />
              <DataTable<StorageRecordResponse>
                rows={storage}
                onRowClick={(r) => navigate(`/storage/${r.id}`)}
                empty={
                  hasFilters
                    ? "No storage records match these filters."
                    : "No storage records yet."
                }
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
                          {r.serialNumber ??
                            fireMap[r.firearmId ?? ""]?.serialNumber ??
                            "—"}
                        </Mono>
                      </div>
                    ),
                  },
                  {
                    key: "customer",
                    header: "Customer",
                    cell: (r) => (
                      <span className="text-[12.5px] text-muted-foreground">
                        {r.customerName ?? "—"}
                      </span>
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
                    key: "until",
                    header: "Stored until",
                    cell: (r) => (
                      <span className="text-[12.5px] text-muted-foreground">
                        {fmtDate(r.storedUntil)}
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
                    key: "status",
                    header: "Status",
                    cell: (r) =>
                      r.storageStatus != null ? (
                        <StatusBadge status={enumKey(StorageStatus, r.storageStatus)} />
                      ) : (
                        <span className="text-[12px] text-dim">—</span>
                      ),
                  },
                  {
                    key: "action",
                    header: "",
                    align: "right",
                    width: "120px",
                    cell: (r) =>
                      can(user, "registry:write") &&
                      r.storageStatus === StorageStatus.Active ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReleasing(r);
                          }}
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
                  description={`${firearmLabel(fireMap[releasing.firearmId ?? ""])} - confirm release date.`}
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
                    await api.updateStorage(releasing.id, {
                      storageStatus: StorageStatus.Released,
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
