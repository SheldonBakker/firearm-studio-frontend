import { request } from "../http";
import { normalizePage } from "../shared/pagination";
import type { InvoiceStatus } from "~/lib/types/enums";
import type {
  InvoiceDetailDto,
  InvoiceListItemDtoPaginatedResponse,
  RecordPaymentRequest,
} from "./types";

interface InvoiceListParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
  status?: InvoiceStatus | string | number;
  invoiceNumber?: string;
  customerName?: string;
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
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        status:
          params.status !== undefined ? String(params.status) : undefined,
        invoiceNumber: params.invoiceNumber,
        customerName: params.customerName,
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
