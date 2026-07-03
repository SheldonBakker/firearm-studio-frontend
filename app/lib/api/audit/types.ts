import type { AppRole } from "~/lib/types/enums";
import type { PaginatedResponse } from "../shared/pagination";

interface AuditLogUserDto {
  id: string;
  fullName?: string | null;
  email?: string | null;
  role?: AppRole | string | null;
}

export interface AuditLogResponse {
  id: string;
  entityType: string | null;
  entityId: string;
  action: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
  user?: AuditLogUserDto | null;
}

export type AuditLogListItemDtoPaginatedResponse =
  PaginatedResponse<AuditLogResponse>;
