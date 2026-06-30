import { useState } from "react";
import { useNavigate, useRevalidator } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/storage-detail";
import { api } from "~/lib/api/client";
import { firearmLabel } from "~/lib/utils/entities";
import { fmtDate, fmtMoney } from "~/lib/utils/format";
import { useSessionUser } from "./app-layout";
import { can } from "~/lib/utils/rbac";
import { PageWrap, BackLink } from "~/components/common/misc";
import { PageHeader } from "~/components/common/page-header";
import { StatusBadge } from "~/components/common/status-badge";
import { KeyValue } from "~/components/common/key-value";
import { Mono } from "~/components/common/mono";
import { Icon } from "~/components/common/icon";
import { Button } from "~/components/ui/button";
import { FormDialog } from "~/components/modals/form-dialog";
import { Resolve, DetailSkeleton } from "~/components/common/skeletons";
import { StorageStatus, enumKey, enumNames } from "~/lib/types/enums";
import type { FirearmResponse, StorageRecordResponse } from "~/lib/types/api";

export function clientLoader({ params }: Route.ClientLoaderArgs) {
  // No single-record GET exists; derive the record from the list, then enrich
  // with the firearm for make/model/calibre.
  const data = api
    .storageActive({ pageSize: 200 })
    .catch(() => ({ items: [] as StorageRecordResponse[], pageNumber: 1, pageSize: 200, totalCount: 0 }))
    .then(async (response) => {
      const records = response.items ?? [];
      const record = records.find((r) => r.id === params.id) ?? null;
      const firearm = record?.firearmId
        ? await api.firearm(record.firearmId).catch(() => null)
        : null;
      return { record, firearm: firearm as FirearmResponse | null };
    });
  return { data };
}

export default function StorageDetail({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  return (
    <PageWrap>
      <BackLink label="Back to storage" onClick={() => navigate("/storage")} />
      <Resolve resolve={loaderData.data} fallback={<DetailSkeleton />}>
        {({ record, firearm }) =>
          record ? (
            <StorageView record={record} firearm={firearm} />
          ) : (
            <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center text-[13px] text-dim">
              Storage record not found.
            </div>
          )
        }
      </Resolve>
    </PageWrap>
  );
}

function StorageView({
  record,
  firearm,
}: {
  record: StorageRecordResponse;
  firearm: FirearmResponse | null;
}) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const user = useSessionUser();
  const writable = can(user, "registry:write");
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const title = firearm ? firearmLabel(firearm) : (record.serialNumber ?? "Storage record");
  const canRelease = writable && record.storageStatus === StorageStatus.Active;

  return (
    <>
      <PageHeader
        title={title}
        subtitle={
          <span className="flex items-center gap-2">
            <StatusBadge status={enumKey(StorageStatus, record.storageStatus)} />
            {record.customerId && (
              <button
                onClick={() => navigate(`/customers/${record.customerId}`)}
                className="hover:text-foreground"
              >
                · {record.customerName ?? "View customer"}
              </button>
            )}
          </span>
        }
        actions={
          writable && (
            <>
              {canRelease && (
                <Button variant="ghost" onClick={() => setReleaseOpen(true)}>
                  <Icon name="box" size={16} />
                  Release
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

      <div className="rounded-2xl border border-border bg-card p-6">
        <KeyValue
          pairs={[
            {
              k: "Firearm",
              v: firearm ? (
                <button
                  onClick={() => navigate(`/firearms/${firearm.id}`)}
                  className="font-semibold hover:text-foreground"
                >
                  {firearmLabel(firearm)}
                </button>
              ) : (
                firearmLabel(firearm)
              ),
              strong: true,
            },
            {
              k: "Serial number",
              v: <Mono>{record.serialNumber ?? firearm?.serialNumber ?? "—"}</Mono>,
            },
            { k: "Calibre", v: firearm?.calibre ?? "—" },
            { k: "Type", v: firearm?.firearmType ?? "—" },
            {
              k: "Customer",
              v: record.customerId ? (
                <button
                  onClick={() => navigate(`/customers/${record.customerId}`)}
                  className="hover:text-foreground"
                >
                  {record.customerName ?? "View customer"}
                </button>
              ) : (
                (record.customerName ?? "—")
              ),
            },
            {
              k: "Status",
              v: <StatusBadge status={enumKey(StorageStatus, record.storageStatus)} />,
            },
            { k: "Monthly rate", v: <Mono>{fmtMoney(record.monthlyRate)}</Mono> },
            { k: "Location", v: record.storageLocation || "—" },
            { k: "Rack number", v: record.rackNumber || "—" },
            { k: "Safe number", v: record.safeNumber || "—" },
            { k: "Stored from", v: fmtDate(record.storedFrom) },
            { k: "Stored until", v: fmtDate(record.storedUntil) },
          ]}
        />
      </div>

      <FormDialog
        open={releaseOpen}
        onOpenChange={setReleaseOpen}
        title="Release from storage"
        description={`${title} - confirm release date.`}
        submitLabel="Release"
        fields={[
          {
            name: "storedUntil",
            label: "Released on",
            type: "date",
            full: true,
          },
        ]}
        onSubmit={async (v) => {
          await api.updateStorage(record.id, {
            storageStatus: StorageStatus.Released,
            storedUntil: v.storedUntil || null,
          });
          toast.success("Storage released");
          setReleaseOpen(false);
          revalidator.revalidate();
        }}
      />

      <FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit storage record"
        submitLabel="Save changes"
        fields={[
          {
            name: "storageStatus",
            label: "Status",
            type: "select",
            defaultValue: enumKey(StorageStatus, record.storageStatus),
            options: enumNames(StorageStatus).map((s) => ({ value: s, label: s })),
          },
          {
            name: "monthlyRate",
            label: "Monthly rate",
            type: "number",
            defaultValue: record.monthlyRate != null ? String(record.monthlyRate) : "",
          },
          {
            name: "storedFrom",
            label: "Stored from",
            type: "date",
            defaultValue: record.storedFrom ?? "",
          },
          {
            name: "storedUntil",
            label: "Stored until",
            type: "date",
            defaultValue: record.storedUntil ?? "",
          },
          {
            name: "storageLocation",
            label: "Location",
            defaultValue: record.storageLocation ?? "",
          },
          { name: "rackNumber", label: "Rack number", defaultValue: record.rackNumber ?? "" },
          { name: "safeNumber", label: "Safe number", defaultValue: record.safeNumber ?? "" },
          {
            name: "notes",
            label: "Notes",
            type: "textarea",
            full: true,
            defaultValue: (record.notes as string) ?? "",
          },
        ]}
        onSubmit={async (v) => {
          await api.updateStorage(record.id, {
            storedFrom: v.storedFrom || null,
            storedUntil: v.storedUntil || null,
            monthlyRate: v.monthlyRate ? Number(v.monthlyRate) : null,
            storageStatus:
              StorageStatus[v.storageStatus as keyof typeof StorageStatus],
            storageLocation: v.storageLocation || null,
            rackNumber: v.rackNumber || null,
            safeNumber: v.safeNumber || null,
            notes: v.notes || null,
          });
          toast.success("Storage record updated");
          setEditOpen(false);
          revalidator.revalidate();
        }}
      />
    </>
  );
}
