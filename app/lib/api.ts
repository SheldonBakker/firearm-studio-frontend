import { getAccessToken, supabase } from "./supabase";
import type {
  AdminCheckResponse,
  AuditLogResponse,
  CompanyDetailsResponse,
  CreateCompanyRequest,
  CreateCustomerRequest,
  CreateFirearmRequest,
  CreateLicenceRequest,
  CurrentUserResponse,
  CustomerListItemDto,
  CustomerListItemDtoPaginatedResponse,
  CustomerResponse,
  FirearmResponse,
  GenerateMonthlyInvoicesRequest,
  InvoiceResponse,
  InviteUserRequest,
  LicenceResponse,
  RecordPaymentRequest,
  ReleaseStorageRequest,
  StartStorageRequest,
  StorageRecordResponse,
  UpdateCompanyRequest,
  UpdateCustomerRequest,
  UpdateFirearmRequest,
  UpdateLicenceRequest,
  UpdateUserRoleRequest,
  UserResponse,
} from "./api-types";

const BASE_URL = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ""
).replace(/\/$/, "");

const API_KEY = import.meta.env.VITE_API_KEY as string | undefined;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | undefined>;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const token = await getAccessToken();
  const url = new URL(BASE_URL + path, BASE_URL || window.location.origin);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (API_KEY) headers["X-Api-Key"] = API_KEY;
  if (token) headers.Authorization = `Bearer ${token}`;
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(url.toString(), {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 401) {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") window.location.assign("/login");
    throw new ApiError(401, "Unauthorized");
  }

  if (!res.ok) {
    let body: unknown;
    let message = `${res.status} ${res.statusText}`;
    try {
      body = await res.json();
      if (body && typeof body === "object") {
        const m =
          (body as Record<string, unknown>).detail ??
          (body as Record<string, unknown>).message ??
          (body as Record<string, unknown>).title;
        if (typeof m === "string") message = m;
      }
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, message, body);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

interface CustomerListParams {
  pageNumber?: number;
  pageSize?: number;
  sortOrder?: string;
  name?: string;
  email?: string;
  phone?: string;
}

async function getCustomers(
  params: CustomerListParams = {},
): Promise<CustomerListItemDtoPaginatedResponse> {
  const response = await request<CustomerListItemDtoPaginatedResponse>(
    "/api/v1/customers",
    {
      query: {
        pageNumber: params.pageNumber,
        pageSize: params.pageSize,
        sortOrder: params.sortOrder,
        name: params.name,
        email: params.email,
        phone: params.phone,
      },
    },
  );

  return {
    items: Array.isArray(response?.items) ? response.items : [],
    pageNumber: response?.pageNumber ?? params.pageNumber ?? 1,
    pageSize: response?.pageSize ?? params.pageSize ?? 20,
    totalCount: response?.totalCount ?? 0,
  };
}

async function getAllCustomers(): Promise<CustomerListItemDto[]> {
  const pageSize = 100;
  const firstPage = await getCustomers({ pageNumber: 1, pageSize });
  const customers = [...(firstPage.items ?? [])];
  const totalPages = Math.ceil(
    firstPage.totalCount / Math.max(1, firstPage.pageSize),
  );

  for (let pageNumber = 2; pageNumber <= totalPages; pageNumber += 1) {
    const page = await getCustomers({ pageNumber, pageSize });
    customers.push(...(page.items ?? []));
  }

  return customers;
}

export const api = {
  // ---- Me ----
  me: () => request<CurrentUserResponse>("/api/v1/me"),
  adminCheck: () => request<AdminCheckResponse>("/api/v1/me/admin-check"),

  // ---- Onboarding ----
  createCompany: (body: CreateCompanyRequest) =>
    request<void>("/api/v1/onboarding/company", { method: "POST", body }),

  // ---- Company ----
  company: () => request<CompanyDetailsResponse>("/api/v1/company"),
  updateCompany: (body: UpdateCompanyRequest) =>
    request<void>("/api/v1/company", { method: "PATCH", body }),

  // ---- Customers ----
  customers: getCustomers,
  allCustomers: getAllCustomers,
  customer: (id: string) =>
    request<CustomerResponse>(`/api/v1/customers/${id}`),
  createCustomer: (body: CreateCustomerRequest) =>
    request<CustomerResponse>("/api/v1/customers", { method: "POST", body }),
  updateCustomer: (id: string, body: UpdateCustomerRequest) =>
    request<void>(`/api/v1/customers/${id}`, { method: "PATCH", body }),
  customerFirearms: (id: string) =>
    request<FirearmResponse[]>(`/api/v1/customers/${id}/firearms`),
  customerInvoices: (id: string) =>
    request<InvoiceResponse[]>(`/api/v1/customers/${id}/invoices`),

  // ---- Firearms ----
  firearms: (params?: { serialNumber?: string; status?: string; customerName?: string }) =>
    request<FirearmResponse[]>("/api/v1/firearms", { query: params }),
  firearm: (id: string) => request<FirearmResponse>(`/api/v1/firearms/${id}`),
  createFirearm: (body: CreateFirearmRequest) =>
    request<FirearmResponse>("/api/v1/firearms", { method: "POST", body }),
  updateFirearm: (id: string, body: UpdateFirearmRequest) =>
    request<void>(`/api/v1/firearms/${id}`, { method: "PATCH", body }),
  firearmLicences: (id: string) =>
    request<LicenceResponse[]>(`/api/v1/firearms/${id}/licences`),
  // ---- Licences ----
  licencesDueRenewal: () =>
    request<LicenceResponse[]>("/api/v1/licences/due-renewal"),
  licencesExpired: () =>
    request<LicenceResponse[]>("/api/v1/licences/expired"),
  createLicence: (firearmId: string, body: CreateLicenceRequest) =>
    request<void>(`/api/v1/firearms/${firearmId}/licences`, {
      method: "POST",
      body,
    }),
  updateLicence: (id: string, body: UpdateLicenceRequest) =>
    request<void>(`/api/v1/licences/${id}`, { method: "PATCH", body }),

  // ---- Storage ----
  storageActive: (params?: { serialNumber?: string; customerName?: string; storageStatus?: string }) =>
    request<StorageRecordResponse[]>("/api/v1/storage/active", { query: params }),
  storageByCustomer: (customerId: string) =>
    request<StorageRecordResponse[]>(`/api/v1/storage/customer/${customerId}`),
  startStorage: (firearmId: string, body: StartStorageRequest) =>
    request<void>(`/api/v1/firearms/${firearmId}/storage`, {
      method: "POST",
      body,
    }),
  releaseStorage: (id: string, body: ReleaseStorageRequest) =>
    request<void>(`/api/v1/storage-records/${id}/release`, {
      method: "PATCH",
      body,
    }),

  // ---- Invoices ----
  invoices: () => request<InvoiceResponse[]>("/api/v1/invoices"),
  invoice: (id: string) => request<InvoiceResponse>(`/api/v1/invoices/${id}`),
  generateMonthlyInvoices: (body: GenerateMonthlyInvoicesRequest) =>
    request<void>("/api/v1/invoices/generate-monthly", { method: "POST", body }),
  sendInvoice: (id: string) =>
    request<void>(`/api/v1/invoices/${id}/send`, { method: "POST" }),
  recordPayment: (id: string, body: RecordPaymentRequest) =>
    request<void>(`/api/v1/invoices/${id}/payments`, { method: "POST", body }),
  cancelInvoice: (id: string) =>
    request<void>(`/api/v1/invoices/${id}/cancel`, { method: "PATCH" }),

  // ---- Users / Team ----
  users: () => request<UserResponse[]>("/api/v1/users"),
  inviteUser: (body: InviteUserRequest) =>
    request<void>("/api/v1/users/invite", { method: "POST", body }),
  updateUserRole: (id: string, body: UpdateUserRoleRequest) =>
    request<void>(`/api/v1/users/${id}/role`, { method: "PATCH", body }),
  deactivateUser: (id: string) =>
    request<void>(`/api/v1/users/${id}/deactivate`, { method: "PATCH" }),

  // ---- Audit ----
  auditLogs: (params?: { entityType?: string; take?: number }) =>
    request<AuditLogResponse[]>("/api/v1/audit-logs", { query: params }),
};
