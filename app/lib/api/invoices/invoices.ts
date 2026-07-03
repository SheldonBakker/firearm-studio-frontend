import { request } from "../http";
import { normalizePage } from "../shared/pagination";
import type {
  InvoiceDetailDto,
  InvoiceListItemDtoPaginatedResponse,
  RecordPaymentRequest,
} from "./types";

interface InvoiceListParams {
  pageNumber?: number;
  pageSize?: number;
}

async function list(
  params: InvoiceListParams = {},
): Promise<InvoiceListItemDtoPaginatedResponse> {
  const response = await request<InvoiceListItemDtoPaginatedResponse>(
    "/api/v1/invoices",
    {
      query: {
        pageNumber: params.pageNumber,
        pageSize: params.pageSize,
      },
    },
  );
  return normalizePage(response, params);
}

export const invoicesApi = {
  list,
  get: (id: string) => request<InvoiceDetailDto>(`/api/v1/invoices/${id}`),
  send: (id: string) =>
    request<void>(`/api/v1/invoices/${id}/send`, { method: "POST" }),
  recordPayment: (id: string, body: RecordPaymentRequest) =>
    request<void>(`/api/v1/invoices/${id}/payments`, { method: "POST", body }),
  cancel: (id: string) =>
    request<void>(`/api/v1/invoices/${id}/cancel`, { method: "PATCH" }),
};
