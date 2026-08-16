import { useState } from "react";
import { useRevalidator } from "react-router";
import { toast } from "sonner";
import { Trash2Icon } from "lucide-react";
import type { Route } from "./+types/packages";
import { ApiError } from "~/lib/api/http";
import { packagesApi } from "~/lib/api/packages/packages";
import { fmtMoney } from "~/lib/utils/format";
import { useSessionUser } from "~/context/auth-context";
import { useConfirm } from "~/context/confirm-context";
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
  PackageResponse,
} from "~/lib/api/packages/types";
import { Pagination } from "~/components/common/pagination";
import { usePagedSearchParams } from "~/hooks/use-paged-search-params";
import { PAGE_SIZE, parsePage } from "~/lib/utils/list-params";

const ACTIVE_FILTERS = [
  { id: "all", label: "All" },
  { id: "true", label: "Active" },
  { id: "false", label: "Inactive" },
];

const ACTIVE_VALUES = new Set(ACTIVE_FILTERS.slice(1).map(({ id }) => id));

export function clientLoader({ request }: Route.ClientLoaderArgs) {
  const searchParams = new URL(request.url).searchParams;
  const pageNumber = parsePage(searchParams);
  const requestedActive = searchParams.get("active");
  const isActive =
    requestedActive && ACTIVE_VALUES.has(requestedActive)
      ? requestedActive === "true"
      : undefined;

  const packagesP = packagesApi.list({
    pageNumber,
    pageSize: PAGE_SIZE,
    sortBy: "name",
    sortOrder: "asc",
    isActive,
  });
  return { data: packagesP };
}

export default function Packages({ loaderData }: Route.ComponentProps) {
  const { searchParams, setSearchParams, navigatePage } = usePagedSearchParams();
  const revalidator = useRevalidator();
  const confirm = useConfirm();
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

  async function handleDelete(row: PackageListItemDto) {
    const ok = await confirm({
      title: "Delete package?",
      description: `"${row.name ?? "This package"}" will be permanently deleted. This can't be undone.`,
      confirmLabel: "Delete",
      cancelLabel: "Keep",
      destructive: true,
    });
    if (!ok) return;
    try {
      await packagesApi.remove(row.id);
      toast.success("Package deleted");
      revalidator.revalidate();
    } catch (e) {
      toast.error(
        e instanceof ApiError ? e.message : "Could not delete the package",
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
      header: "Max people",
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

  if (writable) {
    columns.push({
      key: "actions",
      header: "",
      align: "right",
      width: "48px",
      cell: (r) => (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Delete ${r.name ?? "package"}`}
          className="text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(r);
          }}
        >
          <Trash2Icon />
        </Button>
      ),
    });
  }

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

              <Pagination page={packagesPage} onPage={navigatePage} />
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
