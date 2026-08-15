import { useState } from "react";
import { useNavigate, useRevalidator } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/customers";
import { customersApi } from "~/lib/api/customers/customers";
import { customerLabel } from "~/lib/utils/entities";
import { initials } from "~/lib/utils/format";
import { formatPhoneForDisplay } from "~/lib/utils/phone";
import { useSessionUser } from "~/context/auth-context";
import { can } from "~/lib/utils/rbac";
import { PageWrap } from "~/components/common/misc";
import { PageActions } from "~/context/page-actions";
import { DataTable, type Column } from "~/components/common/data-table";
import { StatusBadge } from "~/components/common/status-badge";
import { Mono } from "~/components/common/mono";
import { Icon } from "~/components/common/icon";
import { Button } from "~/components/ui/button";
import { FormDialog } from "~/components/modals/form-dialog";
import { Resolve } from "~/components/common/skeletons";
import { CustomerType, enumKey } from "~/lib/types/enums";
import type {
  CustomerListItemDto,
  CustomerListItemDtoPaginatedResponse,
} from "~/lib/api/customers/types";

const PAGE_SIZE = 20;

export function clientLoader({ request }: Route.ClientLoaderArgs) {
  const requestedPage = Number(new URL(request.url).searchParams.get("page"));
  const pageNumber =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const customersP = customersApi
    .list({ pageNumber, pageSize: PAGE_SIZE, sortOrder: "asc" })
    .catch(
      () =>
        ({
          items: [],
          pageNumber,
          pageSize: PAGE_SIZE,
          totalCount: 0,
        }) satisfies CustomerListItemDtoPaginatedResponse,
    );
  return { data: customersP };
}

export default function Customers({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const user = useSessionUser();
  const [addOpen, setAddOpen] = useState(false);

  const columns: Column<CustomerListItemDto>[] = [
    {
      key: "customer",
      header: "Customer",
      cell: (r) => {
        const isCompany = r.customerType === CustomerType.Company;
        return (
          <div className="flex items-center gap-3">
            <div
              className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg font-mono text-[12px] font-bold"
              style={{
                color: isCompany
                  ? "var(--status-purple)"
                  : "var(--status-teal)",
                background: `color-mix(in srgb, ${isCompany ? "var(--status-purple)" : "var(--status-teal)"} 13%, transparent)`,
              }}
            >
              {initials(customerLabel(r))}
            </div>
            <div>
              <div className="text-[13px] font-semibold text-foreground">
                {customerLabel(r)}
              </div>
              <div className="text-[11.5px] text-dim">
                {isCompany
                  ? [r.fullName, r.email].filter(Boolean).join(" - ") || "—"
                  : r.email ?? "—"}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "type",
      header: "Type",
      cell: (r) => (
        <StatusBadge status={enumKey(CustomerType, r.customerType)} />
      ),
    },
    {
      key: "contact",
      header: "Contact",
      cell: (r) => (
        <Mono className="text-[12px] text-muted-foreground">
          {formatPhoneForDisplay(r.phone, "ZA")}
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
  ];

  return (
    <PageWrap>
      {can(user, "registry:write") && (
        <PageActions>
          <Button onClick={() => setAddOpen(true)}>
            <Icon name="plus" size={16} />
            Add customer
          </Button>
        </PageActions>
      )}
      <Resolve
        resolve={loaderData.data}
        fallback={
          <DataTable<CustomerListItemDto> columns={columns} rows={[]} loading />
        }
      >
        {(customerPage) => {
          const customers = customerPage.items ?? [];
          return (
            <>
              <DataTable<CustomerListItemDto>
                columns={columns}
                rows={customers}
                onRowClick={(r) => navigate(`/customers/${r.id}`)}
                empty="No customers yet."
              />
              {customerPage.totalCount > customerPage.pageSize && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[12.5px] text-muted-foreground">
                    Showing{" "}
                    {(customerPage.pageNumber - 1) * customerPage.pageSize + 1}
                    –
                    {Math.min(
                      customerPage.pageNumber * customerPage.pageSize,
                      customerPage.totalCount,
                    )}{" "}
                    of {customerPage.totalCount}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={customerPage.pageNumber <= 1}
                      onClick={() =>
                        navigate(`/customers?page=${customerPage.pageNumber - 1}`)
                      }
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={
                        customerPage.pageNumber * customerPage.pageSize >=
                        customerPage.totalCount
                      }
                      onClick={() =>
                        navigate(`/customers?page=${customerPage.pageNumber + 1}`)
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
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
          await customersApi.create({
            customerType:
              CustomerType[v.customerType as keyof typeof CustomerType],
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
