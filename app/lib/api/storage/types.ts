import type { StorageStatus } from "~/lib/types/enums";
import type { PaginatedResponse } from "../shared/pagination";

export interface StartStorageRequest {
  storedFrom: string;
  monthlyRate: number;
  storageLocation?: string | null;
  rackNumber?: string | null;
  safeNumber?: string | null;
  notes?: string | null;
}

export interface UpdateStorageRecordRequest {
  storedFrom?: string | null;
  storedUntil?: string | null;
  monthlyRate?: number | null;
  storageStatus?: StorageStatus;
  storageLocation?: string | null;
  rackNumber?: string | null;
  safeNumber?: string | null;
  notes?: string | null;
}

export interface StorageRecordResponse {
  id: string;
  firearmId?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  serialNumber?: string | null;
  storageStatus?: StorageStatus | null;
  monthlyRate?: number | null;
  storageLocation?: string | null;
  rackNumber?: string | null;
  safeNumber?: string | null;
  storedFrom?: string | null;
  storedUntil?: string | null;
  isActive?: boolean | null;
  [k: string]: unknown;
}

export type StorageRecordDtoPaginatedResponse =
  PaginatedResponse<StorageRecordResponse>;
