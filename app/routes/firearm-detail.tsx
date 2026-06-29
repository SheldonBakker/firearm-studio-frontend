import { useState } from "react";
import { useNavigate, useRevalidator } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/firearm-detail";
import { api } from "~/lib/api";
import { customerLabel, firearmLabel } from "~/lib/entities";
import { fmtDate } from "~/lib/format";
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
import {
  FirearmStatus,
  LicenceStatus,
  enumKey,
  enumNames,
} from "~/lib/enums";
import type {
  CustomerResponse,
  FirearmResponse,
  LicenceResponse,
} from "~/lib/api-types";

export function clientLoader({ params }: Route.ClientLoaderArgs) {
  const data = api.firearm(params.id).then(async (firearm) => {
    const [licences, customer] = await Promise.all([
      api.firearmLicences(params.id).catch(() => [] as LicenceResponse[]),
      firearm.customerId
        ? api.customer(firearm.customerId).catch(() => null)
        : Promise.resolve(null),
    ]);
    return { firearm, licences, customer: customer as CustomerResponse | null };
  });
  return { data };
}

const STATUSES = enumNames(FirearmStatus);

export default function FirearmDetail({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  return (
    <PageWrap>
      <BackLink label="Back to firearms" onClick={() => navigate("/firearms")} />
      <Resolve resolve={loaderData.data} fallback={<DetailSkeleton />}>
        {({ firearm, licences, customer }) => (
          <FirearmView firearm={firearm} licences={licences} customer={customer} />
        )}
      </Resolve>
    </PageWrap>
  );
}

function FirearmView({
  firearm,
  licences,
  customer,
}: {
  firearm: FirearmResponse;
  licences: LicenceResponse[];
  customer: CustomerResponse | null;
}) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const user = useSessionUser();
  const writable = can(user, "registry:write");
  const [editOpen, setEditOpen] = useState(false);
  const [licOpen, setLicOpen] = useState(false);
  const [storageOpen, setStorageOpen] = useState(false);

  return (
    <>
      <PageHeader
        title={firearmLabel(firearm)}
        subtitle={
          <span className="flex items-center gap-2">
            <StatusBadge status={enumKey(FirearmStatus, firearm.status)} />
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
              <Button onClick={() => setLicOpen(true)}>
                <Icon name="plus" size={16} />
                Add licence
              </Button>
              {firearm.status !== FirearmStatus.InStorage && (
                <Button variant="ghost" onClick={() => setStorageOpen(true)}>
                  <Icon name="box" size={16} />
                  Start storage
                </Button>
              )}
              <Button variant="ghost" onClick={() => setEditOpen(true)}>
                <Icon name="edit" size={16} />
                Edit
              </Button>
            </>
          )
        }
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="licences">
            Licences ({licences.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-5">
          <div className="rounded-2xl border border-border bg-card p-6">
            <KeyValue
              pairs={[
                { k: "Make", v: firearm.make ?? "—", strong: true },
                { k: "Model", v: firearm.model ?? "—", strong: true },
                { k: "Calibre", v: firearm.calibre ?? "—" },
                { k: "Type", v: firearm.firearmType ?? "—" },
                {
                  k: "Serial number",
                  v: <Mono>{firearm.serialNumber ?? "—"}</Mono>,
                },
                { k: "Status", v: <StatusBadge status={enumKey(FirearmStatus, firearm.status)} /> },
                { k: "Notes", v: firearm.notes || "—", full: true },
              ]}
            />
          </div>
        </TabsContent>

        <TabsContent value="licences" className="mt-5">
          {writable && (
            <div className="mb-3 flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setLicOpen(true)}>
                <Icon name="plus" size={14} />
                Add licence
              </Button>
            </div>
          )}
          <DataTable<LicenceResponse>
            rows={licences}
            empty="No licences recorded."
            columns={[
              {
                key: "num",
                header: "Licence",
                cell: (r) => (
                  <Mono className="text-[12.5px] font-semibold text-foreground">
                    {r.licenceNumber ?? "—"}
                  </Mono>
                ),
              },
              {
                key: "issued",
                header: "Issued",
                cell: (r) => (
                  <span className="text-[12.5px] text-muted-foreground">
                    {fmtDate(r.issuedOn)}
                  </span>
                ),
              },
              {
                key: "expires",
                header: "Expires",
                cell: (r) => (
                  <span className="text-[12.5px] text-muted-foreground">
                    {fmtDate(r.expiresOn)}
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                align: "right",
                cell: (r) => (
                  <StatusBadge status={enumKey(LicenceStatus, r.status)} />
                ),
              },
            ]}
          />
        </TabsContent>
      </Tabs>

      <FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit firearm"
        submitLabel="Save changes"
        fields={[
          { name: "model", label: "Model", defaultValue: firearm.model ?? "" },
          { name: "calibre", label: "Calibre", defaultValue: firearm.calibre ?? "" },
          { name: "firearmType", label: "Type", defaultValue: firearm.firearmType ?? "" },
          {
            name: "status",
            label: "Status",
            type: "select",
            defaultValue: enumKey(FirearmStatus, firearm.status),
            options: STATUSES.map((s) => ({ value: s, label: s })),
          },
          { name: "notes", label: "Notes", type: "textarea", full: true, defaultValue: firearm.notes ?? "" },
        ]}
        onSubmit={async (v) => {
          await api.updateFirearm(firearm.id, {
            model: v.model || null,
            calibre: v.calibre || null,
            firearmType: v.firearmType || null,
            status: FirearmStatus[v.status as keyof typeof FirearmStatus],
            notes: v.notes || null,
          });
          toast.success("Firearm updated");
          revalidator.revalidate();
        }}
      />

      <FormDialog
        open={licOpen}
        onOpenChange={setLicOpen}
        title="Add licence"
        submitLabel="Add licence"
        fields={[
          { name: "licenceNumber", label: "Licence number", full: true },
          { name: "issuedOn", label: "Issued on", type: "date" },
          { name: "expiresOn", label: "Expires on", type: "date", required: true },
          { name: "documentUrl", label: "Document URL", full: true },
        ]}
        onSubmit={async (v) => {
          await api.createLicence(firearm.id, {
            licenceNumber: v.licenceNumber || null,
            issuedOn: v.issuedOn || null,
            expiresOn: v.expiresOn,
            documentUrl: v.documentUrl || null,
          });
          toast.success("Licence added");
          revalidator.revalidate();
        }}
      />

      <FormDialog
        open={storageOpen}
        onOpenChange={setStorageOpen}
        title="Start storage"
        description="Begin a storage record for this firearm."
        submitLabel="Start storage"
        fields={[
          { name: "storedFrom", label: "Stored from", type: "date", required: true },
          { name: "monthlyRate", label: "Monthly rate", type: "number", required: true },
          { name: "storageLocation", label: "Location" },
          { name: "rackNumber", label: "Rack number" },
          { name: "safeNumber", label: "Safe number" },
          { name: "notes", label: "Notes", type: "textarea", full: true },
        ]}
        onSubmit={async (v) => {
          await api.startStorage(firearm.id, {
            storedFrom: v.storedFrom,
            monthlyRate: Number(v.monthlyRate || 0),
            storageLocation: v.storageLocation || null,
            rackNumber: v.rackNumber || null,
            safeNumber: v.safeNumber || null,
            notes: v.notes || null,
          });
          toast.success("Storage started");
          revalidator.revalidate();
        }}
      />
    </>
  );
}
