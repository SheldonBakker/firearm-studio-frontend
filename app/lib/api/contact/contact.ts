import { request } from "../http";
import type { ContactFormRequest } from "./types";

export const contactApi = {
  submit: (body: ContactFormRequest) =>
    request<void>("/api/v1/contact", {
      method: "POST",
      body,
      skipAuthRedirect: true,
    }),
};
