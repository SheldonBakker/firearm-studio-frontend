import type { PaginatedResponse } from "../shared/pagination";

export interface ProductResponse {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  price: number;
  costPrice: number | null;
  category: string | null;
  stockQuantity: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProductResponsePaginatedResponse = PaginatedResponse<ProductResponse>;

export type ProductSortBy =
  | "name"
  | "price"
  | "category"
  | "stockQuantity"
  | "createdAt";

export type SortDir = "asc" | "desc";

export interface ProductListParams {
  search?: string;
  category?: string;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  minStock?: number;
  maxStock?: number;
  sortBy?: ProductSortBy;
  sortDir?: SortDir;
  pageNumber?: number;
  pageSize?: number;
}

export interface CreateProductRequest {
  name: string;
  description?: string | null;
  sku?: string | null;
  price: number;
  costPrice?: number | null;
  category?: string | null;
  stockQuantity?: number;
  isActive?: boolean;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string | null;
  sku?: string | null;
  price?: number;
  costPrice?: number | null;
  category?: string | null;
  stockQuantity?: number;
  isActive?: boolean;
}
