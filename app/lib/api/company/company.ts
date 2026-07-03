import { request } from "../http";
import type {
  CompanyDetailsResponse,
  CreateCompanyRequest,
  UpdateCompanyRequest,
} from "./types";

export const companyApi = {
  get: () => request<CompanyDetailsResponse>("/api/v1/company"),
  update: (body: UpdateCompanyRequest) =>
    request<void>("/api/v1/company", { method: "PATCH", body }),
  // Onboarding — creates the caller's company on first setup.
  createOnboarding: (body: CreateCompanyRequest) =>
    request<void>("/api/v1/onboarding/company", { method: "POST", body }),
};
