import type { FirearmStatus, LicenceStatus } from "~/lib/types/enums";
import type { CustomerResponse } from "../customers/types";
import type { PaginatedResponse } from "../shared/pagination";

export interface FirearmResponse {
  id: string;
  customerId: string;
  make: string | null;
  model: string | null;
  calibre: string | null;
  firearmType: string | null;
  serialNumber: string | null;
  status: FirearmStatus;
  notes: string | null;
}

export interface FirearmLicenceListItemDto {
  id: string;
  licenceNumber: string | null;
  issuedOn: string | null;
  expiresOn: string;
  renewalDueOn: string;
  status: LicenceStatus;
}

export interface FirearmDetailResponse {
  id: string;
  customer: CustomerResponse | null;
  make: string | null;
  model: string | null;
  calibre: string | null;
  firearmType: string | null;
  serialNumber: string | null;
  status: FirearmStatus;
  notes: string | null;
  licences: FirearmLicenceListItemDto[] | null;
}

export interface CreateFirearmRequest {
  customerId: string;
  make?: string | null;
  model?: string | null;
  calibre?: string | null;
  firearmType?: string | null;
  serialNumber?: string | null;
  internalReference?: string | null;
  notes?: string | null;
}

export interface UpdateFirearmRequest {
  model?: string | null;
  calibre?: string | null;
  firearmType?: string | null;
  notes?: string | null;
  status?: FirearmStatus;
}

export type FirearmResponsePaginatedResponse =
  PaginatedResponse<FirearmResponse>;
