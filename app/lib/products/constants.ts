import type { ProductSortBy, SortDir } from "~/lib/api/products/types";

export const LOW_STOCK_THRESHOLD = 5;
export const PRODUCT_PAGE_SIZES = [20, 50, 100] as const;
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_ACCEPT = ["image/jpeg", "image/png", "image/webp"] as const;
export const DEFAULT_SORT: ProductSortBy = "name";
export const DEFAULT_DIR: SortDir = "asc";
