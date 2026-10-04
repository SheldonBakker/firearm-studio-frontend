import { request } from "../http";
import { normalizePage } from "../shared/pagination";
import type {
  CreateProductRequest,
  ProductListParams,
  ProductResponse,
  ProductResponsePaginatedResponse,
  UpdateProductRequest,
} from "./types";

const BASE = "/api/v1/products";

export function normalizeCategories(values: (string | null)[]): string[] {
  const seen = new Map<string, string>();
  for (const value of values) {
    if (!value) continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (!seen.has(key)) seen.set(key, trimmed);
  }
  return [...seen.values()].sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase()),
  );
}

async function list(
  params: ProductListParams = {},
): Promise<ProductResponsePaginatedResponse> {
  const response = await request<ProductResponsePaginatedResponse>(BASE, {
    query: {
      search: params.search,
      category: params.category,
      isActive:
        params.isActive !== undefined ? String(params.isActive) : undefined,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      minStock: params.minStock,
      maxStock: params.maxStock,
      sortBy: params.sortBy,
      sortDir: params.sortDir,
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
    },
  });
  return normalizePage(response, params);
}

async function categories(): Promise<string[]> {
  try {
    const page = await list({
      pageNumber: 1,
      pageSize: 200,
      sortBy: "category",
      sortDir: "asc",
    });
    return normalizeCategories((page.items ?? []).map((item) => item.category));
  } catch {
    return [];
  }
}

function uploadImage(id: string, file: File): Promise<ProductResponse> {
  const form = new FormData();
  form.append("file", file);
  return request<ProductResponse>(`${BASE}/${id}/image`, {
    method: "POST",
    body: form,
  });
}

export const productsApi = {
  list,
  categories,
  get: (id: string) => request<ProductResponse>(`${BASE}/${id}`),
  create: (body: CreateProductRequest) =>
    request<ProductResponse>(BASE, { method: "POST", body }),
  update: (id: string, body: UpdateProductRequest) =>
    request<ProductResponse>(`${BASE}/${id}`, { method: "PATCH", body }),
  remove: (id: string) => request<void>(`${BASE}/${id}`, { method: "DELETE" }),
  uploadImage,
  removeImage: (id: string) =>
    request<void>(`${BASE}/${id}/image`, { method: "DELETE" }),
};
