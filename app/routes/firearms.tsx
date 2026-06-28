import { useState } from "react";
import { useNavigate, useRevalidator } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/firearms";
import { api } from "~/lib/api";
import { customerLabel, customerNameMap } from "~/lib/entities";
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
import type { CustomerResponse, FirearmResponse } from "~/lib/api-types";

export function clientLoader() {
  const firearmsP = api.firearms().catch(() => [] as FirearmResponse[]);
  const customersP = api.customers().catch(() => [] as CustomerResponse[]);
  return { data: Promise.all([firearmsP, customersP]) };
}

const STATUSES = ["InStorage", "PendingTransfer", "Released", "Inactive"];

export default function Firearms({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const user = useSessionUser();
  const [filter, setFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);

  return (
    <PageWrap>
      <PageHeader
        title="Firearms"
        actions={
          can(user, "registry:write") && (
            <Button onClick={() => setAddOpen(true)}>
              <Icon name="plus" size={16} />
              Add firearm
            </Button>
          )
        }
      />
      <Resolve resolve={loaderData.data} fallback={<ListSkeleton cols={5} />}>
        {([firearms, customers]) => {
          const names = customerNameMap(customers);
          const rows =
            filter === "all"
              ? firearms
              : firearms.filter((f) => f.status === filter);
          return (
            <>
              <FilterBar
                active={filter}
                onChange={setFilter}
                options={[
                  { id: "all", label: "All", n: firearms.length },
                  ...STATUSES.map((s) => ({
                    id: s,
                    label: s.replace(/([A-Z])/g, " $1").trim(),
                    n: firearms.filter((f) => f.status === s).length,
                  })),
                ]}
              />
              <DataTable<FirearmResponse>
                rows={rows}
                onRowClick={(r) => navigate(`/firearms/${r.id}`)}
                empty="No firearms match this filter."
                columns={[
          {
            key: "firearm",
            header: "Firearm",
            cell: (r) => (
              <div>
                <div className="text-[13px] font-semibold text-foreground">
                  {`${r.make ?? ""} ${r.model ?? ""}`.trim() || "—"}
                </div>
                <div className="text-[11.5px] text-dim">
                  {[r.firearmType, r.calibre].filter(Boolean).join(" · ") || "—"}
                </div>
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
            key: "customer",
            header: "Customer",
            cell: (r) => (
              <span className="text-[12.5px] text-muted-foreground">
                {names[r.customerId] ?? "—"}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            cell: (r) => <StatusBadge status={r.status} />,
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

              <FormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add firearm"
        description="Register a firearm to a customer."
        submitLabel="Add firearm"
        fields={[
          {
            name: "customerId",
            label: "Customer",
            type: "search-select",
            required: true,
            full: true,
            placeholder: "Search by name, email, or phone…",
            searchDebounceMs: 600,
            searchMinChars: 3,
            defaultSearchType: "name",
            searchTypes: [
              { value: "name", label: "Name" },
              { value: "email", label: "Email" },
              { value: "phone", label: "Phone" },
            ],
            onSearch: async (query, searchType) => {
              const results = await api.customers({
                [searchType]: query,
              });
              return results.map((c) => ({
                value: c.id,
                label: customerLabel(c),
                description: [c.email, c.phone].filter(Boolean).join(" · "),
              }));
            },
            options: customers.map((c) => ({
              value: c.id,
              label: customerLabel(c),
              description: [c.email, c.phone].filter(Boolean).join(" · "),
              searchText: [customerLabel(c), c.email, c.phone]
                .filter(Boolean)
                .join(" "),
            })),
          },
          { name: "make", label: "Make", required: true },
          { name: "model", label: "Model", required: true },
          { name: "calibre", label: "Calibre" },
          { name: "firearmType", label: "Type" },
          { name: "serialNumber", label: "Serial number", full: true },
          { name: "internalReference", label: "Internal reference" },
          { name: "notes", label: "Notes", type: "textarea", full: true },
        ]}
        onSubmit={async (v) => {
          await api.createFirearm({
            customerId: v.customerId,
            make: v.make || null,
            model: v.model || null,
            calibre: v.calibre || null,
            firearmType: v.firearmType || null,
            serialNumber: v.serialNumber || null,
            internalReference: v.internalReference || null,
            notes: v.notes || null,
          });
          toast.success("Firearm added");
          revalidator.revalidate();
        }}
              />
            </>
          );
        }}
      </Resolve>
    </PageWrap>
  );
}
