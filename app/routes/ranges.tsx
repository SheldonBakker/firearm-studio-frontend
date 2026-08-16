import { useState } from "react";
import { useRevalidator, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Trash2Icon } from "lucide-react";
import type { Route } from "./+types/ranges";
import { ApiError } from "~/lib/api/http";
import { rangesApi } from "~/lib/api/ranges/ranges";
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
import { RangeFormDialog } from "~/components/modals/range-form-dialog";
import { Resolve } from "~/components/common/skeletons";
import type {
  ShootingRangeListItemDto,
  ShootingRangeResponse,
} from "~/lib/api/ranges/types";

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

  const rangesP = rangesApi.list({ pageNumber, pageSize: PAGE_SIZE, sortOrder: "asc", isActive });
  return { data: rangesP };
}

export default function Ranges({ loaderData }: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const revalidator = useRevalidator();
  const confirm = useConfirm();
  const user = useSessionUser();
  const writable = can(user, "bookings:write");
  const [addOpen, setAddOpen] = useState(false);
  const [editRange, setEditRange] = useState<ShootingRangeResponse | null>(
    null,
  );
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

  async function openEdit(row: ShootingRangeListItemDto) {
    try {
      const range = await rangesApi.get(row.id);
      setEditRange(range);
      setEditOpen(true);
    } catch (e) {
      toast.error(
        e instanceof ApiError ? e.message : "Could not load the range",
      );
    }
  }

  async function handleDelete(row: ShootingRangeListItemDto) {
    const ok = await confirm({
      title: "Delete range?",
      description: `"${row.name ?? "This range"}" will be permanently deleted. This can't be undone.`,
      confirmLabel: "Delete",
      cancelLabel: "Keep",
      destructive: true,
    });
    if (!ok) return;
    try {
      await rangesApi.remove(row.id);
      toast.success("Range deleted");
      revalidator.revalidate();
    } catch (e) {
      toast.error(
        e instanceof ApiError ? e.message : "Could not delete the range",
      );
    }
  }

  const columns: Column<ShootingRangeListItemDto>[] = [
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
      key: "lanes",
      header: "Capacity",
      align: "right",
      cell: (r) => (
        <Mono className="text-[12.5px] text-muted-foreground">
          {r.laneCount}
        </Mono>
      ),
    },
    {
      key: "interval",
      header: "Slot interval",
      align: "right",
      cell: (r) => (
        <Mono className="text-[12.5px] text-muted-foreground">
          {r.slotIntervalMinutes} min
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
          aria-label={`Delete ${r.name ?? "range"}`}
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
            Add range
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
          <DataTable<ShootingRangeListItemDto>
            columns={columns}
            rows={[]}
            loading
          />
        }
      >
        {(rangesPage) => {
          const ranges = rangesPage.items ?? [];
          return (
            <>
              <DataTable<ShootingRangeListItemDto>
                columns={columns}
                rows={ranges}
                onRowClick={writable ? openEdit : undefined}
                empty={
                  activeFilter !== "all"
                    ? "No ranges match this filter."
                    : "No ranges yet."
                }
              />

              {rangesPage.totalCount > rangesPage.pageSize && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[12.5px] text-muted-foreground">
                    Showing{" "}
                    {(rangesPage.pageNumber - 1) * rangesPage.pageSize + 1}–
                    {Math.min(
                      rangesPage.pageNumber * rangesPage.pageSize,
                      rangesPage.totalCount,
                    )}{" "}
                    of {rangesPage.totalCount}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={rangesPage.pageNumber <= 1}
                      onClick={() => navigatePage(rangesPage.pageNumber - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={
                        rangesPage.pageNumber * rangesPage.pageSize >=
                        rangesPage.totalCount
                      }
                      onClick={() => navigatePage(rangesPage.pageNumber + 1)}
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

      <RangeFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSaved={() => {
          toast.success("Range added");
          revalidator.revalidate();
        }}
      />
      <RangeFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        range={editRange}
        onSaved={() => {
          toast.success("Range updated");
          revalidator.revalidate();
        }}
      />
    </PageWrap>
  );
}
