import { useState } from "react";
import { useRevalidator, useSearchParams } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/licences";
import { api } from "~/lib/api";
import { firearmLabel } from "~/lib/entities";
import { fmtDate } from "~/lib/format";
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
import { LicenceStatus, enumKey } from "~/lib/enums";
import type {
  FirearmResponse,
  LicenceListItemDtoPaginatedResponse,
  LicenceResponse,
} from "~/lib/api-types";

const PAGE_SIZE = 20;

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: String(LicenceStatus.Valid), label: "Valid" },
  { id: String(LicenceStatus.RenewalDue), label: "Renewal due" },
  { id: String(LicenceStatus.Expired), label: "Expired" },
  { id: String(LicenceStatus.Unknown), label: "Unknown" },
];

const LICENCE_STATUSES = new Set(STATUS_FILTERS.slice(1).map(({ id }) => id));
const LICENCE_STATUS_NAMES = Object.keys(LicenceStatus);

function dateInputValue(value: string | null | undefined) {
  return value?.slice(0, 10) ?? "";
}

export function clientLoader({ request }: Route.ClientLoaderArgs) {
  const searchParams = new URL(request.url).searchParams;
  const requestedPage = Number(searchParams.get("page"));
  const pageNumber =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const requestedStatus = searchParams.get("status");
  const status =
    requestedStatus && LICENCE_STATUSES.has(requestedStatus)
      ? requestedStatus
      : undefined;
  const licenceNumber =
    searchParams.get("licenceNumber")?.trim() || undefined;

  const licencesP = api
    .licences({ pageNumber, pageSize: PAGE_SIZE, sortOrder: "asc", licenceNumber, status })
    .catch(
      () =>
        ({
          items: [],
          pageNumber,
          pageSize: PAGE_SIZE,
          totalCount: 0,
        }) satisfies LicenceListItemDtoPaginatedResponse,
    );
  const firearmsP = api.allFirearms().catch(() => [] as FirearmResponse[]);
  return { data: Promise.all([licencesP, firearmsP]) };
}

export default function Licences({ loaderData }: Route.ComponentProps) {
  const revalidator = useRevalidator();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useSessionUser();
  const writable = can(user, "registry:write");
  const [editing, setEditing] = useState<LicenceResponse | null>(null);
  const activeStatus = LICENCE_STATUSES.has(searchParams.get("status") ?? "")
    ? searchParams.get("status")!
    : "all";
  const licenceNumberSearch = searchParams.get("licenceNumber") ?? "";
  const hasFilters = activeStatus !== "all" || !!licenceNumberSearch.trim();

  const setStatusFilter = (status: string) => {
    const next = new URLSearchParams(searchParams);
    next.delete("page");
    if (status === "all") next.delete("status");
    else next.set("status", status);
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
      <PageHeader title="Licences" />
      <Resolve resolve={loaderData.data} fallback={<ListSkeleton cols={7} />}>
        {([licencesPage, firearms]) => {
          const licences = licencesPage.items ?? [];
          const fireMap = Object.fromEntries(firearms.map((f) => [f.id, f]));
          return (
            <>
              <FilterBar
                active={activeStatus}
                onChange={setStatusFilter}
                options={STATUS_FILTERS}
              />
              <DataTable<LicenceResponse>
                rows={licences}
                empty={
                  hasFilters
                    ? "No licences match these filters."
                    : "No licences recorded."
                }
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
                    key: "renewalDue",
                    header: "Renewal due",
                    cell: (r) => (
                      <span className="text-[12.5px] text-muted-foreground">
                        {fmtDate(r.renewalDueOn)}
                      </span>
                    ),
                  },
                  {
                    key: "status",
                    header: "Status",
                    align: "right",
                    cell: (r) => (
                      <StatusBadge status={enumKey(LicenceStatus, r.status)} />
                    ),
                  },
                  {
                    key: "action",
                    header: "",
                    align: "right",
                    width: "90px",
                    cell: (r) =>
                      writable ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            setEditing(r);
                          }}
                        >
                          <Icon name="edit" size={14} />
                          Edit
                        </Button>
                      ) : null,
                  },
                ]}
              />

              {licencesPage.totalCount > licencesPage.pageSize && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[12.5px] text-muted-foreground">
                    Showing{" "}
                    {(licencesPage.pageNumber - 1) * licencesPage.pageSize + 1}–
                    {Math.min(
                      licencesPage.pageNumber * licencesPage.pageSize,
                      licencesPage.totalCount,
                    )}{" "}
                    of {licencesPage.totalCount}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={licencesPage.pageNumber <= 1}
                      onClick={() =>
                        navigatePage(licencesPage.pageNumber - 1)
                      }
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={
                        licencesPage.pageNumber * licencesPage.pageSize >=
                        licencesPage.totalCount
                      }
                      onClick={() =>
                        navigatePage(licencesPage.pageNumber + 1)
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}

              {editing && (
                <FormDialog
                  open={!!editing}
                  onOpenChange={(open) => !open && setEditing(null)}
                  title="Edit licence"
                  submitLabel="Save changes"
                  fields={[
                    {
                      name: "licenceNumber",
                      label: "Licence number",
                      full: true,
                      defaultValue: editing.licenceNumber ?? "",
                    },
                    {
                      name: "issuedOn",
                      label: "Issued on",
                      type: "date",
                      defaultValue: dateInputValue(editing.issuedOn),
                    },
                    {
                      name: "expiresOn",
                      label: "Expires on",
                      type: "date",
                      required: true,
                      defaultValue: dateInputValue(editing.expiresOn),
                    },
                    {
                      name: "status",
                      label: "Status",
                      type: "select",
                      required: true,
                      defaultValue:
                        enumKey(LicenceStatus, editing.status) ?? "Unknown",
                      options: LICENCE_STATUS_NAMES.map((status) => ({
                        value: status,
                        label: status.replace(/([A-Z])/g, " $1").trim(),
                      })),
                    },
                  ]}
                  onSubmit={async (values) => {
                    await api.updateLicence(editing.id, {
                      licenceNumber: values.licenceNumber || null,
                      issuedOn: values.issuedOn || null,
                      expiresOn: values.expiresOn,
                      status:
                        LicenceStatus[
                          values.status as keyof typeof LicenceStatus
                        ],
                    });
                    toast.success("Licence updated");
                    setEditing(null);
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
