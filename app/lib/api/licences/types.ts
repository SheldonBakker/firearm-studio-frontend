import type {
  CustomerType,
  FirearmStatus,
  LicenceStatus,
} from "~/lib/types/enums";
import type { PaginatedResponse } from "../shared/pagination";

export interface CreateLicenceRequest {
  licenceNumber?: string | null;
  issuedOn?: string | null;
  expiresOn: string;
  documentUrl?: string | null;
}

export interface UpdateLicenceRequest {
  licenceNumber?: string | null;
  issuedOn?: string | null;
  expiresOn?: string | null;
  status?: LicenceStatus;
  documentUrl?: string | null;
}

export interface LicenceResponse {
  id: string;
  firearmId?: string | null;
  licenceNumber?: string | null;
  issuedOn?: string | null;
  expiresOn?: string | null;
  renewalDueOn?: string | null;
  status?: LicenceStatus | string | null;
  documentUrl?: string | null;
  [k: string]: unknown;
}

interface LicenceFirearmDto {
  id: string;
  make: string | null;
  model: string | null;
  calibre: string | null;
  firearmType: string | null;
  serialNumber: string | null;
  status: FirearmStatus;
}

interface LicenceCustomerDto {
  id: string;
  customerType: CustomerType;
  fullName: string | null;
  companyName: string | null;
  email: string | null;
  phone: string | null;
}

export interface LicenceDetailDto {
  id: string;
  firearmId: string;
  licenceNumber: string | null;
  issuedOn: string | null;
  expiresOn: string;
  renewalDueOn: string;
  status: LicenceStatus;
  documentUrl: string | null;
  firearm: LicenceFirearmDto | null;
  customer: LicenceCustomerDto | null;
}

export type LicenceListItemDtoPaginatedResponse =
  PaginatedResponse<LicenceResponse>;
