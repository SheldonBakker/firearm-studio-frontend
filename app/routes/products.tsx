import { Suspense, use, useEffect, useRef, useState } from "react";
import { useNavigate, useRevalidator, useSearchParams } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/products";
import { productsApi } from "~/lib/api/products/products";
import { mapProductError } from "~/lib/api/products/errors";
import {
  DEFAULT_PRODUCT_LIST_STATE,
  parseProductListParams,
  productListStateToApiParams,
  productListStateToSearch,
  type ProductListState,
} from "~/lib/products/list-query";
import { PRODUCT_PAGE_SIZES } from "~/lib/products/constants";
import { useVisibilityRefetch } from "~/hooks/use-visibility-refetch";
import { useSessionUser } from "~/context/auth-context";
import { can } from "~/lib/utils/rbac";
import { useConfirm } from "~/context/confirm-context";
import { PageWrap } from "~/components/common/misc";
import { PageActions } from "~/context/page-actions";
import { FilterBar } from "~/components/common/filter-bar";
import { Pagination } from "~/components/common/pagination";
import { Icon } from "~/components/common/icon";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { ProductsTable } from "~/components/products/products-table";
import { ProductCard } from "~/components/products/product-card";
import { ProductsEmpty } from "~/components/products/products-empty";
import { ProductsListBoundary } from "~/components/products/products-list-boundary";
import type {
  ProductResponse,
  ProductResponsePaginatedResponse,
  ProductSortBy,
} from "~/lib/api/products/types";

const PRICE_RE = /^\d+(\.\d{1,2})?$/;

const EMPTY_PENDING: Set<string> = new Set();

const STATUS_OPTIONS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
];

const STOCK_OPTIONS = [
  { id: "all", label: "All" },
  { id: "in", label: "In stock" },
  { id: "out", label: "Out of stock" },
  { id: "low", label: "Low stock" },
];

export function clientLoader({ request }: Route.ClientLoaderArgs) {
  const sp = new URL(request.url).searchParams;
  const state = parseProductListParams(sp);
  return {
    data: productsApi.list(productListStateToApiParams(state)),
    categories: productsApi.categories().catch((): string[] => []),
  };
}

function CategoryFilter({
  promise,
  value,
  onChange,
}: {
  promise: Promise<string[]>;
  value: string;
  onChange: (value: string) => void;
}) {
  const categories = use(promise);
  return (
    <Select
      value={value || "all"}
      onValueChange={(next) => onChange(next === "all" ? "" : next)}
    >
      <SelectTrigger className="w-full sm:w-48">
        <SelectValue placeholder="All categories" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All categories</SelectItem>
        {categories.map((category) => (
          <SelectItem key={category} value={category}>
            {category}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ResultCount({ promise }: { promise: Promise<ProductResponsePaginatedResponse> }) {
  const page = use(promise);
  const n = page.totalCount;
  return (
    <p className="mb-3 text-[12.5px] text-muted-foreground">
      {n} {n === 1 ? "product" : "products"}
    </p>
  );
}

export default function Products({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const confirm = useConfirm();
  const user = useSessionUser();
  const canWrite = can(user, "products:write");
  const [searchParams, setSearchParams] = useSearchParams();
  const state = parseProductListParams(searchParams);

  const [qDraft, setQDraft] = useState(state.q);
  const [minDraft, setMinDraft] = useState(state.minPrice);
  const [maxDraft, setMaxDraft] = useState(state.maxPrice);
  const [overrides, setOverrides] = useState<Map<string, Partial<ProductResponse>>>(
    new Map(),
  );
  const [pending, setPending] = useState<Set<string>>(new Set());
  const paramsKey = searchParams.toString();
  const syncedKey = useRef(paramsKey);
  const lastWritten = useRef({
    q: state.q,
    minPrice: state.minPrice,
    maxPrice: state.maxPrice,
  });
  const requestSeq = useRef(0);
  const latestRequest = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (syncedKey.current === paramsKey) return;
    syncedKey.current = paramsKey;
    if (state.q !== lastWritten.current.q) setQDraft(state.q);
    if (state.minPrice !== lastWritten.current.minPrice) {
      setMinDraft(state.minPrice);
    }
    if (state.maxPrice !== lastWritten.current.maxPrice) {
      setMaxDraft(state.maxPrice);
    }
    lastWritten.current = {
      q: state.q,
      minPrice: state.minPrice,
      maxPrice: state.maxPrice,
    };
  }, [paramsKey, state.q, state.minPrice, state.maxPrice]);

  useEffect(() => {
    latestRequest.current = new Map();
    setOverrides(new Map());
    setPending(new Set());
  }, [loaderData.data]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearchParams(
        (prev) => {
          const current = parseProductListParams(prev);
          const nextMin =
            minDraft.trim() === "" || PRICE_RE.test(minDraft.trim())
              ? minDraft.trim()
              : current.minPrice;
          const nextMax =
            maxDraft.trim() === "" || PRICE_RE.test(maxDraft.trim())
              ? maxDraft.trim()
              : current.maxPrice;
          if (
            current.q === qDraft &&
            current.minPrice === nextMin &&
            current.maxPrice === nextMax
          ) {
            return prev;
          }
          lastWritten.current = {
            q: qDraft,
            minPrice: nextMin,
            maxPrice: nextMax,
          };
          return productListStateToSearch({
            ...current,
            q: qDraft,
            minPrice: nextMin,
            maxPrice: nextMax,
            page: 1,
          });
        },
        { replace: true },
      );
    }, 300);
    return () => clearTimeout(handle);
  }, [qDraft, minDraft, maxDraft, setSearchParams]);

  useVisibilityRefetch(50 * 60 * 1000, () => revalidator.revalidate());

  function updateState(partial: Partial<ProductListState>, resetPage = true) {
    const next: ProductListState = { ...state, ...partial };
    if (resetPage && partial.page === undefined) next.page = 1;
    setSearchParams(productListStateToSearch(next), { replace: true });
  }

  function onSort(key: ProductSortBy) {
    if (state.sort === key) {
      updateState({ dir: state.dir === "asc" ? "desc" : "asc" });
    } else {
      updateState({ sort: key, dir: "asc" });
    }
  }

  function clearFilters() {
    setSearchParams(
      productListStateToSearch({
        ...DEFAULT_PRODUCT_LIST_STATE,
        size: state.size,
      }),
      { replace: true },
    );
  }

  function applyOverride(id: string, patch: Partial<ProductResponse>) {
    setOverrides((prev) => {
      const next = new Map(prev);
      next.set(id, { ...(prev.get(id) ?? {}), ...patch });
      return next;
    });
  }

  function clearOverride(id: string, key: keyof ProductResponse) {
    setOverrides((prev) => {
      const patch = prev.get(id);
      if (!patch || !(key in patch)) return prev;
      const { [key]: _removed, ...rest } = patch;
      const next = new Map(prev);
      if (Object.keys(rest).length === 0) next.delete(id);
      else next.set(id, rest);
      return next;
    });
  }

  function beginRequest(id: string): number {
    requestSeq.current += 1;
    latestRequest.current.set(id, requestSeq.current);
    return requestSeq.current;
  }

  function isLatest(id: string, token: number): boolean {
    return latestRequest.current.get(id) === token;
  }

  function markPending(id: string, on: boolean) {
    setPending((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function onStockCommit(row: ProductResponse, nextStock: number) {
    const token = beginRequest(row.id);
    applyOverride(row.id, { stockQuantity: nextStock });
    markPending(row.id, true);
    try {
      const updated = await productsApi.update(row.id, {
        stockQuantity: nextStock,
      });
      if (isLatest(row.id, token)) {
        applyOverride(row.id, { stockQuantity: updated.stockQuantity });
      }
    } catch (err) {
      if (isLatest(row.id, token)) clearOverride(row.id, "stockQuantity");
      toast.error(mapProductError(err).message);
    } finally {
      if (isLatest(row.id, token)) markPending(row.id, false);
    }
  }

  async function onActiveToggle(row: ProductResponse, nextActive: boolean) {
    const token = beginRequest(row.id);
    applyOverride(row.id, { isActive: nextActive });
    markPending(row.id, true);
    try {
      const updated = await productsApi.update(row.id, {
        isActive: nextActive,
      });
      if (isLatest(row.id, token)) {
        applyOverride(row.id, { isActive: updated.isActive });
      }
    } catch (err) {
      if (isLatest(row.id, token)) clearOverride(row.id, "isActive");
      toast.error(mapProductError(err).message);
    } finally {
      if (isLatest(row.id, token)) markPending(row.id, false);
    }
  }

  function onDuplicate(row: ProductResponse) {
    navigate("/products/new", {
      state: {
        name: row.name,
        description: row.description,
        category: row.category,
        price: row.price,
        costPrice: row.costPrice,
        stockQuantity: row.stockQuantity,
        isActive: row.isActive,
      },
    });
  }

  async function onDelete(row: ProductResponse) {
    const ok = await confirm({
      title: "Delete product",
      description: `Delete "${row.name}"? This cannot be undone.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await productsApi.remove(row.id);
      latestRequest.current.delete(row.id);
      setOverrides((prev) => {
        if (!prev.has(row.id)) return prev;
        const next = new Map(prev);
        next.delete(row.id);
        return next;
      });
      markPending(row.id, false);
      toast.success("Product deleted");
      revalidator.revalidate();
    } catch (err) {
      toast.error(mapProductError(err).message);
    }
  }

  function mergeRows(rows: ProductResponse[]): ProductResponse[] {
    if (overrides.size === 0) return rows;
    return rows.map((row) => {
      const patch = overrides.get(row.id);
      return patch ? { ...row, ...patch } : row;
    });
  }

  const filtersActive =
    state.q !== "" ||
    state.category !== "" ||
    state.status !== undefined ||
    state.stock !== undefined ||
    state.minPrice !== "" ||
    state.maxPrice !== "";

  const loadingFallback = (
    <>
      <div className="hidden md:block">
        <ProductsTable
          rows={[]}
          loading
          sort={state.sort}
          dir={state.dir}
          onSort={() => {}}
          canWrite={canWrite}
          onOpen={() => {}}
          onStockCommit={() => {}}
          onActiveToggle={() => {}}
          onDuplicate={() => {}}
          onDelete={() => {}}
          pending={EMPTY_PENDING}
        />
      </div>
      <div className="grid gap-3 md:hidden">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    </>
  );

  return (
    <PageWrap>
      {canWrite && (
        <PageActions>
          <Button onClick={() => navigate("/products/new")}>
            <Icon name="plus" size={16} />
            New product
          </Button>
        </PageActions>
      )}

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full sm:w-85">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim">
              <Icon name="search" size={16} />
            </span>
            <input
              type="search"
              autoFocus
              value={qDraft}
              placeholder="Search by name or SKU..."
              onChange={(e) => setQDraft(e.target.value)}
              className="h-10 w-full rounded-[9px] border border-border2 bg-background px-3 pl-9 text-[16px] text-foreground outline-none focus:border-primary sm:h-9.5 sm:text-[13px]"
            />
          </div>
          <Suspense
            fallback={
              <Select disabled value="all">
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                </SelectContent>
              </Select>
            }
          >
            <CategoryFilter
              promise={loaderData.categories}
              value={state.category}
              onChange={(value) => updateState({ category: value })}
            />
          </Suspense>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={minDraft}
              placeholder="Min R"
              aria-label="Minimum price"
              onChange={(e) => setMinDraft(e.target.value)}
              className="h-10 w-24 rounded-[9px] border border-border2 bg-background px-3 text-[14px] outline-none focus:border-primary sm:h-9.5 sm:text-[13px]"
            />
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={maxDraft}
              placeholder="Max R"
              aria-label="Maximum price"
              onChange={(e) => setMaxDraft(e.target.value)}
              className="h-10 w-24 rounded-[9px] border border-border2 bg-background px-3 text-[14px] outline-none focus:border-primary sm:h-9.5 sm:text-[13px]"
            />
          </div>
        </div>
        <FilterBar
          options={STATUS_OPTIONS}
          active={state.status ?? "all"}
          onChange={(id) =>
            updateState({
              status: id === "all" ? undefined : (id as "active" | "inactive"),
            })
          }
        />
        <FilterBar
          options={STOCK_OPTIONS}
          active={state.stock ?? "all"}
          onChange={(id) =>
            updateState({
              stock: id === "all" ? undefined : (id as "in" | "out" | "low"),
            })
          }
        />
      </div>

      <ProductsListBoundary
        resetKey={loaderData.data}
        onRetry={() => revalidator.revalidate()}
      >
        <Suspense fallback={<Skeleton className="mb-3 h-4 w-24" />}>
          <ResultCount promise={loaderData.data} />
        </Suspense>
        <Suspense fallback={loadingFallback}>
          <ProductsResolved
            promise={loaderData.data}
            rows={mergeRows}
            filtersActive={filtersActive}
            canWrite={canWrite}
            state={state}
            onSort={onSort}
            onOpen={(id) => navigate(`/products/${id}`)}
            onStockCommit={onStockCommit}
            onActiveToggle={onActiveToggle}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            pending={pending}
            onNew={() => navigate("/products/new")}
            onClearFilters={clearFilters}
            onPage={(page) => updateState({ page }, false)}
            onSize={(size) => updateState({ size })}
          />
        </Suspense>
      </ProductsListBoundary>
    </PageWrap>
  );
}

function ProductsResolved({
  promise,
  rows,
  filtersActive,
  canWrite,
  state,
  onSort,
  onOpen,
  onStockCommit,
  onActiveToggle,
  onDuplicate,
  onDelete,
  pending,
  onNew,
  onClearFilters,
  onPage,
  onSize,
}: {
  promise: Promise<ProductResponsePaginatedResponse>;
  rows: (rows: ProductResponse[]) => ProductResponse[];
  filtersActive: boolean;
  canWrite: boolean;
  state: ProductListState;
  onSort: (key: ProductSortBy) => void;
  onOpen: (id: string) => void;
  onStockCommit: (row: ProductResponse, next: number) => void;
  onActiveToggle: (row: ProductResponse, next: boolean) => void;
  onDuplicate: (row: ProductResponse) => void;
  onDelete: (row: ProductResponse) => void;
  pending: Set<string>;
  onNew: () => void;
  onClearFilters: () => void;
  onPage: (page: number) => void;
  onSize: (size: number) => void;
}) {
  const page = use(promise);
  const merged = rows(page.items ?? []);

  if (page.totalCount === 0) {
    return (
      <ProductsEmpty
        variant={filtersActive ? "filtered" : "empty"}
        canCreate={canWrite}
        onNew={onNew}
        onClearFilters={onClearFilters}
      />
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <ProductsTable
          rows={merged}
          sort={state.sort}
          dir={state.dir}
          onSort={onSort}
          canWrite={canWrite}
          onOpen={onOpen}
          onStockCommit={onStockCommit}
          onActiveToggle={onActiveToggle}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          pending={pending}
        />
      </div>
      <div className="grid gap-3 md:hidden">
        {merged.map((row) => (
          <ProductCard
            key={row.id}
            row={row}
            canWrite={canWrite}
            onOpen={onOpen}
            onStockCommit={onStockCommit}
            onActiveToggle={onActiveToggle}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            pending={pending}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="mt-4">
          <Select value={String(state.size)} onValueChange={(v) => onSize(Number(v))}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Pagination page={page} onPage={onPage} />
      </div>
    </>
  );
}
