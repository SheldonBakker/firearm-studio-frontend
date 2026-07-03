import { useState } from "react";
import { useNavigate, useRevalidator, useSearchParams } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/storage";
import { storageApi } from "~/lib/api/storage/storage";
import { fmtDate, fmtMoney } from "~/lib/utils/format";
import { useSessionUser } from "~/context/auth-context";
import { can } from "~/lib/utils/rbac";
import { PageWrap } from "~/components/common/misc";
import { PageHeader } from "~/components/common/page-header";
import { FilterBar } from "~/components/common/filter-bar";
import { DataTable } from "~/components/common/data-table";
import { StatusBadge } from "~/components/common/status-badge";
import { Mono } from "~/components/common/mono";
import { Button } from "~/components/ui/button";
import { FormDialog } from "~/components/modals/form-dialog";
import { Resolve, TableSkeleton } from "~/components/common/skeletons";
import { StorageStatus, enumKey } from "~/lib/types/enums";
import type {
  StorageRecordDtoPaginatedResponse,
  StorageRecordResponse,
} from "~/lib/api/storage/types";

const PAGE_SIZE = 20;

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: String(StorageStatus.Active), label: "Active" },
  { id: String(StorageStatus.Released), label: "Released" },
  { id: String(StorageStatus.Cancelled), label: "Cancelled" },
];

const STORAGE_STATUSES = new Set(STATUS_FILTERS.slice(1).map(({ id }) => id));

export function clientLoader({ request }: Route.ClientLoaderArgs) {
  const searchParams = new URL(request.url).searchParams;
  const requestedPage = Number(searchParams.get("page"));
  const pageNumber =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const requestedStatus = searchParams.get("storageStatus");
  const storageStatus =
    requestedStatus && STORAGE_STATUSES.has(requestedStatus)
      ? requestedStatus
      : undefined;
  const serialNumber = searchParams.get("serialNumber")?.trim() || undefined;
  const customerName = searchParams.get("customerName")?.trim() || undefined;

  const storageP = storageApi
    .listActive({ pageNumber, pageSize: PAGE_SIZE, storageStatus, serialNumber, customerName })
    .catch(
      () =>
        ({
          items: [],
          pageNumber,
          pageSize: PAGE_SIZE,
          totalCount: 0,
        }) satisfies StorageRecordDtoPaginatedResponse,
    );
  return { data: storageP };
}

export default function Storage({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useSessionUser();
  const [releasing, setReleasing] = useState<StorageRecordResponse | null>(
    null,
  );
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
    next.delete("page");
    if (status === "all") next.delete("storageStatus");
    else next.set("storageStatus", status);
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
      <PageHeader title="Storage Records" />
      <Resolve resolve={loaderData.data} fallback={<TableSkeleton cols={7} />}>
        {(storagePage) => {
          const storage = storagePage.items ?? [];
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
                      <Mono className="text-[13px] font-semibold text-foreground">
                        {r.serialNumber ?? "—"}
                      </Mono>
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
                        <StatusBadge
                          status={enumKey(StorageStatus, r.storageStatus)}
                        />
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

              {storagePage.totalCount > storagePage.pageSize && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[12.5px] text-muted-foreground">
                    Showing{" "}
                    {(storagePage.pageNumber - 1) * storagePage.pageSize + 1}–
                    {Math.min(
                      storagePage.pageNumber * storagePage.pageSize,
                      storagePage.totalCount,
                    )}{" "}
                    of {storagePage.totalCount}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={storagePage.pageNumber <= 1}
                      onClick={() => navigatePage(storagePage.pageNumber - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={
                        storagePage.pageNumber * storagePage.pageSize >=
                        storagePage.totalCount
                      }
                      onClick={() => navigatePage(storagePage.pageNumber + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}

              {releasing && (
                <FormDialog
                  open={!!releasing}
                  onOpenChange={(v) => !v && setReleasing(null)}
                  title="Release from storage"
                  description={`${releasing.serialNumber ?? "Firearm"} - confirm release date.`}
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
                    await storageApi.update(releasing.id, {
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
