import { useState } from "react";
import { useRevalidator, useSearchParams } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/packages";
import { ApiError } from "~/lib/api/http";
import { packagesApi } from "~/lib/api/packages/packages";
import { fmtMoney } from "~/lib/utils/format";
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
import { PackageFormDialog } from "~/components/modals/package-form-dialog";
import { Resolve } from "~/components/common/skeletons";
import type {
  PackageListItemDto,
  PackageListItemDtoPaginatedResponse,
  PackageResponse,
} from "~/lib/api/packages/types";

const PAGE_SIZE = 20;

const ACTIVE_FILTERS = [
  { id: "all", label: "All" },
  { id: "true", label: "Active" },
  { id: "false", label: "Inactive" },
];

const ACTIVE_VALUES = new Set(ACTIVE_FILTERS.slice(1).map(({ id }) => id));

export function clientLoader({ request }: Route.ClientLoaderArgs) {
  const searchParams = new URL(request.url).searchParams;
  const requestedPage = Number(searchParams.get("page"));
  const pageNumber =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const requestedActive = searchParams.get("active");
  const isActive =
    requestedActive && ACTIVE_VALUES.has(requestedActive)
      ? requestedActive === "true"
      : undefined;

  const packagesP = packagesApi
    .list({
      pageNumber,
      pageSize: PAGE_SIZE,
      sortBy: "name",
      sortOrder: "asc",
      isActive,
    })
    .catch(
      () =>
        ({
          items: [],
          pageNumber,
          pageSize: PAGE_SIZE,
          totalCount: 0,
        }) satisfies PackageListItemDtoPaginatedResponse,
    );
  return { data: packagesP };
}

export default function Packages({ loaderData }: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const revalidator = useRevalidator();
  const user = useSessionUser();
  const writable = can(user, "bookings:write");
  const [addOpen, setAddOpen] = useState(false);
  const [editPackage, setEditPackage] = useState<PackageResponse | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const activeFilter = ACTIVE_VALUES.has(searchParams.get("active") ?? "")
    ? searchParams.get("active")!
    : "all";

  const setActiveFilter = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.delete("page");
    if (value === "all") next.delete("active");
    else next.set("active", value);
    setSearchParams(next);
  };

  const navigatePage = (newPage: number) => {
    const next = new URLSearchParams(searchParams);
    if (newPage <= 1) next.delete("page");
    else next.set("page", String(newPage));
    setSearchParams(next);
  };

  async function openEdit(row: PackageListItemDto) {
    try {
      const pkg = await packagesApi.get(row.id);
      setEditPackage(pkg);
      setEditOpen(true);
    } catch (e) {
      toast.error(
        e instanceof ApiError ? e.message : "Could not load the package",
      );
    }
  }

  const columns: Column<PackageListItemDto>[] = [
    {
      key: "name",
      header: "Name",
      cell: (r) => (
        <span className="text-[12.5px] font-semibold text-foreground">
          {r.name ?? "—"}
        </span>
      ),
    },
    {
      key: "price",
      header: "Price",
      align: "right",
      cell: (r) => (
        <Mono className="text-[12.5px] font-semibold">{fmtMoney(r.price)}</Mono>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      align: "right",
      cell: (r) => (
        <Mono className="text-[12.5px] text-muted-foreground">
          {r.durationMinutes} min
        </Mono>
      ),
    },
    {
      key: "shooters",
      header: "Max shooters",
      align: "right",
      cell: (r) => (
        <Mono className="text-[12.5px] text-muted-foreground">
          {r.maxShooters}
        </Mono>
      ),
    },
    {
      key: "items",
      header: "Items",
      align: "right",
      cell: (r) => (
        <Mono className="text-[12.5px] text-muted-foreground">
          {r.itemCount}
        </Mono>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "right",
      cell: (r) => <StatusBadge status={r.isActive ? "Active" : "Inactive"} />,
    },
  ];

  return (
    <PageWrap>
      {writable && (
        <PageActions>
          <Button onClick={() => setAddOpen(true)}>
            <Icon name="plus" size={16} />
            Add package
          </Button>
        </PageActions>
      )}
      <FilterBar
        active={activeFilter}
        onChange={setActiveFilter}
        options={ACTIVE_FILTERS}
      />
      <Resolve
        resolve={loaderData.data}
        fallback={
          <DataTable<PackageListItemDto> columns={columns} rows={[]} loading />
        }
      >
        {(packagesPage) => {
          const packages = packagesPage.items ?? [];
          return (
            <>
              <DataTable<PackageListItemDto>
                columns={columns}
                rows={packages}
                onRowClick={writable ? openEdit : undefined}
                empty={
                  activeFilter !== "all"
                    ? "No packages match this filter."
                    : "No packages yet."
                }
              />

              {packagesPage.totalCount > packagesPage.pageSize && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[12.5px] text-muted-foreground">
                    Showing{" "}
                    {(packagesPage.pageNumber - 1) * packagesPage.pageSize + 1}
                    –
                    {Math.min(
                      packagesPage.pageNumber * packagesPage.pageSize,
                      packagesPage.totalCount,
                    )}{" "}
                    of {packagesPage.totalCount}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={packagesPage.pageNumber <= 1}
                      onClick={() => navigatePage(packagesPage.pageNumber - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={
                        packagesPage.pageNumber * packagesPage.pageSize >=
                        packagesPage.totalCount
                      }
                      onClick={() => navigatePage(packagesPage.pageNumber + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          );
        }}
      </Resolve>

      <PackageFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSaved={() => {
          toast.success("Package added");
          revalidator.revalidate();
        }}
      />
      <PackageFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        pkg={editPackage}
        onSaved={() => {
          toast.success("Package updated");
          revalidator.revalidate();
        }}
      />
    </PageWrap>
  );
}
