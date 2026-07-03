import { useState } from "react";
import { useNavigate, useRevalidator } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/licence-detail";
import { api } from "~/lib/api/client";
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
import type {
  CustomerResponse,
  FirearmResponse,
  LicenceResponse,
} from "~/lib/types/api";

const LICENCE_STATUS_NAMES = Object.keys(LicenceStatus);

function dateInputValue(value: string | null | undefined) {
  return value?.slice(0, 10) ?? "";
}

// The API has no GET /licences/{id}, so the licence is resolved from its
// firearm's licence list. The firearm id is passed via the `?firearm=` query
// param from the licences list row (LicenceListItemDto carries firearmId).
export async function clientLoader({ params, request }: Route.ClientLoaderArgs) {
  const licenceId = params.id;
  const firearmId =
    new URL(request.url).searchParams.get("firearm")?.trim() || "";

  const data = (async () => {
    if (!firearmId) {
      return {
        licence: null as LicenceResponse | null,
        firearm: null as FirearmResponse | null,
        customer: null as CustomerResponse | null,
      };
    }
    const [firearm, licences] = await Promise.all([
      api.firearm(firearmId).catch(() => null),
      api.firearmLicences(firearmId).catch(() => [] as LicenceResponse[]),
    ]);
    const customer = firearm?.customerId
      ? await api.customer(firearm.customerId).catch(() => null)
      : null;
    const licence = licences.find((l) => l.id === licenceId) ?? null;
    return { licence, firearm, customer };
  })();

  return { data };
}

export default function LicenceDetail({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  return (
    <PageWrap>
      <BackLink label="Back to licences" onClick={() => navigate("/licences")} />
      <Resolve resolve={loaderData.data} fallback={<DetailSkeleton />}>
        {({ licence, firearm, customer }) =>
          licence ? (
            <LicenceView
              licence={licence}
              firearm={firearm}
              customer={customer}
            />
          ) : (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-[13px] text-muted-foreground">
              Licence not found.
            </div>
          )
        }
      </Resolve>
    </PageWrap>
  );
}

function LicenceView({
  licence,
  firearm,
  customer,
}: {
  licence: LicenceResponse;
  firearm: FirearmResponse | null;
  customer: CustomerResponse | null;
}) {
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
            await api.updateLicence(licence.id, {
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
