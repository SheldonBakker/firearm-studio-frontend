import type {
  BookingSource,
  BookingStatus,
  FirearmOrigin,
} from "~/lib/types/enums";
import type { PaginatedResponse } from "../shared/pagination";

export interface BookingListItemDto {
  id: string;
  bookingNumber: string | null;
  shootingRangeId: string;
  rangeName: string | null;
  packageName: string | null;
  packagePrice: number;
  customerId: string;
  customerName: string | null;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  source: BookingSource;
}

export interface BookingResponse {
  id: string;
  bookingNumber: string | null;
  shootingRangeId: string;
  rangeName: string | null;
  packageId: string;
  packageName: string | null;
  packagePrice: number;
  customerId: string;
  customerName: string | null;
  invoiceId: string | null;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  source: BookingSource;
  shooterCount: number;
  notes: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  checkedInAt: string | null;
  reminderSentAt: string | null;
}

export interface CreateBookingRequest {
  shootingRangeId: string;
  packageId: string;
  customerId: string;
  bookingDate: string;
  startTime: string;
  shooterCount: number;
  notes?: string | null;
  confirmImmediately: boolean;
}

export interface BookingCalendarItemDto {
  id: string;
  bookingNumber: string | null;
  shootingRangeId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  customerName: string | null;
}

export type BookingListItemDtoPaginatedResponse =
  PaginatedResponse<BookingListItemDto>;

export interface AttendeeRequest {
  fullName: string;
  idNumber: string;
  licenceNumber?: string | null;
  firearmMakeModel?: string | null;
  firearmSerialNumber?: string | null;
  calibre?: string | null;
  firearmOrigin: FirearmOrigin;
  signedIndemnity: boolean;
  notes?: string | null;
}

export interface AttendeeResponse {
  id: string;
  bookingId: string;
  fullName: string;
  idNumber: string;
  licenceNumber: string | null;
  firearmMakeModel: string | null;
  firearmSerialNumber: string | null;
  calibre: string | null;
  firearmOrigin: FirearmOrigin;
  signedIndemnity: boolean;
  notes: string | null;
  createdAt: string;
}

export type UpdateAttendeeRequest = Partial<AttendeeRequest>;

export interface CheckInBookingRequest {
  attendees: AttendeeRequest[];
}
