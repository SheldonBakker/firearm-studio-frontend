import { useState } from "react";
import { useNavigate, useRevalidator } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/licences";
import { licencesApi } from "~/lib/api/licences/licences";
import { fmtDate } from "~/lib/utils/format";
import { useSessionUser } from "~/context/auth-context";
import { can } from "~/lib/utils/rbac";
import { PageWrap } from "~/components/common/misc";
import { FilterBar } from "~/components/common/filter-bar";
import { DataTable, type Column } from "~/components/common/data-table";
import { StatusBadge } from "~/components/common/status-badge";
import { Mono } from "~/components/common/mono";
import { Icon } from "~/components/common/icon";
import { Button } from "~/components/ui/button";
import { FormDialog } from "~/components/modals/form-dialog";
import { Resolve } from "~/components/common/skeletons";
import { LicenceStatus, enumKey } from "~/lib/types/enums";
import type { LicenceResponse } from "~/lib/api/licences/types";
import { Pagination } from "~/components/common/pagination";
import { usePagedSearchParams } from "~/hooks/use-paged-search-params";
import { PAGE_SIZE, parsePage } from "~/lib/utils/list-params";

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
  const pageNumber = parsePage(searchParams);
  const requestedStatus = searchParams.get("status");
  const status =
    requestedStatus && LICENCE_STATUSES.has(requestedStatus)
      ? requestedStatus
      : undefined;
  const licenceNumber =
    searchParams.get("licenceNumber")?.trim() || undefined;

  const licencesP = licencesApi.list({ pageNumber, pageSize: PAGE_SIZE, sortOrder: "asc", licenceNumber, status });
  return { data: licencesP };
}

export default function Licences({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const { searchParams, setSearchParams, navigatePage } = usePagedSearchParams();
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

  const columns: Column<LicenceResponse>[] = [
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
      cell: (r) => <StatusBadge status={enumKey(LicenceStatus, r.status)} />,
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
  ];

  return (
    <PageWrap>
      <FilterBar
        active={activeStatus}
        onChange={setStatusFilter}
        options={STATUS_FILTERS}
      />
      <Resolve
        resolve={loaderData.data}
        fallback={
          <DataTable<LicenceResponse> columns={columns} rows={[]} loading />
        }
      >
        {(licencesPage) => {
          const licences = licencesPage.items ?? [];
          return (
            <>
              <DataTable<LicenceResponse>
                columns={columns}
                rows={licences}
                onRowClick={(r) =>
                  navigate(
                    `/licences/${r.id}?firearm=${encodeURIComponent(r.firearmId ?? "")}`,
                  )
                }
                empty={
                  hasFilters
                    ? "No licences match these filters."
                    : "No licences recorded."
                }
              />

              <Pagination page={licencesPage} onPage={navigatePage} />

            </>
          );
        }}
      </Resolve>

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
            await licencesApi.update(editing.id, {
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
    </PageWrap>
  );
}
