import {
  DEFAULT_DIR,
  DEFAULT_SORT,
  LOW_STOCK_THRESHOLD,
  PRODUCT_PAGE_SIZES,
} from "./constants";
import type {
  ProductListParams,
  ProductSortBy,
  SortDir,
} from "~/lib/api/products/types";

const SORT_KEYS: ProductSortBy[] = [
  "name",
  "price",
  "category",
  "stockQuantity",
  "createdAt",
];
const STATUS_VALUES = ["active", "inactive"] as const;
const STOCK_VALUES = ["in", "out", "low"] as const;
const PRICE_RE = /^\d+(\.\d{1,2})?$/;

export interface ProductListState {
  q: string;
  category: string;
  status?: "active" | "inactive";
  stock?: "in" | "out" | "low";
  minPrice: string;
  maxPrice: string;
  sort: ProductSortBy;
  dir: SortDir;
  page: number;
  size: number;
}

export const DEFAULT_PRODUCT_LIST_STATE: ProductListState = {
  q: "",
  category: "",
  status: undefined,
  stock: undefined,
  minPrice: "",
  maxPrice: "",
  sort: DEFAULT_SORT,
  dir: DEFAULT_DIR,
  page: 1,
  size: 20,
};

function asEnum<T extends string>(
  value: string | null,
  allowed: readonly T[],
): T | undefined {
  return value !== null && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
}

function parsePriceParam(value: string | null): string {
  if (!value) return "";
  return PRICE_RE.test(value) ? value : "";
}

export function parseProductListParams(sp: URLSearchParams): ProductListState {
  const sizeRaw = Number(sp.get("size"));
  const size = (PRODUCT_PAGE_SIZES as readonly number[]).includes(sizeRaw)
    ? sizeRaw
    : 20;
  const pageRaw = Number(sp.get("page"));
  const dirRaw = sp.get("dir");
  return {
    q: sp.get("q") ?? "",
    category: sp.get("category") ?? "",
    status: asEnum(sp.get("status"), STATUS_VALUES),
    stock: asEnum(sp.get("stock"), STOCK_VALUES),
    minPrice: parsePriceParam(sp.get("minPrice")),
    maxPrice: parsePriceParam(sp.get("maxPrice")),
    sort: asEnum(sp.get("sort"), SORT_KEYS) ?? DEFAULT_SORT,
    dir: dirRaw === "asc" || dirRaw === "desc" ? dirRaw : DEFAULT_DIR,
    page: Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1,
    size,
  };
}

export function productListStateToSearch(
  state: ProductListState,
): URLSearchParams {
  const sp = new URLSearchParams();
  if (state.q) sp.set("q", state.q);
  if (state.category) sp.set("category", state.category);
  if (state.status) sp.set("status", state.status);
  if (state.stock) sp.set("stock", state.stock);
  if (state.minPrice) sp.set("minPrice", state.minPrice);
  if (state.maxPrice) sp.set("maxPrice", state.maxPrice);
  if (state.sort !== DEFAULT_SORT) sp.set("sort", state.sort);
  if (state.dir !== DEFAULT_DIR) sp.set("dir", state.dir);
  if (state.page > 1) sp.set("page", String(state.page));
  if (state.size !== 20) sp.set("size", String(state.size));
  return sp;
}

export function productListStateToApiParams(
  state: ProductListState,
): ProductListParams {
  const params: ProductListParams = {
    sortBy: state.sort,
    sortDir: state.dir,
    pageNumber: state.page,
    pageSize: state.size,
  };
  const q = state.q.trim();
  if (q) params.search = q;
  if (state.category) params.category = state.category;
  if (state.status) params.isActive = state.status === "active";
  if (state.stock === "in") params.minStock = 1;
  if (state.stock === "out") params.maxStock = 0;
  if (state.stock === "low") params.maxStock = LOW_STOCK_THRESHOLD - 1;
  if (state.minPrice) params.minPrice = Number(state.minPrice);
  if (state.maxPrice) params.maxPrice = Number(state.maxPrice);
  return params;
}
