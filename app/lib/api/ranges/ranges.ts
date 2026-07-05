import { request } from "../http";
import { normalizePage } from "../shared/pagination";
import type {
  CreateRangeRequest,
  DayAvailabilityResponse,
  MonthAvailabilityResponse,
  ShootingRangeListItemDto,
  ShootingRangeListItemDtoPaginatedResponse,
  ShootingRangeResponse,
  UpdateRangeRequest,
} from "./types";

interface RangeListParams {
  pageNumber?: number;
  pageSize?: number;
  sortOrder?: string;
  name?: string;
  isActive?: boolean;
}

async function list(
  params: RangeListParams = {},
): Promise<ShootingRangeListItemDtoPaginatedResponse> {
  const response = await request<ShootingRangeListItemDtoPaginatedResponse>(
    "/api/v1/ranges",
    {
      query: {
        pageNumber: params.pageNumber,
        pageSize: params.pageSize,
        sortOrder: params.sortOrder,
        name: params.name,
        isActive:
          params.isActive !== undefined ? String(params.isActive) : undefined,
      },
    },
  );
  return normalizePage(response, params);
}

async function all(): Promise<ShootingRangeListItemDto[]> {
  const pageSize = 100;
  const firstPage = await list({ pageNumber: 1, pageSize });
  const ranges = [...(firstPage.items ?? [])];
  const totalPages = Math.ceil(
    firstPage.totalCount / Math.max(1, firstPage.pageSize),
  );

  for (let pageNumber = 2; pageNumber <= totalPages; pageNumber += 1) {
    const page = await list({ pageNumber, pageSize });
    ranges.push(...(page.items ?? []));
  }

  return ranges;
}

export const rangesApi = {
  list,
  all,
  get: (id: string) => request<ShootingRangeResponse>(`/api/v1/ranges/${id}`),
  create: (body: CreateRangeRequest) =>
    request<ShootingRangeResponse>("/api/v1/ranges", { method: "POST", body }),
  update: (id: string, body: UpdateRangeRequest) =>
    request<void>(`/api/v1/ranges/${id}`, { method: "PATCH", body }),
  availability: (id: string, params: { packageId: string; date: string }) =>
    request<DayAvailabilityResponse>(`/api/v1/ranges/${id}/availability`, {
      query: params,
    }),
  monthAvailability: (
    id: string,
    params: { packageId: string; year: number; month: number },
  ) =>
    request<MonthAvailabilityResponse>(
      `/api/v1/ranges/${id}/availability/month`,
      { query: params },
    ),
};
