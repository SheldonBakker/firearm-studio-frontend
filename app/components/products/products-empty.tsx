import { Button } from "~/components/ui/button";
import { Icon } from "~/components/common/icon";

export function ProductsEmpty({
  variant,
  canCreate,
  onNew,
  onClearFilters,
}: {
  variant: "empty" | "filtered";
  canCreate: boolean;
  onNew: () => void;
  onClearFilters: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card px-4 py-16 text-center">
      <span className="text-dim" aria-hidden="true">
        <Icon name="package" size={26} />
      </span>
      <div className="text-sm font-semibold text-foreground">
        {variant === "empty"
          ? "No products yet."
          : "No products match these filters."}
      </div>
      {variant === "empty"
        ? canCreate && (
            <Button onClick={onNew} className="mt-1">
              <Icon name="plus" size={16} />
              New product
            </Button>
          )
        : (
            <Button variant="outline" onClick={onClearFilters} className="mt-1">
              Clear filters
            </Button>
          )}
    </div>
  );
}
