import { useState } from "react";
import { useNavigate, useRevalidator } from "react-router";
import { toast } from "sonner";
import { DownloadIcon } from "lucide-react";
import type { Route } from "./+types/firearms";
import { firearmsApi } from "~/lib/api/firearms/firearms";
import { customersApi } from "~/lib/api/customers/customers";
import { customerLabel } from "~/lib/utils/entities";
import { formatPhoneForDisplay } from "~/lib/utils/phone";
import { useSessionUser } from "~/context/auth-context";
import { can } from "~/lib/utils/rbac";
import { PageWrap } from "~/components/common/misc";
import { PageActions } from "~/context/page-actions";
import { FilterBar } from "~/components/common/filter-bar";
import { DataTable, type Column } from "~/components/common/data-table";
import { StatusBadge } from "~/components/common/status-badge";
import { Mono } from "~/components/common/mono";
import { Icon } from "~/components/common/icon";
import { Button } from "~/components/ui/button";
import { FormDialog } from "~/components/modals/form-dialog";
import { Resolve } from "~/components/common/skeletons";
import { FirearmStatus, enumKey } from "~/lib/types/enums";
import type { FirearmResponse } from "~/lib/api/firearms/types";
import { Pagination } from "~/components/common/pagination";
import { usePagedSearchParams } from "~/hooks/use-paged-search-params";
import { PAGE_SIZE, parsePage } from "~/lib/utils/list-params";

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: String(FirearmStatus.InStorage), label: "In Storage" },
  { id: String(FirearmStatus.Released), label: "Released" },
  { id: String(FirearmStatus.PendingTransfer), label: "Pending Transfer" },
  { id: String(FirearmStatus.Inactive), label: "Inactive" },
];

const FIREARM_STATUSES = new Set(STATUS_FILTERS.slice(1).map(({ id }) => id));

export function clientLoader({ request }: Route.ClientLoaderArgs) {
  const searchParams = new URL(request.url).searchParams;
  const pageNumber = parsePage(searchParams);
  const requestedStatus = searchParams.get("status");
  const status =
    requestedStatus && FIREARM_STATUSES.has(requestedStatus)
      ? requestedStatus
      : undefined;

  const firearmsP = firearmsApi.list({ pageNumber, pageSize: PAGE_SIZE, status });
  return { data: firearmsP };
}

export default function Firearms({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const user = useSessionUser();
  const { searchParams, setSearchParams, navigatePage } = usePagedSearchParams();
  const [addOpen, setAddOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const canWrite = can(user, "registry:write");
  const canExport = can(user, "registry:export-register");

  const activeStatus = FIREARM_STATUSES.has(searchParams.get("status") ?? "")
    ? searchParams.get("status")!
    : "all";

  const setStatusFilter = (status: string) => {
    const next = new URLSearchParams(searchParams);
    next.delete("page");
    if (status === "all") next.delete("status");
    else next.set("status", status);
    setSearchParams(next);
  };

  const columns: Column<FirearmResponse>[] = [
    {
      key: "firearm",
      header: "Firearm",
      cell: (r) => (
        <div>
          <div className="text-[13px] font-semibold text-foreground">
            {`${r.make ?? ""} ${r.model ?? ""}`.trim() || "—"}
          </div>
          <div className="text-[11.5px] text-dim">
            {[r.firearmType, r.calibre].filter(Boolean).join(" · ") || "—"}
          </div>
        </div>
      ),
    },
    {
      key: "serial",
      header: "Serial",
      cell: (r) => (
        <Mono className="text-[12.5px] text-muted-foreground">
          {r.serialNumber ?? "—"}
        </Mono>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => <StatusBadge status={enumKey(FirearmStatus, r.status)} />,
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
  ];

  return (
    <PageWrap>
      {(canWrite || canExport) && (
        <PageActions>
          {canExport && (
            <Button variant="outline" onClick={() => setExportOpen(true)}>
              <DownloadIcon />
              Export register
            </Button>
          )}
          {canWrite && (
            <Button onClick={() => setAddOpen(true)}>
              <Icon name="plus" size={16} />
              Add firearm
            </Button>
          )}
        </PageActions>
      )}
      <FilterBar
        active={activeStatus}
        onChange={setStatusFilter}
        options={STATUS_FILTERS}
      />
      <Resolve
        resolve={loaderData.data}
        fallback={
          <DataTable<FirearmResponse> columns={columns} rows={[]} loading />
        }
      >
        {(firearmsPage) => {
          const firearms = firearmsPage.items ?? [];
          return (
            <>
              <DataTable<FirearmResponse>
                columns={columns}
                rows={firearms}
                onRowClick={(r) => navigate(`/firearms/${r.id}`)}
                empty="No firearms match this filter."
              />

              <Pagination page={firearmsPage} onPage={navigatePage} />
            </>
          );
        }}
      </Resolve>

      <FormDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        title="Export firearms register"
        submitLabel="Export"
        fields={[
          { name: "from", label: "From", type: "date", required: true },
          { name: "to", label: "To", type: "date", required: true },
          {
            name: "format",
            label: "Format",
            type: "select",
            required: true,
            options: [
              { value: "0", label: "PDF" },
              { value: "1", label: "CSV" },
            ],
          },
        ]}
        onSubmit={async (v) => {
          await firearmsApi.exportRegister({
            from: v.from,
            to: v.to,
            format: Number(v.format),
          });
        }}
      />

      <FormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add firearm"
        description="Register a firearm to a customer."
        submitLabel="Add firearm"
        fields={[
          {
            name: "customerId",
            label: "Customer",
            type: "search-select",
            required: true,
            full: true,
            placeholder: "Search by name, email, or phone…",
            searchDebounceMs: 600,
            searchMinChars: 3,
            defaultSearchType: "name",
            searchTypes: [
              { value: "name", label: "Name" },
              { value: "email", label: "Email" },
              { value: "phone", label: "Phone" },
            ],
            onSearch: async (query, searchType) => {
              const results = await customersApi.list({
                [searchType]: query,
              });
              return (results.items ?? []).map((c) => ({
                value: c.id,
                label: customerLabel(c),
                description: [
                  c.email,
                  c.phone ? formatPhoneForDisplay(c.phone, "ZA") : null,
                ]
                  .filter(Boolean)
                  .join(" · "),
              }));
            },
          },
          { name: "make", label: "Make", required: true },
          { name: "model", label: "Model", required: true },
          { name: "calibre", label: "Calibre" },
          {
            name: "firearmType",
            label: "Type",
            type: "select",
            options: [
              { value: "Pistol", label: "Pistol" },
              { value: "Revolver", label: "Revolver" },
              { value: "Rifle", label: "Rifle" },
              { value: "Shotgun", label: "Shotgun" },
              { value: "Carbine", label: "Carbine" },
              { value: "Combination Gun", label: "Combination Gun" },
              { value: "Muzzleloader", label: "Muzzleloader" },
              { value: "Submachine Gun", label: "Submachine Gun" },
              { value: "Machine Gun", label: "Machine Gun" },
            ],
          },
          { name: "serialNumber", label: "Serial number", full: true },
          {
            name: "internalReference",
            label: "Internal reference",
          },
          {
            name: "notes",
            label: "Notes",
            type: "textarea",
            full: true,
          },
        ]}
        onSubmit={async (v) => {
          await firearmsApi.create({
            customerId: v.customerId,
            make: v.make || null,
            model: v.model || null,
            calibre: v.calibre || null,
            firearmType: v.firearmType || null,
            serialNumber: v.serialNumber || null,
            internalReference: v.internalReference || null,
            notes: v.notes || null,
          });
          toast.success("Firearm added");
          revalidator.revalidate();
        }}
      />
    </PageWrap>
  );
}
