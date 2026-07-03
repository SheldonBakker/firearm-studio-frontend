import type {
  CustomerType,
  FirearmStatus,
  InvoiceStatus,
  StorageStatus,
} from "~/lib/types/enums";
import type { PaginatedResponse } from "../shared/pagination";

export interface CustomerResponse {
  id: string;
  customerType: CustomerType;
  fullName: string | null;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
}

export interface CustomerListItemDto {
  id: string;
  customerType: CustomerType;
  fullName: string | null;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
}

export type CustomerListItemDtoPaginatedResponse =
  PaginatedResponse<CustomerListItemDto>;

export interface CreateCustomerRequest {
  customerType: CustomerType;
  fullName?: string | null;
  companyName?: string | null;
  registrationNumber?: string | null;
  vatNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  notes?: string | null;
}

export interface UpdateCustomerRequest {
  fullName?: string | null;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  isActive?: boolean | null;
}

export interface CustomerFirearmListItemDto {
  id: string;
  make: string | null;
  model: string | null;
  serialNumber: string | null;
  status: FirearmStatus;
}

export interface CustomerInvoiceListItemDto {
  id: string;
  invoiceNumber: string | null;
  invoiceMonth: string;
  total: number;
  status: InvoiceStatus;
}

export interface CustomerStorageRecordDto {
  id: string;
  firearmId: string;
  monthlyRate: number;
  storageStatus: StorageStatus;
  storedFrom: string;
  storedUntil: string | null;
}

export interface CustomerDetailResponse {
  id: string;
  customerType: CustomerType;
  fullName: string | null;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
  firearms: CustomerFirearmListItemDto[] | null;
  invoices: CustomerInvoiceListItemDto[] | null;
  storageRecords: CustomerStorageRecordDto[] | null;
}
