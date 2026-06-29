import { useState } from "react";
import { useNavigate, useRevalidator, useSearchParams } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/firearms";
import { api } from "~/lib/api";
import { customerLabel, customerNameMap } from "~/lib/entities";
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
import { FirearmStatus, enumKey } from "~/lib/enums";
import type {
  CustomerListItemDto,
  FirearmResponse,
  FirearmResponsePaginatedResponse,
} from "~/lib/api-types";

const PAGE_SIZE = 20;

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
  const requestedPage = Number(searchParams.get("page"));
  const pageNumber =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const requestedStatus = searchParams.get("status");
  const status =
    requestedStatus && FIREARM_STATUSES.has(requestedStatus)
      ? requestedStatus
      : undefined;

  const firearmsP = api
    .firearms({ pageNumber, pageSize: PAGE_SIZE, status })
    .catch(
      () =>
        ({
          items: [],
          pageNumber,
          pageSize: PAGE_SIZE,
          totalCount: 0,
        }) satisfies FirearmResponsePaginatedResponse,
    );
  const customersP = api
    .allCustomers()
    .catch(() => [] as CustomerListItemDto[]);
  return { data: Promise.all([firearmsP, customersP]) };
}

export default function Firearms({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const user = useSessionUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const [addOpen, setAddOpen] = useState(false);

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

  const navigatePage = (newPage: number) => {
    const next = new URLSearchParams(searchParams);
    if (newPage <= 1) next.delete("page");
    else next.set("page", String(newPage));
    setSearchParams(next);
  };

  return (
    <PageWrap>
      <PageHeader
        title="Firearms"
        actions={
          can(user, "registry:write") && (
            <Button onClick={() => setAddOpen(true)}>
              <Icon name="plus" size={16} />
              Add firearm
            </Button>
          )
        }
      />
      <Resolve resolve={loaderData.data} fallback={<ListSkeleton cols={5} />}>
        {([firearmsPage, customers]) => {
          const firearms = firearmsPage.items ?? [];
          const names = customerNameMap(customers);
          return (
            <>
              <FilterBar
                active={activeStatus}
                onChange={setStatusFilter}
                options={[
                  { id: "all", label: "All", n: firearmsPage.totalCount },
                  ...STATUS_FILTERS.slice(1),
                ]}
              />
              <DataTable<FirearmResponse>
                rows={firearms}
                onRowClick={(r) => navigate(`/firearms/${r.id}`)}
                empty="No firearms match this filter."
                columns={[
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
                    key: "customer",
                    header: "Customer",
                    cell: (r) => (
                      <span className="text-[12.5px] text-muted-foreground">
                        {names[r.customerId] ?? "—"}
                      </span>
                    ),
                  },
                  {
                    key: "status",
                    header: "Status",
                    cell: (r) => (
                      <StatusBadge status={enumKey(FirearmStatus, r.status)} />
                    ),
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
                ]}
              />

              {firearmsPage.totalCount > firearmsPage.pageSize && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[12.5px] text-muted-foreground">
                    Showing{" "}
                    {(firearmsPage.pageNumber - 1) * firearmsPage.pageSize + 1}–
                    {Math.min(
                      firearmsPage.pageNumber * firearmsPage.pageSize,
                      firearmsPage.totalCount,
                    )}{" "}
                    of {firearmsPage.totalCount}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={firearmsPage.pageNumber <= 1}
                      onClick={() => navigatePage(firearmsPage.pageNumber - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={
                        firearmsPage.pageNumber * firearmsPage.pageSize >=
                        firearmsPage.totalCount
                      }
                      onClick={() => navigatePage(firearmsPage.pageNumber + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}

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
                      const results = await api.customers({
                        [searchType]: query,
                      });
                      return (results.items ?? []).map((c) => ({
                        value: c.id,
                        label: customerLabel(c),
                        description: [c.email, c.phone]
                          .filter(Boolean)
                          .join(" · "),
                      }));
                    },
                    options: customers.map((c) => ({
                      value: c.id,
                      label: customerLabel(c),
                      description: [c.email, c.phone]
                        .filter(Boolean)
                        .join(" · "),
                      searchText: [customerLabel(c), c.email, c.phone]
                        .filter(Boolean)
                        .join(" "),
                    })),
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
                  await api.createFirearm({
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
            </>
          );
        }}
      </Resolve>
    </PageWrap>
  );
}
