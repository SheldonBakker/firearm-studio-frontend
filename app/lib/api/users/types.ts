import type { AppRole } from "~/lib/types/enums";
import type { PaginatedResponse } from "../shared/pagination";

export type Role = "Admin" | "Manager" | "Staff" | "Viewer";

export interface InviteUserRequest {
  email?: string | null;
  fullName?: string | null;
  role?: AppRole | null;
  phoneNumber?: string | null;
}

export interface UpdateUserRoleRequest {
  role?: AppRole | null;
}

export interface UserResponse {
  id: string;
  email: string;
  fullName: string | null;
  role: AppRole | string;
  isActive: boolean;
  isLinked: boolean;
  phoneNumber: string | null;
  [k: string]: unknown;
}

export type AppUserResponsePaginatedResponse = PaginatedResponse<UserResponse>;
