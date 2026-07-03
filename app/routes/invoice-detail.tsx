import { useState } from "react";
import { useNavigate, useRevalidator } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/invoice-detail";
import { ApiError } from "~/lib/api/http";
import { invoicesApi } from "~/lib/api/invoices/invoices";
import { customerLabel } from "~/lib/utils/entities";
import { fmtDate, fmtMoney } from "~/lib/utils/format";
import { useSessionUser } from "~/context/auth-context";
import { can } from "~/lib/utils/rbac";
import { PageWrap, BackLink, SectionTitle } from "~/components/common/misc";
import { PageHeader } from "~/components/common/page-header";
import { StatusBadge } from "~/components/common/status-badge";
import { KeyValue } from "~/components/common/key-value";
import { DataTable } from "~/components/common/data-table";
import { Mono } from "~/components/common/mono";
import { Icon } from "~/components/common/icon";
import { Button } from "~/components/ui/button";
import { FormDialog } from "~/components/modals/form-dialog";
import { Resolve, DetailSkeleton } from "~/components/common/skeletons";
import {
  CustomerType,
  InvoiceStatus,
  PaymentMethod,
  enumKey,
  enumNames,
} from "~/lib/types/enums";
import type {
  InvoiceDetailDto,
  InvoiceLineDto,
  InvoicePaymentDto,
} from "~/lib/api/invoices/types";

const invoiceNumber = (invoice: InvoiceDetailDto) =>
  invoice.invoiceNumber ?? invoice.id.slice(0, 8);

export function clientLoader({ params }: Route.ClientLoaderArgs) {
  return { data: invoicesApi.get(params.id) };
}

const METHODS = enumNames(PaymentMethod);

export default function InvoiceDetail({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  return (
    <PageWrap>
      <BackLink label="Back to invoices" onClick={() => navigate("/invoices")} />
      <Resolve resolve={loaderData.data} fallback={<DetailSkeleton />}>
        {(invoice) => <InvoiceView invoice={invoice} />}
      </Resolve>
    </PageWrap>
  );
}

function InvoiceView({ invoice }: { invoice: InvoiceDetailDto }) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const user = useSessionUser();
  const writable = can(user, "invoices:write");
  const [payOpen, setPayOpen] = useState(false);
  const customer = invoice.customer;
  const payments = invoice.payments ?? [];
  const lines = invoice.lines ?? [];
  const status = enumKey(InvoiceStatus, invoice.status) ?? "Draft";
  const isPaid = invoice.status === InvoiceStatus.Paid;

  async function send() {
    try {
      await invoicesApi.send(invoice.id);
      toast.success("Invoice sent");
      revalidator.revalidate();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not send");
    }
  }
  async function cancel() {
    try {
      await invoicesApi.cancel(invoice.id);
      toast.success("Invoice cancelled");
      revalidator.revalidate();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not cancel");
    }
  }

  return (
    <>
      <PageHeader
        title={invoiceNumber(invoice)}
        subtitle={
          <span className="flex items-center gap-2">
            <StatusBadge status={status} />
            {customer && (
              <button
                onClick={() => navigate(`/customers/${customer.id}`)}
                className="hover:text-foreground"
              >
                · {customerLabel(customer)}
              </button>
            )}
          </span>
        }
        actions={
          writable &&
          !isPaid && (
            <>
              <Button variant="ghost" onClick={() => setPayOpen(true)}>
                <Icon name="money" size={16} />
                Record payment
              </Button>
              <Button variant="ghost" onClick={send}>
                <Icon name="send" size={16} />
                Send
              </Button>
              <Button variant="ghost" onClick={cancel}>
                Cancel invoice
              </Button>
            </>
          )
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.4fr]">
        <div className="rounded-2xl border border-border bg-card p-6">
          <SectionTitle>Summary</SectionTitle>
          <KeyValue
            pairs={[
              {
                k: "Invoice",
                v: <Mono>{invoiceNumber(invoice)}</Mono>,
                strong: true,
              },
              { k: "Month", v: <Mono>{invoice.invoiceMonth ?? "—"}</Mono> },
              { k: "Sent", v: fmtDate(invoice.sentAt) },
              { k: "Due", v: fmtDate(invoice.dueOn) },
              { k: "Subtotal", v: fmtMoney(invoice.subtotal) },
              { k: "VAT", v: fmtMoney(invoice.vatAmount) },
              {
                k: "Total",
                v: <span className="text-base">{fmtMoney(invoice.total)}</span>,
                strong: true,
                full: true,
              },
            ]}
          />
        </div>

        <div>
          <SectionTitle>Items</SectionTitle>
          <DataTable<InvoiceLineDto>
            rows={lines}
            empty="No line items."
            columns={[
              {
                key: "description",
                header: "Description",
                cell: (r) => (
                  <span className="text-[12.5px] text-foreground">
                    {r.description ?? "—"}
                  </span>
                ),
              },
              {
                key: "qty",
                header: "Qty",
                align: "right",
                cell: (r) => (
                  <Mono className="text-[12.5px] text-muted-foreground">
                    {r.quantity ?? "—"}
                  </Mono>
                ),
              },
              {
                key: "unit",
                header: "Unit price",
                align: "right",
                cell: (r) => (
                  <Mono className="text-[12.5px] text-muted-foreground">
                    {fmtMoney(r.unitPrice)}
                  </Mono>
                ),
              },
              {
                key: "lineTotal",
                header: "Total",
                align: "right",
                cell: (r) => (
                  <Mono className="text-[12.5px] font-semibold text-foreground">
                    {fmtMoney(r.lineTotal)}
                  </Mono>
                ),
              },
            ]}
          />
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
          <SectionTitle
            right={
              customer && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/customers/${customer.id}`)}
                >
                  View customer
                  <Icon name="arrow" size={14} />
                </Button>
              )
            }
          >
            Customer
          </SectionTitle>
          {customer ? (
            <KeyValue
              pairs={[
                { k: "Name", v: customerLabel(customer), strong: true },
                {
                  k: "Type",
                  v: enumKey(CustomerType, customer.customerType) ?? "—",
                },
                { k: "Full name", v: customer.fullName || "—" },
                { k: "Company", v: customer.companyName || "—" },
                { k: "Email", v: customer.email || "—" },
                { k: "Phone", v: customer.phone || "—" },
                { k: "Status", v: customer.isActive ? "Active" : "Inactive" },
                { k: "Notes", v: customer.notes || "—", full: true },
              ]}
            />
          ) : (
            <p className="text-[12.5px] text-muted-foreground">
              Customer details unavailable.
            </p>
          )}
        </div>

        <div className="lg:col-span-2">
          <SectionTitle>Payments</SectionTitle>
          <DataTable<InvoicePaymentDto>
            rows={payments}
            empty="No payments recorded."
            columns={[
              {
                key: "amt",
                header: "Amount",
                cell: (r) => (
                  <Mono className="text-[12.5px] font-semibold text-foreground">
                    {fmtMoney(r.amount)}
                  </Mono>
                ),
              },
              {
                key: "on",
                header: "Paid on",
                cell: (r) => (
                  <span className="text-[12.5px] text-muted-foreground">
                    {fmtDate(r.paidOn)}
                  </span>
                ),
              },
              {
                key: "method",
                header: "Method",
                cell: (r) => (
                  <span className="text-[12.5px] text-muted-foreground">
                    {enumKey(PaymentMethod, r.method) ?? "—"}
                  </span>
                ),
              },
              {
                key: "ref",
                header: "Reference",
                align: "right",
                cell: (r) => (
                  <Mono className="text-[12px] text-dim">
                    {r.reference ?? "—"}
                  </Mono>
                ),
              },
            ]}
          />
        </div>
      </div>

      <FormDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        title="Record payment"
        description={`Apply a payment against ${invoiceNumber(invoice)}.`}
        submitLabel="Record payment"
        fields={[
          { name: "amount", label: "Amount", type: "number", required: true },
          { name: "paidOn", label: "Paid on", type: "date" },
          {
            name: "method",
            label: "Method",
            type: "select",
            required: true,
            defaultValue: "Eft",
            options: METHODS.map((m) => ({ value: m, label: m })),
          },
          { name: "reference", label: "Reference", required: true, full: true },
          { name: "notes", label: "Notes", type: "textarea", full: true },
        ]}
        onSubmit={async (v) => {
          await invoicesApi.recordPayment(invoice.id, {
            amount: Number(v.amount || 0),
            paidOn: v.paidOn || null,
            method: PaymentMethod[v.method as keyof typeof PaymentMethod],
            reference: v.reference || null,
            notes: v.notes || null,
          });
          toast.success("Payment recorded");
          revalidator.revalidate();
        }}
      />
    </>
  );
}
