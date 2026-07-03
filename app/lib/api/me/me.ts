import { request } from "../http";
import type { AdminCheckResponse, CurrentUserResponse } from "./types";

export const meApi = {
  me: () => request<CurrentUserResponse>("/api/v1/me"),
  adminCheck: () => request<AdminCheckResponse>("/api/v1/me/admin-check"),
};
