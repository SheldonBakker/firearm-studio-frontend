import { request } from "../http";
import { normalizePage } from "../shared/pagination";
import type {
  CreatePackageRequest,
  PackageListItemDto,
  PackageListItemDtoPaginatedResponse,
  PackageResponse,
  UpdatePackageRequest,
} from "./types";

interface PackageListParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
  name?: string;
  isActive?: boolean;
}

async function list(
  params: PackageListParams = {},
): Promise<PackageListItemDtoPaginatedResponse> {
  const response = await request<PackageListItemDtoPaginatedResponse>(
    "/api/v1/packages",
    {
      query: {
        pageNumber: params.pageNumber,
        pageSize: params.pageSize,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        name: params.name,
        isActive:
          params.isActive !== undefined ? String(params.isActive) : undefined,
      },
    },
  );
  return normalizePage(response, params);
}

async function all(): Promise<PackageListItemDto[]> {
  const pageSize = 100;
  const firstPage = await list({ pageNumber: 1, pageSize });
  const packages = [...(firstPage.items ?? [])];
  const totalPages = Math.ceil(
    firstPage.totalCount / Math.max(1, firstPage.pageSize),
  );

  for (let pageNumber = 2; pageNumber <= totalPages; pageNumber += 1) {
    const page = await list({ pageNumber, pageSize });
    packages.push(...(page.items ?? []));
  }

  return packages;
}

export const packagesApi = {
  list,
  all,
  get: (id: string) => request<PackageResponse>(`/api/v1/packages/${id}`),
  create: (body: CreatePackageRequest) =>
    request<PackageResponse>("/api/v1/packages", { method: "POST", body }),
  update: (id: string, body: UpdatePackageRequest) =>
    request<void>(`/api/v1/packages/${id}`, { method: "PATCH", body }),
  remove: (id: string) =>
    request<void>(`/api/v1/packages/${id}`, { method: "DELETE" }),
};
