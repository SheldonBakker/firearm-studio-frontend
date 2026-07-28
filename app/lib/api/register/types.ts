import type { FirearmOrigin } from "~/lib/types/enums";
import type { PaginatedResponse } from "../shared/pagination";

export interface RegisterRowDto {
  bookingDate: string;
  startTime: string;
  endTime: string;
  rangeName: string | null;
  bookingNumber: string | null;
  customerName: string | null;
  attendeeFullName: string | null;
  attendeeIdNumber: string | null;
  licenceNumber: string | null;
  firearmMakeModel: string | null;
  firearmSerialNumber: string | null;
  calibre: string | null;
  firearmOrigin: FirearmOrigin;
  signedIndemnity: boolean;
  checkedInAt: string | null;
}

export type RegisterRowDtoPaginatedResponse = PaginatedResponse<RegisterRowDto>;
