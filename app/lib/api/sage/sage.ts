import { request } from "../http";
import type {
  RegisterSageConnectionRequest,
  SageConnectionDetailsResponse,
  SageConnectionResponse,
} from "./types";

export const sageApi = {
  connection: () =>
    request<SageConnectionDetailsResponse>("/api/v1/sage/connections"),
  register: (body: RegisterSageConnectionRequest) =>
    request<SageConnectionResponse>("/api/v1/sage/register", {
      method: "POST",
      body,
    }),
};
