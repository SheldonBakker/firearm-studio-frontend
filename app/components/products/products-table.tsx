import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Skeleton } from "~/components/ui/skeleton";
import { Switch } from "~/components/ui/switch";
import { StatusBadge } from "~/components/common/status-badge";
import { Mono } from "~/components/common/mono";
import { cn } from "~/lib/utils/cn";
import { fmtDate, fmtMoney } from "~/lib/utils/format";
import { fmtMarginPercent } from "~/lib/products/margin";
import { Thumbnail } from "./thumbnail";
import { StockStepper } from "./stock-stepper";
import { ProductRowActions } from "./product-row-actions";
import type {
  ProductResponse,
  ProductSortBy,
  SortDir,
} from "~/lib/api/products/types";

export interface ProductsTableProps {
  rows: ProductResponse[];
  sort: ProductSortBy;
  dir: SortDir;
  onSort: (key: ProductSortBy) => void;
  canWrite: boolean;
  onOpen: (id: string) => void;
  onStockCommit: (row: ProductResponse, next: number) => void;
  onActiveToggle: (row: ProductResponse, next: boolean) => void;
  onDuplicate: (row: ProductResponse) => void;
  onDelete: (row: ProductResponse) => void;
  pending: Set<string>;
  loading?: boolean;
}

const WIDE_CLS = "hidden lg:table-cell";

const WIDE_SKELETON_COLS: ReadonlySet<number> = new Set([4, 5, 8]);

const HEAD_CLS =
  "h-auto whitespace-nowrap px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-wide text-dim";

function SortHeader({
  label,
  columnKey,
  sort,
  dir,
  onSort,
  align = "left",
  className,
}: {
  label: string;
  columnKey: ProductSortBy;
  sort: ProductSortBy;
  dir: SortDir;
  onSort: (key: ProductSortBy) => void;
  align?: "left" | "right";
  className?: string;
}) {
  const active = sort === columnKey;
  return (
    <TableHead
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
      className={cn(HEAD_CLS, className, align === "right" && "text-right")}
    >
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        className={cn(
          "inline-flex items-center gap-1 uppercase transition-colors hover:text-foreground",
          align === "right" && "flex-row-reverse",
          active && "text-foreground",
        )}
      >
        {label}
        {active &&
          (dir === "asc" ? (
            <ChevronUpIcon className="size-3" />
          ) : (
            <ChevronDownIcon className="size-3" />
          ))}
      </button>
    </TableHead>
  );
}

export function ProductsTable(props: ProductsTableProps) {
  const {
    rows,
    sort,
    dir,
    onSort,
    canWrite,
    onOpen,
    onStockCommit,
    onActiveToggle,
    onDuplicate,
    onDelete,
    pending,
    loading,
  } = props;
  const colCount = canWrite ? 10 : 9;
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary hover:bg-secondary">
            <TableHead className={HEAD_CLS} style={{ width: "56px" }}>
              <span className="sr-only">Image</span>
            </TableHead>
            <SortHeader label="Name" columnKey="name" sort={sort} dir={dir} onSort={onSort} />
            <SortHeader label="Category" columnKey="category" sort={sort} dir={dir} onSort={onSort} />
            <SortHeader label="Price" columnKey="price" sort={sort} dir={dir} onSort={onSort} align="right" />
            <TableHead className={cn(HEAD_CLS, WIDE_CLS, "text-right")}>Cost</TableHead>
            <TableHead className={cn(HEAD_CLS, WIDE_CLS)}>Margin</TableHead>
            <SortHeader label="Stock" columnKey="stockQuantity" sort={sort} dir={dir} onSort={onSort} />
            <TableHead className={HEAD_CLS}>Active</TableHead>
            <SortHeader label="Added" columnKey="createdAt" sort={sort} dir={dir} onSort={onSort} className={WIDE_CLS} />
            {canWrite && (
              <TableHead className={HEAD_CLS} style={{ width: "48px" }}>
                <span className="sr-only">Actions</span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? Array.from({ length: 6 }).map((_, ri) => (
                <TableRow key={ri} className="border-b border-line last:border-0">
                  {Array.from({ length: colCount }).map((_, ci) => (
                    <TableCell
                      key={ci}
                      className={cn(
                        "px-4 py-3.5",
                        WIDE_SKELETON_COLS.has(ci) && WIDE_CLS,
                      )}
                    >
                      <Skeleton
                        className="h-4 w-full max-w-28"
                        style={{ opacity: 1 - ri * 0.12 }}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : rows.map((row) => {
                const busy = pending.has(row.id);
                const margin = fmtMarginPercent(row.price, row.costPrice);
                return (
                  <TableRow
                    key={row.id}
                    onClick={() => onOpen(row.id)}
                    className="cursor-pointer border-b border-line last:border-0 hover:bg-secondary"
                  >
                    <TableCell className="px-4 py-3">
                      <Thumbnail src={row.imageUrl} alt={row.name} />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpen(row.id);
                        }}
                        className="block text-left"
                      >
                        <span className="block text-[13px] font-semibold text-foreground">
                          {row.name}
                        </span>
                        <Mono className="block text-[11.5px] text-dim">
                          {row.sku ?? "-"}
                        </Mono>
                      </button>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {row.category ? (
                        <StatusBadge status={row.category} dot={false} />
                      ) : (
                        <span className="text-dim">-</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <Mono className="text-[12.5px] text-foreground">
                        {fmtMoney(row.price)}
                      </Mono>
                    </TableCell>
                    <TableCell className={cn("px-4 py-3 text-right", WIDE_CLS)}>
                      <Mono className="text-[12.5px] text-muted-foreground">
                        {fmtMoney(row.costPrice)}
                      </Mono>
                    </TableCell>
                    <TableCell
                      className={cn("px-4 py-3", WIDE_CLS)}
                      title={
                        margin
                          ? undefined
                          : "Margin needs a cost price and a non-zero price"
                      }
                    >
                      <span className="text-[12.5px] text-muted-foreground">
                        {margin}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {canWrite ? (
                        <StockStepper
                          value={row.stockQuantity}
                          disabled={busy}
                          onCommit={(next) => onStockCommit(row, next)}
                        />
                      ) : (
                        <span
                          className={cn(
                            "font-mono text-[12.5px]",
                            row.stockQuantity === 0 &&
                              "text-[color:var(--status-amber)]",
                          )}
                        >
                          {row.stockQuantity}
                        </span>
                      )}
                    </TableCell>
                    <TableCell
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {canWrite ? (
                        <Switch
                          checked={row.isActive}
                          disabled={busy}
                          aria-label="Active"
                          onCheckedChange={(next) => onActiveToggle(row, next)}
                        />
                      ) : (
                        <StatusBadge status={row.isActive ? "Active" : "Inactive"} />
                      )}
                    </TableCell>
                    <TableCell className={cn("px-4 py-3", WIDE_CLS)}>
                      <span className="text-[12px] text-dim">
                        {fmtDate(row.createdAt)}
                      </span>
                    </TableCell>
                    {canWrite && (
                      <TableCell
                        className="px-4 py-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ProductRowActions
                          onEdit={() => onOpen(row.id)}
                          onDuplicate={() => onDuplicate(row)}
                          onDelete={() => onDelete(row)}
                        />
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
        </TableBody>
      </Table>
    </div>
  );
}
