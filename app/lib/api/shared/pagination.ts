export interface PaginatedResponse<T> {
  items: T[] | null;
  pageNumber: number;
  pageSize: number;
  totalCount: number;
}

/**
 * Coerce a (possibly missing / malformed) paginated payload into a stable
 * shape with sane defaults. Shared by every feature's list endpoint.
 */
export function normalizePage<T>(
  response: PaginatedResponse<T> | null | undefined,
  params: { pageNumber?: number; pageSize?: number } = {},
): PaginatedResponse<T> {
  return {
    items: Array.isArray(response?.items) ? response!.items : [],
    pageNumber: response?.pageNumber ?? params.pageNumber ?? 1,
    pageSize: response?.pageSize ?? params.pageSize ?? 20,
    totalCount: response?.totalCount ?? 0,
  };
}
