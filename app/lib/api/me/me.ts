import { request } from "../http";
import type { AdminCheckResponse, CurrentUserResponse } from "./types";

export const meApi = {
  me: () => request<CurrentUserResponse>("/api/v1/me"),
  adminCheck: () => request<AdminCheckResponse>("/api/v1/me/admin-check"),

  enableTwoFactor: () =>
    request<void>("/api/v1/auth/two-factor/enable", { method: "POST" }),

  disableTwoFactor: (password: string) =>
    request<void>("/api/v1/auth/two-factor/disable", {
      method: "POST",
      body: { password },
    }),

};
