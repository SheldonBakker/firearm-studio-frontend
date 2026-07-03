import { request } from "../http";
import { normalizePage } from "../shared/pagination";
import type { LicenceStatus } from "~/lib/types/enums";
import type {
  CreateLicenceRequest,
  LicenceDetailDto,
  LicenceListItemDtoPaginatedResponse,
  UpdateLicenceRequest,
} from "./types";

interface LicenceListParams {
  pageNumber?: number;
  pageSize?: number;
  sortOrder?: string;
  licenceNumber?: string;
  status?: LicenceStatus | string | number;
}

async function list(
  params: LicenceListParams = {},
): Promise<LicenceListItemDtoPaginatedResponse> {
  const response = await request<LicenceListItemDtoPaginatedResponse>(
    "/api/v1/licences",
    {
      query: {
        pageNumber: params.pageNumber,
        pageSize: params.pageSize,
        sortOrder: params.sortOrder,
        licenceNumber: params.licenceNumber,
        status:
          params.status !== undefined ? String(params.status) : undefined,
      },
    },
  );
  return normalizePage(response, params);
}

export const licencesApi = {
  list,
  get: (id: string) => request<LicenceDetailDto>(`/api/v1/licences/${id}`),
  create: (firearmId: string, body: CreateLicenceRequest) =>
    request<void>(`/api/v1/firearms/${firearmId}/licences`, {
      method: "POST",
      body,
    }),
  update: (id: string, body: UpdateLicenceRequest) =>
    request<void>(`/api/v1/licences/${id}`, { method: "PATCH", body }),
};
