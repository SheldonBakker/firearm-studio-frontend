import { useState } from "react";
import { useNavigate, useRevalidator } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/customer-detail";
import { api } from "~/lib/api";
import { customerLabel, firearmLabel, inv } from "~/lib/entities";
import { fmtDate, fmtMoney } from "~/lib/format";
import { useSessionUser } from "./app-layout";
import { can } from "~/lib/rbac";
import { PageWrap, BackLink } from "~/components/common/misc";
import { PageHeader } from "~/components/common/page-header";
import { DataTable } from "~/components/common/data-table";
import { StatusBadge } from "~/components/common/status-badge";
import { KeyValue } from "~/components/common/key-value";
import { Mono } from "~/components/common/mono";
import { Icon } from "~/components/common/icon";
import { Button } from "~/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { FormDialog } from "~/components/modals/form-dialog";
import { Resolve, DetailSkeleton } from "~/components/common/skeletons";
import type {
  CustomerResponse,
  FirearmResponse,
  InvoiceResponse,
  StorageRecordResponse,
} from "~/lib/api-types";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const id = params.id;
  return {
    data: Promise.all([
      api.customer(id),
      api.customerFirearms(id).catch(() => [] as FirearmResponse[]),
      api.customerInvoices(id).catch(() => [] as InvoiceResponse[]),
      api.storageByCustomer(id).catch(() => [] as StorageRecordResponse[]),
    ]),
  };
}

export default function CustomerDetail({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  return (
    <PageWrap>
      <BackLink label="Back to customers" onClick={() => navigate("/customers")} />
      <Resolve resolve={loaderData.data} fallback={<DetailSkeleton />}>
        {([customer, firearms, invoices, storage]) => (
          <CustomerView
            customer={customer}
            firearms={firearms}
            invoices={invoices}
            storage={storage}
          />
        )}
      </Resolve>
    </PageWrap>
  );
}

function CustomerView({
  customer,
  firearms,
  invoices,
  storage,
}: {
  customer: CustomerResponse;
  firearms: FirearmResponse[];
  invoices: InvoiceResponse[];
  storage: StorageRecordResponse[];
}) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const user = useSessionUser();
  const fireMap = Object.fromEntries(firearms.map((f) => [f.id, f]));
  const [editOpen, setEditOpen] = useState(false);

  const outstanding = invoices
    .filter((i) => ["Sent", "Overdue"].includes(inv.status(i)))
    .reduce((a, i) => a + inv.total(i), 0);

  return (
    <>
      <PageHeader
        title={customerLabel(customer)}
        subtitle={
          <span className="flex items-center gap-2">
            <StatusBadge status={customer.customerType} />
            <span>·</span>
            <span>{fmtMoney(outstanding)} outstanding</span>
          </span>
        }
        actions={
          can(user, "registry:write") && (
            <Button variant="ghost" onClick={() => setEditOpen(true)}>
              <Icon name="edit" size={16} />
              Edit
            </Button>
          )
        }
      />

      <Tabs defaultValue="firearms">
        <TabsList>
          <TabsTrigger value="firearms">
            Firearms ({firearms.length})
          </TabsTrigger>
          <TabsTrigger value="invoices">
            Invoices ({invoices.length})
          </TabsTrigger>
          <TabsTrigger value="storage">Storage ({storage.length})</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="firearms" className="mt-5">
          <DataTable<FirearmResponse>
            rows={firearms}
            onRowClick={(r) => navigate(`/firearms/${r.id}`)}
            empty="No firearms for this customer."
            columns={[
              {
                key: "f",
                header: "Firearm",
                cell: (r) => (
                  <div className="text-[13px] font-semibold text-foreground">
                    {firearmLabel(r)}
                  </div>
                ),
              },
              {
                key: "serial",
                header: "Serial",
                cell: (r) => (
                  <Mono className="text-[12.5px] text-muted-foreground">
                    {r.serialNumber ?? "—"}
                  </Mono>
                ),
              },
              {
                key: "cal",
                header: "Calibre",
                cell: (r) => (
                  <span className="text-[12.5px] text-muted-foreground">
                    {r.calibre ?? "—"}
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                align: "right",
                cell: (r) => <StatusBadge status={r.status} />,
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="invoices" className="mt-5">
          <DataTable<InvoiceResponse>
            rows={invoices}
            onRowClick={(r) => navigate(`/invoices/${r.id}`)}
            empty="No invoices for this customer."
            columns={[
              {
                key: "num",
                header: "Invoice",
                cell: (r) => (
                  <Mono className="text-[12.5px] font-semibold text-foreground">
                    {inv.number(r)}
                  </Mono>
                ),
              },
              {
                key: "month",
                header: "Month",
                cell: (r) => (
                  <Mono className="text-[12.5px] text-muted-foreground">
                    {inv.month(r)}
                  </Mono>
                ),
              },
              {
                key: "total",
                header: "Total",
                align: "right",
                cell: (r) => (
                  <Mono className="text-[12.5px] font-semibold">
                    {fmtMoney(inv.total(r))}
                  </Mono>
                ),
              },
              {
                key: "status",
                header: "Status",
                align: "right",
                cell: (r) => <StatusBadge status={inv.status(r)} />,
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="storage" className="mt-5">
          <DataTable<StorageRecordResponse>
            rows={storage}
            empty="No storage records for this customer."
            columns={[
              {
                key: "f",
                header: "Firearm",
                cell: (r) => (
                  <span className="text-[13px] font-semibold text-foreground">
                    {firearmLabel(fireMap[r.firearmId ?? ""])}
                  </span>
                ),
              },
              {
                key: "loc",
                header: "Location",
                cell: (r) => (
                  <Mono className="text-[12.5px] text-muted-foreground">
                    {[r.storageLocation, r.rackNumber, r.safeNumber]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </Mono>
                ),
              },
              {
                key: "from",
                header: "From",
                cell: (r) => (
                  <span className="text-[12.5px] text-muted-foreground">
                    {fmtDate(r.storedFrom)}
                  </span>
                ),
              },
              {
                key: "rate",
                header: "Monthly",
                align: "right",
                cell: (r) => (
                  <Mono className="text-[12.5px] font-semibold">
                    {fmtMoney(r.monthlyRate)}
                  </Mono>
                ),
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="details" className="mt-5">
          <div className="rounded-2xl border border-border bg-card p-6">
            <KeyValue
              pairs={[
                { k: "Name", v: customerLabel(customer), strong: true },
                { k: "Type", v: customer.customerType },
                { k: "Email", v: customer.email ?? "—" },
                { k: "Phone", v: customer.phone ?? "—" },
                {
                  k: "Status",
                  v: customer.isActive ? "Active" : "Inactive",
                },
                { k: "Notes", v: customer.notes || "—", full: true },
              ]}
            />
          </div>
        </TabsContent>
      </Tabs>

      <FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit customer"
        submitLabel="Save changes"
        fields={[
          { name: "fullName", label: "Full name", full: true, defaultValue: customer.fullName ?? "" },
          { name: "companyName", label: "Company name", full: true, defaultValue: customer.companyName ?? "" },
          { name: "email", label: "Email", type: "email", defaultValue: customer.email ?? "" },
          { name: "phone", label: "Phone", defaultValue: customer.phone ?? "" },
          {
            name: "isActive",
            label: "Status",
            type: "select",
            defaultValue: customer.isActive ? "true" : "false",
            options: [
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ],
          },
          { name: "notes", label: "Notes", type: "textarea", full: true, defaultValue: customer.notes ?? "" },
        ]}
        onSubmit={async (v) => {
          await api.updateCustomer(customer.id, {
            fullName: v.fullName || null,
            companyName: v.companyName || null,
            email: v.email || null,
            phone: v.phone || null,
            notes: v.notes || null,
            isActive: v.isActive === "true",
          });
          toast.success("Customer updated");
          revalidator.revalidate();
        }}
      />
    </>
  );
}
