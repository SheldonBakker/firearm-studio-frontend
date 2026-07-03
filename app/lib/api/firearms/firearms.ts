import { request } from "../http";
import { normalizePage } from "../shared/pagination";
import type {
  CreateFirearmRequest,
  FirearmDetailResponse,
  FirearmResponse,
  FirearmResponsePaginatedResponse,
  UpdateFirearmRequest,
} from "./types";

interface FirearmListParams {
  pageNumber?: number;
  pageSize?: number;
  serialNumber?: string;
  status?: string | number;
  customerName?: string;
}

async function list(
  params: FirearmListParams = {},
): Promise<FirearmResponsePaginatedResponse> {
  const response = await request<FirearmResponsePaginatedResponse>(
    "/api/v1/firearms",
    {
      query: {
        pageNumber: params.pageNumber,
        pageSize: params.pageSize,
        serialNumber: params.serialNumber,
        status: params.status !== undefined ? String(params.status) : undefined,
        customerName: params.customerName,
      },
    },
  );
  return normalizePage(response, params);
}

async function all(): Promise<FirearmResponse[]> {
  const pageSize = 200;
  const firstPage = await list({ pageNumber: 1, pageSize });
  const firearms = [...(firstPage.items ?? [])];
  const totalPages = Math.ceil(
    firstPage.totalCount / Math.max(1, firstPage.pageSize),
  );
  for (let pageNumber = 2; pageNumber <= totalPages; pageNumber += 1) {
    const page = await list({ pageNumber, pageSize });
    firearms.push(...(page.items ?? []));
  }
  return firearms;
}

export const firearmsApi = {
  list,
  all,
  get: (id: string) =>
    request<FirearmDetailResponse>(`/api/v1/firearms/${id}`),
  create: (body: CreateFirearmRequest) =>
    request<FirearmResponse>("/api/v1/firearms", { method: "POST", body }),
  update: (id: string, body: UpdateFirearmRequest) =>
    request<void>(`/api/v1/firearms/${id}`, { method: "PATCH", body }),
};
