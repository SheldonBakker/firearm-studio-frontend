import type { InvoiceStatus, PaymentMethod } from "~/lib/types/enums";
import type { CustomerResponse } from "../customers/types";
import type { PaginatedResponse } from "../shared/pagination";

export interface RecordPaymentRequest {
  amount: number;
  paidOn?: string | null;
  method: PaymentMethod;
  reference?: string | null;
  notes?: string | null;
}

interface InvoiceLineResponse {
  id: string;
  description?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  lineTotal?: number | null;
  [k: string]: unknown;
}

interface PaymentResponse {
  amount?: number | null;
  paidOn?: string | null;
  method?: string | null;
  reference?: string | null;
  [k: string]: unknown;
}

export interface InvoiceResponse {
  id: string;
  number?: string | null;
  customerId?: string | null;
  invoiceMonth?: string | null;
  subtotal?: number | null;
  vatAmount?: number | null;
  total?: number | null;
  status?: InvoiceStatus | null;
  dueOn?: string | null;
  issuedOn?: string | null;
  lines?: InvoiceLineResponse[] | null;
  payments?: PaymentResponse[] | null;
  [k: string]: unknown;
}

export interface InvoiceLineDto {
  id: string;
  description: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface InvoicePaymentDto {
  id: string;
  amount: number;
  paidOn: string;
  method: PaymentMethod;
  reference: string | null;
}

export interface InvoiceDetailDto {
  id: string;
  customerId: string;
  invoiceNumber: string | null;
  invoiceMonth: string;
  subtotal: number;
  vatAmount: number;
  total: number;
  status: InvoiceStatus;
  sentAt: string | null;
  dueOn: string | null;
  customer: CustomerResponse | null;
  lines: InvoiceLineDto[] | null;
  payments: InvoicePaymentDto[] | null;
}

export type InvoiceListItemDtoPaginatedResponse =
  PaginatedResponse<InvoiceResponse>;
