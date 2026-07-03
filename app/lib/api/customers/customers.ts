import { request } from "../http";
import { normalizePage } from "../shared/pagination";
import type {
  CreateCustomerRequest,
  CustomerDetailResponse,
  CustomerListItemDto,
  CustomerListItemDtoPaginatedResponse,
  CustomerResponse,
  UpdateCustomerRequest,
} from "./types";

interface CustomerListParams {
  pageNumber?: number;
  pageSize?: number;
  sortOrder?: string;
  name?: string;
  email?: string;
  phone?: string;
}

async function list(
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
  return normalizePage(response, params);
}

async function all(): Promise<CustomerListItemDto[]> {
  const pageSize = 100;
  const firstPage = await list({ pageNumber: 1, pageSize });
  const customers = [...(firstPage.items ?? [])];
  const totalPages = Math.ceil(
    firstPage.totalCount / Math.max(1, firstPage.pageSize),
  );

  for (let pageNumber = 2; pageNumber <= totalPages; pageNumber += 1) {
    const page = await list({ pageNumber, pageSize });
    customers.push(...(page.items ?? []));
  }

  return customers;
}

export const customersApi = {
  list,
  all,
  get: (id: string) =>
    request<CustomerDetailResponse>(`/api/v1/customers/${id}`),
  create: (body: CreateCustomerRequest) =>
    request<CustomerResponse>("/api/v1/customers", { method: "POST", body }),
  update: (id: string, body: UpdateCustomerRequest) =>
    request<void>(`/api/v1/customers/${id}`, { method: "PATCH", body }),
};
