import { CustomerType, InvoiceStatus, enumKey } from "../types/enums";
import type { InvoiceResponse } from "../api/invoices/types";
type CustomerDisplay = {
  customerType: CustomerType;
  fullName?: string | null;
  companyName?: string | null;
};

type FirearmDisplay = {
  make?: string | null;
  model?: string | null;
};

export function customerLabel(c: CustomerDisplay | undefined | null): string {
  if (!c) return "—";
  if (c.customerType === CustomerType.Company) {
    return c.companyName || c.fullName || "Unnamed";
  }
  return c.fullName || c.companyName || "Unnamed";
}

export function firearmLabel(f: FirearmDisplay | undefined | null): string {
  if (!f) return "—";
  return `${f.make ?? ""} ${f.model ?? ""}`.trim() || "Firearm";
}

export function customerNameMap(
  customers: (CustomerDisplay & { id: string })[],
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const c of customers) map[c.id] = customerLabel(c);
  return map;
}

export const inv = {
  number: (i: InvoiceResponse) =>
    i.number ?? (i.invoiceNumber as string) ?? i.id.slice(0, 8),
  customerId: (i: InvoiceResponse) =>
    i.customerId ?? (i.customer_id as string) ?? "",
  total: (i: InvoiceResponse) =>
    (i.total ?? (i.totalAmount as number) ?? 0) as number,
  subtotal: (i: InvoiceResponse) =>
    (i.subtotal ?? (i.subTotal as number) ?? 0) as number,
  vat: (i: InvoiceResponse) =>
    (i.vatAmount ?? (i.vat as number) ?? 0) as number,
  status: (i: InvoiceResponse): string =>
    enumKey(InvoiceStatus, i.status) ?? "Draft",
  month: (i: InvoiceResponse) =>
    i.invoiceMonth ?? (i.month as string) ?? "—",
  dueOn: (i: InvoiceResponse) => i.dueOn ?? (i.dueDate as string) ?? null,
  issuedOn: (i: InvoiceResponse) =>
    i.issuedOn ?? (i.issuedDate as string) ?? null,
};
