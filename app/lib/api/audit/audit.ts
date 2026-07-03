import { request } from "../http";
import type {
  AuditLogListItemDtoPaginatedResponse,
  AuditLogResponse,
} from "./types";

interface AuditLogListParams {
  pageNumber?: number;
  pageSize?: number;
  fullName?: string;
  action?: string;
  entityType?: string;
  createdOn?: string;
  take?: number;
}

async function list(
  params: AuditLogListParams = {},
): Promise<AuditLogListItemDtoPaginatedResponse> {
  const response = await request<
    AuditLogListItemDtoPaginatedResponse | AuditLogResponse[]
  >("/api/v1/audit-logs", {
    query: {
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
      fullName: params.fullName,
      action: params.action,
      entityType: params.entityType,
      createdOn: params.createdOn,
      take: params.take,
    },
  });

  if (Array.isArray(response)) {
    return {
      items: response,
      pageNumber: params.pageNumber ?? 1,
      pageSize: params.pageSize ?? params.take ?? response.length,
      totalCount: response.length,
    };
  }

  return {
    items: Array.isArray(response?.items) ? response.items : [],
    pageNumber: response?.pageNumber ?? params.pageNumber ?? 1,
    pageSize: response?.pageSize ?? params.pageSize ?? 20,
    totalCount: response?.totalCount ?? 0,
  };
}

export const auditApi = {
  list,
};
