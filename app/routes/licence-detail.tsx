import { useState } from "react";
import { useNavigate, useRevalidator } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/licence-detail";
import { licencesApi } from "~/lib/api/licences/licences";
import { customerLabel } from "~/lib/utils/entities";
import { fmtDate } from "~/lib/utils/format";
import { useSessionUser } from "~/context/auth-context";
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
import { FirearmStatus, LicenceStatus, enumKey } from "~/lib/types/enums";
import type { LicenceDetailDto } from "~/lib/api/licences/types";

const LICENCE_STATUS_NAMES = Object.keys(LicenceStatus);

function dateInputValue(value: string | null | undefined) {
  return value?.slice(0, 10) ?? "";
}

export function clientLoader({ params }: Route.ClientLoaderArgs) {
  return { data: licencesApi.get(params.id) };
}

export default function LicenceDetail({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  return (
    <PageWrap>
      <BackLink label="Back to licences" onClick={() => navigate("/licences")} />
      <Resolve resolve={loaderData.data} fallback={<DetailSkeleton />}>
        {(licence) => <LicenceView licence={licence} />}
      </Resolve>
    </PageWrap>
  );
}

function LicenceView({ licence }: { licence: LicenceDetailDto }) {
  const firearm = licence.firearm;
  const customer = licence.customer;
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const user = useSessionUser();
  const writable = can(user, "registry:write");
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <PageHeader
        title={licence.licenceNumber ?? "Licence"}
        subtitle={
          <span className="flex items-center gap-2">
            <StatusBadge status={enumKey(LicenceStatus, licence.status)} />
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
            <Button variant="ghost" onClick={() => setEditOpen(true)}>
              <Icon name="edit" size={16} />
              Edit
            </Button>
          )
        }
      />

      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6">
          <KeyValue
            pairs={[
              {
                k: "Licence number",
                v: <Mono>{licence.licenceNumber ?? "—"}</Mono>,
                strong: true,
              },
              { k: "Issued", v: fmtDate(licence.issuedOn) },
              { k: "Expires", v: fmtDate(licence.expiresOn) },
              { k: "Renewal due", v: fmtDate(licence.renewalDueOn) },
              {
                k: "Status",
                v: <StatusBadge status={enumKey(LicenceStatus, licence.status)} />,
              },
              {
                k: "Document",
                v: licence.documentUrl ? (
                  <a
                    href={licence.documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    View document
                  </a>
                ) : (
                  "—"
                ),
                full: true,
              },
            ]}
          />
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-foreground">
              Firearm
            </h2>
            {firearm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/firearms/${firearm.id}`)}
              >
                View firearm
                <Icon name="arrow" size={14} />
              </Button>
            )}
          </div>
          {firearm ? (
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
                {
                  k: "Status",
                  v: <StatusBadge status={enumKey(FirearmStatus, firearm.status)} />,
                },
              ]}
            />
          ) : (
            <p className="text-[12.5px] text-muted-foreground">
              Firearm details unavailable.
            </p>
          )}
        </div>
      </div>

      {editOpen && (
        <FormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          title="Edit licence"
          submitLabel="Save changes"
          fields={[
            {
              name: "licenceNumber",
              label: "Licence number",
              full: true,
              defaultValue: licence.licenceNumber ?? "",
            },
            {
              name: "issuedOn",
              label: "Issued on",
              type: "date",
              defaultValue: dateInputValue(licence.issuedOn),
            },
            {
              name: "expiresOn",
              label: "Expires on",
              type: "date",
              required: true,
              defaultValue: dateInputValue(licence.expiresOn),
            },
            {
              name: "status",
              label: "Status",
              type: "select",
              required: true,
              defaultValue: enumKey(LicenceStatus, licence.status) ?? "Unknown",
              options: LICENCE_STATUS_NAMES.map((status) => ({
                value: status,
                label: status.replace(/([A-Z])/g, " $1").trim(),
              })),
            },
          ]}
          onSubmit={async (values) => {
            await licencesApi.update(licence.id, {
              licenceNumber: values.licenceNumber || null,
              issuedOn: values.issuedOn || null,
              expiresOn: values.expiresOn,
              status:
                LicenceStatus[values.status as keyof typeof LicenceStatus],
            });
            toast.success("Licence updated");
            setEditOpen(false);
            revalidator.revalidate();
          }}
        />
      )}
    </>
  );
}
