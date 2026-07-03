import { request } from "../http";
import { normalizePage } from "../shared/pagination";
import type {
  AppUserResponsePaginatedResponse,
  InviteUserRequest,
  UpdateUserRoleRequest,
} from "./types";

interface UserListParams {
  pageNumber?: number;
  pageSize?: number;
}

async function list(
  params: UserListParams = {},
): Promise<AppUserResponsePaginatedResponse> {
  const response = await request<AppUserResponsePaginatedResponse>(
    "/api/v1/users",
    {
      query: {
        pageNumber: params.pageNumber,
        pageSize: params.pageSize,
      },
    },
  );
  return normalizePage(response, params);
}

export const usersApi = {
  list,
  invite: (body: InviteUserRequest) =>
    request<void>("/api/v1/users/invite", { method: "POST", body }),
  updateRole: (id: string, body: UpdateUserRoleRequest) =>
    request<void>(`/api/v1/users/${id}/role`, { method: "PATCH", body }),
  deactivate: (id: string) =>
    request<void>(`/api/v1/users/${id}/deactivate`, { method: "PATCH" }),
};
