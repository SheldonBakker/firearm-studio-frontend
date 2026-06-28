import { useState } from "react";
import { useNavigate, useRevalidator } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/invoice-detail";
import { api, ApiError } from "~/lib/api";
import { customerLabel, inv } from "~/lib/entities";
import { fmtDate, fmtMoney } from "~/lib/format";
import { useSessionUser } from "./app-layout";
import { can } from "~/lib/rbac";
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
import type {
  CustomerResponse,
  InvoiceResponse,
  PaymentMethod,
  PaymentResponse,
} from "~/lib/api-types";

export function clientLoader({ params }: Route.ClientLoaderArgs) {
  const data = api.invoice(params.id).then(async (invoice) => {
    const cid = inv.customerId(invoice);
    const customer = cid ? await api.customer(cid).catch(() => null) : null;
    return { invoice, customer: customer as CustomerResponse | null };
  });
  return { data };
}

const METHODS: PaymentMethod[] = ["Eft", "Cash", "Card", "DebitOrder", "Other"];

export default function InvoiceDetail({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  return (
    <PageWrap>
      <BackLink label="Back to invoices" onClick={() => navigate("/invoices")} />
      <Resolve resolve={loaderData.data} fallback={<DetailSkeleton />}>
        {({ invoice, customer }) => (
          <InvoiceView invoice={invoice} customer={customer} />
        )}
      </Resolve>
    </PageWrap>
  );
}

function InvoiceView({
  invoice,
  customer,
}: {
  invoice: InvoiceResponse;
  customer: CustomerResponse | null;
}) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const user = useSessionUser();
  const writable = can(user, "invoices:write");
  const [payOpen, setPayOpen] = useState(false);
  const payments = (invoice.payments ?? []) as PaymentResponse[];

  async function send() {
    try {
      await api.sendInvoice(invoice.id);
      toast.success("Invoice sent");
      revalidator.revalidate();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not send");
    }
  }
  async function cancel() {
    try {
      await api.cancelInvoice(invoice.id);
      toast.success("Invoice cancelled");
      revalidator.revalidate();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not cancel");
    }
  }

  return (
    <>
      <PageHeader
        title={inv.number(invoice)}
        subtitle={
          <span className="flex items-center gap-2">
            <StatusBadge status={inv.status(invoice)} />
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
          writable && (
            <>
              {invoice.status !== "Paid" && (
                <Button variant="ghost" onClick={() => setPayOpen(true)}>
                  <Icon name="money" size={16} />
                  Record payment
                </Button>
              )}
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
              { k: "Invoice", v: <Mono>{inv.number(invoice)}</Mono>, strong: true },
              { k: "Month", v: <Mono>{inv.month(invoice)}</Mono> },
              { k: "Issued", v: fmtDate(inv.issuedOn(invoice)) },
              { k: "Due", v: fmtDate(inv.dueOn(invoice)) },
              { k: "Subtotal", v: fmtMoney(inv.subtotal(invoice)) },
              { k: "VAT", v: fmtMoney(inv.vat(invoice)) },
              {
                k: "Total",
                v: <span className="text-base">{fmtMoney(inv.total(invoice))}</span>,
                strong: true,
                full: true,
              },
            ]}
          />
        </div>

        <div>
          <SectionTitle>Payments</SectionTitle>
          <DataTable<PaymentResponse>
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
                    {r.method ?? "—"}
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
        description={`Apply a payment against ${inv.number(invoice)}.`}
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
          await api.recordPayment(invoice.id, {
            amount: Number(v.amount || 0),
            paidOn: v.paidOn || null,
            method: v.method as PaymentMethod,
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
