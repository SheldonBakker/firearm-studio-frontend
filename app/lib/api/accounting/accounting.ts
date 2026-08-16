import { request } from "../http";
import type {
  AccountingConnectionDetailsResponse,
  AccountingConnectionResponse,
  RegisterAccountingConnectionRequest,
} from "./types";

export const accountingApi = {
  connection: () =>
    request<AccountingConnectionDetailsResponse>(
      "/api/v1/accounting/connections",
    ),
  register: (body: RegisterAccountingConnectionRequest) =>
    request<AccountingConnectionResponse>("/api/v1/accounting/register", {
      method: "POST",
      body,
    }),
};
