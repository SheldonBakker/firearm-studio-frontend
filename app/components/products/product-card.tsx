import { Switch } from "~/components/ui/switch";
import { StatusBadge } from "~/components/common/status-badge";
import { Mono } from "~/components/common/mono";
import { cn } from "~/lib/utils/cn";
import { fmtMoney } from "~/lib/utils/format";
import { fmtMarginPercent } from "~/lib/products/margin";
import { Thumbnail } from "./thumbnail";
import { StockStepper } from "./stock-stepper";
import { ProductRowActions } from "./product-row-actions";
import type { ProductResponse } from "~/lib/api/products/types";

export interface ProductCardProps {
  row: ProductResponse;
  canWrite: boolean;
  onOpen: (id: string) => void;
  onStockCommit: (row: ProductResponse, next: number) => void;
  onActiveToggle: (row: ProductResponse, next: boolean) => void;
  onDuplicate: (row: ProductResponse) => void;
  onDelete: (row: ProductResponse) => void;
  pending: Set<string>;
}

export function ProductCard(props: ProductCardProps) {
  const {
    row,
    canWrite,
    onOpen,
    onStockCommit,
    onActiveToggle,
    onDuplicate,
    onDelete,
    pending,
  } = props;
  const busy = pending.has(row.id);
  const margin = fmtMarginPercent(row.price, row.costPrice);
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => onOpen(row.id)}
          className="shrink-0"
          aria-label={`Open ${row.name}`}
        >
          <Thumbnail src={row.imageUrl} alt={row.name} size={48} />
        </button>
        <button
          type="button"
          onClick={() => onOpen(row.id)}
          className="min-w-0 flex-1 text-left"
        >
          <div className="truncate text-[14px] font-semibold text-foreground">
            {row.name}
          </div>
          <Mono className="block truncate text-[11.5px] text-dim">
            {row.sku ?? "-"}
          </Mono>
          {row.category && (
            <div className="mt-1">
              <StatusBadge status={row.category} dot={false} />
            </div>
          )}
        </button>
        {canWrite && (
          <ProductRowActions
            onEdit={() => onOpen(row.id)}
            onDuplicate={() => onDuplicate(row)}
            onDelete={() => onDelete(row)}
          />
        )}
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-[12.5px]">
        <div>
          <dt className="text-dim">Price</dt>
          <dd className="font-mono text-foreground">{fmtMoney(row.price)}</dd>
        </div>
        <div>
          <dt className="text-dim">Cost</dt>
          <dd className="font-mono text-muted-foreground">
            {fmtMoney(row.costPrice)}
          </dd>
        </div>
        <div>
          <dt className="text-dim">Margin</dt>
          <dd
            className="font-mono text-muted-foreground"
            title={
              margin
                ? undefined
                : "Margin needs a cost price and a non-zero price"
            }
          >
            {margin || "-"}
          </dd>
        </div>
      </dl>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-dim">Stock</span>
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
                row.stockQuantity === 0 && "text-[color:var(--status-amber)]",
              )}
            >
              {row.stockQuantity}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-dim">Active</span>
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
        </div>
      </div>
    </div>
  );
}
