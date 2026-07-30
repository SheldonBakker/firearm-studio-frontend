import { request, requestBlob } from "../http";
import { normalizePage } from "../shared/pagination";
import { downloadBlob } from "../shared/download";
import type {
  RegisterRowDtoPaginatedResponse,
} from "./types";

export interface RegisterListParams {
  pageNumber?: number;
  pageSize?: number;
  dateFrom?: string;
  dateTo?: string;
  rangeId?: string;
}

export type RegisterExportParams = Omit<
  RegisterListParams,
  "pageNumber" | "pageSize"
>;

async function list(
  params: RegisterListParams = {},
): Promise<RegisterRowDtoPaginatedResponse> {
  const response = await request<RegisterRowDtoPaginatedResponse>(
    "/api/v1/bookings/register",
    {
      query: {
        pageNumber: params.pageNumber,
        pageSize: params.pageSize,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        rangeId: params.rangeId,
      },
    },
  );
  return normalizePage(response, params);
}

async function exportCsv(params: RegisterExportParams = {}): Promise<void> {
  const { blob, filename } = await requestBlob(
    "/api/v1/bookings/register/export",
    {
      query: {
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        rangeId: params.rangeId,
      },
    },
  );

  downloadBlob(blob, filename ?? "range-register.csv");
}

export const registerApi = {
  list,
  exportCsv,
};
