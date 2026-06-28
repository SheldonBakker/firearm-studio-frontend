import { useState } from "react";
import { useNavigate, useRevalidator } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/customers";
import { api } from "~/lib/api";
import { customerLabel } from "~/lib/entities";
import { initials } from "~/lib/format";
import { useSessionUser } from "./app-layout";
import { can } from "~/lib/rbac";
import { PageWrap } from "~/components/common/misc";
import { PageHeader } from "~/components/common/page-header";
import { FilterBar } from "~/components/common/filter-bar";
import { DataTable } from "~/components/common/data-table";
import { StatusBadge } from "~/components/common/status-badge";
import { Mono } from "~/components/common/mono";
import { Icon } from "~/components/common/icon";
import { Button } from "~/components/ui/button";
import { FormDialog } from "~/components/modals/form-dialog";
import { Resolve, ListSkeleton } from "~/components/common/skeletons";
import type {
  CustomerResponse,
  CustomerType,
  FirearmResponse,
} from "~/lib/api-types";

export function clientLoader() {
  const customersP = api.customers().catch(() => [] as CustomerResponse[]);
  const firearmsP = api.firearms().catch(() => [] as FirearmResponse[]);
  return { data: Promise.all([customersP, firearmsP]) };
}

export default function Customers({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const user = useSessionUser();
  const [filter, setFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);

  return (
    <PageWrap>
      <PageHeader
        title="Customers"
        actions={
          can(user, "registry:write") && (
            <Button onClick={() => setAddOpen(true)}>
              <Icon name="plus" size={16} />
              Add customer
            </Button>
          )
        }
      />
      <Resolve resolve={loaderData.data} fallback={<ListSkeleton cols={6} />}>
        {([customers, firearms]) => {
          const fireCount = (id: string) =>
            firearms.filter((f) => f.customerId === id).length;
          const activeN = customers.filter((c) => c.isActive).length;
          let rows = customers;
          if (filter === "individual")
            rows = rows.filter((c) => c.customerType === "Individual");
          if (filter === "company")
            rows = rows.filter((c) => c.customerType === "Company");
          if (filter === "inactive") rows = rows.filter((c) => !c.isActive);
          return (
            <>
              <FilterBar
                active={filter}
                onChange={setFilter}
                options={[
                  { id: "all", label: "All", n: customers.length },
                  {
                    id: "individual",
                    label: "Individuals",
                    n: customers.filter((c) => c.customerType === "Individual")
                      .length,
                  },
                  {
                    id: "company",
                    label: "Companies",
                    n: customers.filter((c) => c.customerType === "Company")
                      .length,
                  },
                  {
                    id: "inactive",
                    label: "Inactive",
                    n: customers.length - activeN,
                  },
                ]}
              />
              <DataTable<CustomerResponse>
                rows={rows}
                onRowClick={(r) => navigate(`/customers/${r.id}`)}
                empty="No customers match this filter."
                columns={[
          {
            key: "customer",
            header: "Customer",
            cell: (r) => (
              <div className="flex items-center gap-3">
                <div
                  className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg font-mono text-[12px] font-bold"
                  style={{
                    color:
                      r.customerType === "Company"
                        ? "var(--status-purple)"
                        : "var(--status-teal)",
                    background: `color-mix(in srgb, ${r.customerType === "Company" ? "var(--status-purple)" : "var(--status-teal)"} 13%, transparent)`,
                  }}
                >
                  {initials(customerLabel(r))}
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-foreground">
                    {customerLabel(r)}
                  </div>
                  <div className="text-[11.5px] text-dim">{r.email ?? "—"}</div>
                </div>
              </div>
            ),
          },
          {
            key: "type",
            header: "Type",
            cell: (r) => <StatusBadge status={r.customerType} />,
          },
          {
            key: "contact",
            header: "Contact",
            cell: (r) => (
              <Mono className="text-[12px] text-muted-foreground">
                {r.phone ?? "—"}
              </Mono>
            ),
          },
          {
            key: "firearms",
            header: "Firearms",
            align: "center",
            cell: (r) => (
              <Mono
                className={`text-[13px] font-semibold ${fireCount(r.id) ? "text-foreground" : "text-dim"}`}
              >
                {fireCount(r.id)}
              </Mono>
            ),
          },
          {
            key: "status",
            header: "Status",
            align: "center",
            cell: (r) =>
              r.isActive ? (
                <StatusBadge status="Valid" />
              ) : (
                <span className="text-[12px] text-dim">Inactive</span>
              ),
          },
          {
            key: "go",
            header: "",
            align: "right",
            width: "40px",
            cell: () => (
              <span className="flex justify-end text-dim">
                <Icon name="arrow" size={16} />
              </span>
            ),
          },
        ]}
              />
            </>
          );
        }}
      </Resolve>

      <FormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add customer"
        description="Create a new customer on the registry."
        submitLabel="Create customer"
        fields={[
          {
            name: "customerType",
            label: "Type",
            type: "select",
            required: true,
            defaultValue: "Individual",
            options: [
              { value: "Individual", label: "Individual" },
              { value: "Company", label: "Company" },
            ],
          },
          { name: "fullName", label: "Full name", full: true },
          { name: "companyName", label: "Company name", full: true },
          { name: "email", label: "Email", type: "email" },
          {
            name: "phone",
            label: "Phone",
            type: "tel",
            placeholder: "68 150 1196",
          },
          { name: "addressLine1", label: "Address", full: true },
          { name: "city", label: "City" },
          { name: "province", label: "Province" },
          { name: "postalCode", label: "Postal code" },
          { name: "registrationNumber", label: "Reg. number" },
          { name: "vatNumber", label: "VAT number" },
          { name: "notes", label: "Notes", type: "textarea", full: true },
        ]}
        onSubmit={async (v) => {
          await api.createCustomer({
            customerType: v.customerType as CustomerType,
            fullName: v.fullName || null,
            companyName: v.companyName || null,
            email: v.email || null,
            phone: v.phone || null,
            addressLine1: v.addressLine1 || null,
            city: v.city || null,
            province: v.province || null,
            postalCode: v.postalCode || null,
            registrationNumber: v.registrationNumber || null,
            vatNumber: v.vatNumber || null,
            notes: v.notes || null,
          });
          toast.success("Customer created");
          revalidator.revalidate();
        }}
      />
    </PageWrap>
  );
}
