import { useState } from "react";
import { redirect, useRevalidator } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/settings";
import { api } from "~/lib/api/client";
import { requireAuth } from "~/context/auth-context";
import { canSeeNav, primaryRole } from "~/lib/utils/rbac";
import { useSessionUser } from "~/context/auth-context";
import { fmtDate } from "~/lib/utils/format";
import { PageWrap, SectionTitle } from "~/components/common/misc";
import { PageHeader } from "~/components/common/page-header";
import { Button } from "~/components/ui/button";
import { Icon } from "~/components/common/icon";
import { KeyValue } from "~/components/common/key-value";
import { Mono } from "~/components/common/mono";
import { FormDialog } from "~/components/modals/form-dialog";
import { Resolve, KeyValueSkeleton } from "~/components/common/skeletons";
import type { CompanyDetailsResponse } from "~/lib/types/api";

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const user = await requireAuth(request);
  if (!canSeeNav(user, "settings")) throw redirect("/dashboard");
  return { company: api.company().catch(() => null) };
}

export default function Settings({ loaderData }: Route.ComponentProps) {
  const user = useSessionUser();

  return (
    <PageWrap>
      <PageHeader
        title="Settings"
        subtitle="Manage your company profile and account"
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-6">
          <Resolve
            resolve={loaderData.company}
            fallback={<KeyValueSkeleton rows={6} />}
          >
            {(company) => <CompanyPanel company={company} />}
          </Resolve>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <SectionTitle>Your account</SectionTitle>
          <KeyValue
            pairs={[
              { k: "Email", v: user.email ?? "—", full: true },
              { k: "Role", v: primaryRole(user), strong: true },
              {
                k: "User ID",
                v: <Mono className="text-xs">{user.id}</Mono>,
                full: true,
              },
            ]}
          />
        </div>
      </div>
    </PageWrap>
  );
}

function CompanyPanel({ company }: { company: CompanyDetailsResponse | null }) {
  const revalidator = useRevalidator();
  const [editOpen, setEditOpen] = useState(false);
  const c = company;

  return (
    <>
      <SectionTitle
        right={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditOpen(true)}
            disabled={!c}
          >
            <Icon name="edit" size={14} />
            Edit
          </Button>
        }
      >
        Company
      </SectionTitle>

      {c ? (
        <>
          <KeyValue
            pairs={[
              { k: "Company name", v: c.name || "—", strong: true, full: true },
              {
                k: "Registration number",
                v: <Mono>{c.registrationNumber || "—"}</Mono>,
              },
              { k: "VAT number", v: <Mono>{c.vatNumber || "—"}</Mono> },
              { k: "Email", v: c.email || "—" },
              { k: "Phone", v: <Mono>{c.phone || "—"}</Mono> },
              {
                k: "Address",
                full: true,
                v:
                  [
                    c.addressLine1,
                    c.addressLine2,
                    c.city,
                    c.province,
                    c.postalCode,
                  ]
                    .filter(Boolean)
                    .join(", ") || "—",
              },
            ]}
          />
          <div className="mt-5 border-t border-line pt-4 text-[11.5px] text-dim">
            Created {fmtDate(c.createdAt)}
            {c.updatedAt ? ` · updated ${fmtDate(c.updatedAt)}` : ""}
          </div>
        </>
      ) : (
        <div className="py-8 text-center text-sm text-dim">
          Could not load company details.
        </div>
      )}

      {c && (
        <FormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          title="Edit company details"
          description="These details appear on invoices and compliance records."
          submitLabel="Save changes"
          fields={[
            { name: "name", label: "Company name", full: true, defaultValue: c.name ?? "" },
            { name: "registrationNumber", label: "Registration number", defaultValue: c.registrationNumber ?? "" },
            { name: "vatNumber", label: "VAT number", defaultValue: c.vatNumber ?? "" },
            { name: "email", label: "Email", type: "email", defaultValue: c.email ?? "" },
            {
              name: "phone",
              label: "Phone",
              type: "tel",
              placeholder: "68 150 1196",
              defaultValue: c.phone ?? "",
            },
            { name: "addressLine1", label: "Address line 1", full: true, defaultValue: c.addressLine1 ?? "" },
            { name: "addressLine2", label: "Address line 2", full: true, defaultValue: c.addressLine2 ?? "" },
            { name: "city", label: "City", defaultValue: c.city ?? "" },
            { name: "province", label: "Province", defaultValue: c.province ?? "" },
            { name: "postalCode", label: "Postal code", defaultValue: c.postalCode ?? "" },
          ]}
          onSubmit={async (v) => {
            await api.updateCompany({
              name: v.name || null,
              registrationNumber: v.registrationNumber || null,
              vatNumber: v.vatNumber || null,
              email: v.email || null,
              phone: v.phone || null,
              addressLine1: v.addressLine1 || null,
              addressLine2: v.addressLine2 || null,
              city: v.city || null,
              province: v.province || null,
              postalCode: v.postalCode || null,
            });
            toast.success("Company details updated");
            revalidator.revalidate();
          }}
        />
      )}
    </>
  );
}
