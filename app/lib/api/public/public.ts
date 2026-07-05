import { request } from "../http";
import type {
  CreatePublicBookingRequest,
  DayAvailabilityResponse,
  MonthAvailabilityResponse,
  PublicBookingConfirmationResponse,
  PublicBookingOptionsResponse,
} from "./types";

const base = (companyId: string) => `/api/v1/public/companies/${companyId}`;

export const publicBookingsApi = {
  options: (companyId: string) =>
    request<PublicBookingOptionsResponse>(`${base(companyId)}/bookings`, {
      skipAuthRedirect: true,
    }),

  monthAvailability: (
    companyId: string,
    rangeId: string,
    params: { packageId: string; year: number; month: number },
  ) =>
    request<MonthAvailabilityResponse>(
      `${base(companyId)}/ranges/${rangeId}/availability/month`,
      { query: params, skipAuthRedirect: true },
    ),

  dayAvailability: (
    companyId: string,
    rangeId: string,
    params: { packageId: string; date: string },
  ) =>
    request<DayAvailabilityResponse>(
      `${base(companyId)}/ranges/${rangeId}/availability`,
      { query: params, skipAuthRedirect: true },
    ),

  createBooking: (companyId: string, body: CreatePublicBookingRequest) =>
    request<PublicBookingConfirmationResponse>(`${base(companyId)}/bookings`, {
      method: "POST",
      body,
      skipAuthRedirect: true,
    }),
};
