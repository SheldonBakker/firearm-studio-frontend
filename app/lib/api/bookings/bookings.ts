import { request } from "../http";
import { normalizePage } from "../shared/pagination";
import type { BookingStatus } from "~/lib/types/enums";
import type {
  BookingCalendarItemDto,
  BookingListItemDtoPaginatedResponse,
  BookingResponse,
  CreateBookingRequest,
} from "./types";

interface BookingListParams {
  pageNumber?: number;
  pageSize?: number;
  sortOrder?: string;
  rangeId?: string;
  status?: BookingStatus | string | number;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
}

async function list(
  params: BookingListParams = {},
): Promise<BookingListItemDtoPaginatedResponse> {
  const response = await request<BookingListItemDtoPaginatedResponse>(
    "/api/v1/bookings",
    {
      query: {
        pageNumber: params.pageNumber,
        pageSize: params.pageSize,
        sortOrder: params.sortOrder,
        rangeId: params.rangeId,
        status:
          params.status !== undefined ? String(params.status) : undefined,
        customerId: params.customerId,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
      },
    },
  );
  return normalizePage(response, params);
}

export const bookingsApi = {
  list,
  get: (id: string) => request<BookingResponse>(`/api/v1/bookings/${id}`),
  create: (body: CreateBookingRequest) =>
    request<BookingResponse>("/api/v1/bookings", { method: "POST", body }),
  calendar: (params: { year: number; month: number; rangeId?: string }) =>
    request<BookingCalendarItemDto[]>("/api/v1/bookings/calendar", {
      query: params,
    }),
  confirm: (id: string) =>
    request<void>(`/api/v1/bookings/${id}/confirm`, { method: "POST" }),
  cancel: (id: string) =>
    request<void>(`/api/v1/bookings/${id}/cancel`, { method: "POST" }),
  complete: (id: string) =>
    request<void>(`/api/v1/bookings/${id}/complete`, { method: "POST" }),
  noShow: (id: string) =>
    request<void>(`/api/v1/bookings/${id}/no-show`, { method: "POST" }),
};
