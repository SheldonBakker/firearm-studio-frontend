import { request } from "../http";
import { normalizePage } from "../shared/pagination";
import type {
  StartStorageRequest,
  StorageRecordDtoPaginatedResponse,
  StorageRecordResponse,
  UpdateStorageRecordRequest,
} from "./types";

interface StorageListParams {
  pageNumber?: number;
  pageSize?: number;
  storageStatus?: string | number;
  serialNumber?: string;
  customerName?: string;
}

async function listActive(
  params: StorageListParams = {},
): Promise<StorageRecordDtoPaginatedResponse> {
  const response = await request<StorageRecordDtoPaginatedResponse>(
    "/api/v1/storage",
    {
      query: {
        pageNumber: params.pageNumber,
        pageSize: params.pageSize,
        storageStatus:
          params.storageStatus !== undefined
            ? String(params.storageStatus)
            : undefined,
        serialNumber: params.serialNumber,
        customerName: params.customerName,
      },
    },
  );
  return normalizePage(response, params);
}

export const storageApi = {
  listActive,
  byCustomer: (customerId: string) =>
    request<StorageRecordResponse[]>(`/api/v1/storage/customer/${customerId}`),
  start: (firearmId: string, body: StartStorageRequest) =>
    request<void>(`/api/v1/firearms/${firearmId}/storage`, {
      method: "POST",
      body,
    }),
  update: (id: string, body: UpdateStorageRecordRequest) =>
    request<void>(`/api/v1/storage-records/${id}`, { method: "PATCH", body }),
};
