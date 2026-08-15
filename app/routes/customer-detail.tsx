import { useState } from "react";
import { useNavigate, useRevalidator } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/customer-detail";
import { customersApi } from "~/lib/api/customers/customers";
import { customerLabel, firearmLabel } from "~/lib/utils/entities";
import { fmtDate, fmtMoney } from "~/lib/utils/format";
import { formatPhoneForDisplay } from "~/lib/utils/phone";
import { useSessionUser } from "~/context/auth-context";
import { can } from "~/lib/utils/rbac";
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
import {
  CustomerType,
  FirearmStatus,
  InvoiceStatus,
  StorageStatus,
  enumKey,
} from "~/lib/types/enums";
import type {
  CustomerDetailResponse,
  CustomerFirearmListItemDto,
  CustomerInvoiceListItemDto,
  CustomerStorageRecordDto,
} from "~/lib/api/customers/types";

export function clientLoader({ params }: Route.ClientLoaderArgs) {
  return { data: customersApi.get(params.id) };
}

export default function CustomerDetail({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  return (
    <PageWrap>
      <BackLink label="Back to customers" onClick={() => navigate("/customers")} />
      <Resolve resolve={loaderData.data} fallback={<DetailSkeleton />}>
        {(customer) => <CustomerView customer={customer} />}
      </Resolve>
    </PageWrap>
  );
}

function CustomerView({ customer }: { customer: CustomerDetailResponse }) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const user = useSessionUser();
  const firearms = customer.firearms ?? [];
  const invoices = customer.invoices ?? [];
  const storage = customer.storageRecords ?? [];
  const fireMap = Object.fromEntries(firearms.map((f) => [f.id, f]));
  const [editOpen, setEditOpen] = useState(false);

  const outstanding = invoices
    .filter(
      (i) =>
        i.status === InvoiceStatus.Sent || i.status === InvoiceStatus.Overdue,
    )
    .reduce((a, i) => a + (i.total ?? 0), 0);

  return (
    <>
      <PageHeader
        title={customerLabel(customer)}
        subtitle={
          <span className="flex items-center gap-2">
            <StatusBadge status={enumKey(CustomerType, customer.customerType)} />
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

      <Tabs defaultValue="details">
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="firearms">
            Firearms ({firearms.length})
          </TabsTrigger>
          <TabsTrigger value="invoices">
            Invoices ({invoices.length})
          </TabsTrigger>
          <TabsTrigger value="storage">Storage ({storage.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="firearms" className="mt-5">
          <DataTable<CustomerFirearmListItemDto>
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
                key: "status",
                header: "Status",
                align: "right",
                cell: (r) => <StatusBadge status={enumKey(FirearmStatus, r.status)} />,
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="invoices" className="mt-5">
          <DataTable<CustomerInvoiceListItemDto>
            rows={invoices}
            onRowClick={(r) => navigate(`/invoices/${r.id}`)}
            empty="No invoices for this customer."
            columns={[
              {
                key: "num",
                header: "Invoice",
                cell: (r) => (
                  <Mono className="text-[12.5px] font-semibold text-foreground">
                    {r.invoiceNumber ?? r.id.slice(0, 8)}
                  </Mono>
                ),
              },
              {
                key: "month",
                header: "Month",
                cell: (r) => (
                  <Mono className="text-[12.5px] text-muted-foreground">
                    {r.invoiceMonth ?? "—"}
                  </Mono>
                ),
              },
              {
                key: "total",
                header: "Total",
                align: "right",
                cell: (r) => (
                  <Mono className="text-[12.5px] font-semibold">
                    {fmtMoney(r.total)}
                  </Mono>
                ),
              },
              {
                key: "status",
                header: "Status",
                align: "right",
                cell: (r) => (
                  <StatusBadge status={enumKey(InvoiceStatus, r.status)} />
                ),
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="storage" className="mt-5">
          <DataTable<CustomerStorageRecordDto>
            rows={storage}
            onRowClick={(r) => navigate(`/storage/${r.id}`)}
            empty="No storage records for this customer."
            columns={[
              {
                key: "f",
                header: "Firearm",
                cell: (r) => (
                  <span className="text-[13px] font-semibold text-foreground">
                    {firearmLabel(fireMap[r.firearmId])}
                  </span>
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
                key: "until",
                header: "Until",
                cell: (r) => (
                  <span className="text-[12.5px] text-muted-foreground">
                    {fmtDate(r.storedUntil)}
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                cell: (r) => (
                  <StatusBadge status={enumKey(StorageStatus, r.storageStatus)} />
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
                ...(customer.customerType === CustomerType.Company
                  ? [{ k: "Contact person", v: customer.fullName || "—" }]
                  : []),
                { k: "Type", v: enumKey(CustomerType, customer.customerType) },
                { k: "Email", v: customer.email ?? "—" },
                { k: "Phone", v: formatPhoneForDisplay(customer.phone, "ZA") },
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
          {
            name: "phone",
            label: "Phone",
            type: "tel",
            placeholder: "68 150 1196",
            defaultValue: customer.phone ?? "",
          },
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
          await customersApi.update(customer.id, {
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
