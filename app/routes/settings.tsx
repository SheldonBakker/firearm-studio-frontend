import { useState } from "react";
import { Link, redirect, useRevalidator } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/settings";
import { companyApi } from "~/lib/api/company/company";
import { sageApi } from "~/lib/api/sage/sage";
import { ApiError } from "~/lib/api/http";
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
import { Badge } from "~/components/ui/badge";
import type { CompanyDetailsResponse } from "~/lib/api/company/types";
import type { SageConnectionDetailsResponse } from "~/lib/api/sage/types";
import { SOUTH_AFRICAN_BANKS, BANK_ACCOUNT_TYPES } from "~/lib/constants/banking";

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const user = await requireAuth(request);
  if (!canSeeNav(user, "settings")) throw redirect("/dashboard");
  return {
    company: companyApi.get().catch(() => null),
    sage: sageApi.connection().catch(() => null),
  };
}

export default function Settings({ loaderData }: Route.ComponentProps) {
  const user = useSessionUser();

  return (
    <PageWrap>
      <PageHeader subtitle="Manage your company profile and account" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-border bg-card p-6">
            <Resolve
              resolve={loaderData.company}
              fallback={<KeyValueSkeleton rows={6} />}
            >
              {(company) => <CompanyPanel company={company} />}
            </Resolve>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <Resolve
              resolve={loaderData.sage}
              fallback={<KeyValueSkeleton rows={5} />}
            >
              {(connection) => <SagePanel connection={connection} />}
            </Resolve>
          </div>
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

function CredentialBadge({ stored }: { stored: boolean }) {
  return (
    <Badge variant={stored ? "secondary" : "destructive"}>
      {stored ? "Stored" : "Missing"}
    </Badge>
  );
}

function parseSageCompanyId(value: string): number {
  const sageCompanyId = Number(value);
  if (!Number.isInteger(sageCompanyId) || sageCompanyId <= 0) {
    throw new ApiError(400, "Enter a valid Sage company ID.");
  }
  return sageCompanyId;
}

function SagePanel({
  connection,
}: {
  connection: SageConnectionDetailsResponse | null;
}) {
  const revalidator = useRevalidator();
  const [editOpen, setEditOpen] = useState(false);
  const c = connection;

  return (
    <>
      <SectionTitle
        right={
          <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
            <Icon name={c ? "edit" : "plus"} size={14} />
            {c ? "Update" : "Connect"}
          </Button>
        }
      >
        Sage Accounting
      </SectionTitle>

      <div className="mb-5 flex flex-wrap items-center gap-4">
        <div className="flex h-12 min-w-36 items-center">
          <img
            src="/assets/sage.png"
            alt="Sage Accounting"
            className="h-8 w-auto max-w-28 object-contain"
          />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground">
            {c?.sageCompanyName || "No Sage company connected"}
          </div>
          <div className="mt-1 text-[12px] text-muted-foreground">
            {c
              ? "Invoice exports can use this Sage Accounting connection."
              : "Add your Sage Accounting credentials to connect invoices."}
          </div>
        </div>
      </div>

      {c ? (
        <>
          <KeyValue
            pairs={[
              { k: "Status", v: <Badge>Connected</Badge> },
              {
                k: "Sage company ID",
                v: <Mono>{String(c.sageCompanyId)}</Mono>,
              },
              { k: "Sage company", v: c.sageCompanyName || "—" },
              { k: "API key", v: <CredentialBadge stored={c.apiKey} /> },
              { k: "Username", v: <CredentialBadge stored={c.username} /> },
              { k: "Password", v: <CredentialBadge stored={c.password} /> },
              {
                k: "Last validated",
                v: fmtDate(c.lastValidatedAt),
              },
              {
                k: "Registered by",
                v: <Mono className="text-xs">{c.lastRegisteredByAuthUserId}</Mono>,
                full: true,
              },
            ]}
          />
          <div className="mt-5 border-t border-line pt-4 text-[11.5px] text-dim">
            Created {fmtDate(c.createdAt)}
            {c.updatedAt ? ` · updated ${fmtDate(c.updatedAt)}` : ""}
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
          Sage Accounting is not connected yet.
        </div>
      )}

      <FormDialog
        key={c?.updatedAt ?? c?.id ?? "new-sage-connection"}
        open={editOpen}
        onOpenChange={setEditOpen}
        title={c ? "Update Sage Accounting" : "Connect Sage Accounting"}
        description="These credentials are validated by Sage and stored securely by the API."
        submitLabel={c ? "Update connection" : "Connect Sage"}
        confirmTitle={c ? "Update Sage Accounting?" : "Connect Sage Accounting?"}
        fields={[
          {
            name: "apiKey",
            label: "API key",
            type: "password",
            required: true,
            placeholder: c?.apiKey ? "Stored API key" : undefined,
          },
          {
            name: "username",
            label: "Username",
            required: true,
            placeholder: c?.username ? "Stored username" : undefined,
          },
          {
            name: "password",
            label: "Password",
            type: "password",
            required: true,
            placeholder: c?.password ? "Stored password" : undefined,
          },
          {
            name: "sageCompanyId",
            label: "Sage company ID",
            type: "number",
            required: true,
            defaultValue: c?.sageCompanyId ? String(c.sageCompanyId) : "",
          },
        ]}
        afterFields={
          <p className="text-[12.5px] text-muted-foreground">
            Having connection troubles?{" "}
            <Link
              to="/contact"
              prefetch="viewport"
              className="font-semibold text-foreground underline underline-offset-4 hover:text-primary"
            >
              Contact us for help
            </Link>
            .
          </p>
        }
        onSubmit={async (v) => {
          await sageApi.register({
            apiKey: v.apiKey || null,
            username: v.username || null,
            password: v.password || null,
            sageCompanyId: parseSageCompanyId(v.sageCompanyId),
          });
          toast.success(c ? "Sage connection updated" : "Sage connected");
          revalidator.revalidate();
        }}
      />
    </>
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
          <div className="mt-5 border-t border-line pt-4">
            <SectionTitle>Banking details</SectionTitle>
            <KeyValue
              pairs={[
                { k: "Bank", v: c.bankName || "—" },
                { k: "Account holder", v: c.bankAccountHolder || "—" },
                {
                  k: "Account number",
                  v: <Mono>{c.bankAccountNumber || "—"}</Mono>,
                },
                { k: "Branch code", v: <Mono>{c.bankBranchCode || "—"}</Mono> },
                { k: "Account type", v: c.bankAccountType || "—" },
                { k: "SWIFT code", v: <Mono>{c.bankSwiftCode || "—"}</Mono> },
              ]}
            />
          </div>
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
            {
              name: "bankName",
              label: "Bank name",
              type: "select",
              placeholder: "Select a bank",
              options: SOUTH_AFRICAN_BANKS.map((b) => ({
                value: b.name,
                label: b.name,
              })),
              onValueChange: (v) => {
                const branchCode = SOUTH_AFRICAN_BANKS.find(
                  (b) => b.name === v,
                )?.branchCode;
                return branchCode ? { bankBranchCode: branchCode } : undefined;
              },
              defaultValue: c.bankName ?? "",
            },
            { name: "bankAccountHolder", label: "Account holder", defaultValue: c.bankAccountHolder ?? "" },
            { name: "bankAccountNumber", label: "Account number", defaultValue: c.bankAccountNumber ?? "" },
            { name: "bankBranchCode", label: "Branch code", defaultValue: c.bankBranchCode ?? "" },
            {
              name: "bankAccountType",
              label: "Account type",
              type: "select",
              placeholder: "Select an account type",
              options: BANK_ACCOUNT_TYPES.map((t) => ({ value: t, label: t })),
              defaultValue: c.bankAccountType ?? "",
            },
            { name: "bankSwiftCode", label: "SWIFT code", defaultValue: c.bankSwiftCode ?? "" },
          ]}
          onSubmit={async (v) => {
            await companyApi.update({
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
              bankName: v.bankName || null,
              bankAccountHolder: v.bankAccountHolder || null,
              bankAccountNumber: v.bankAccountNumber || null,
              bankBranchCode: v.bankBranchCode || null,
              bankAccountType: v.bankAccountType || null,
              bankSwiftCode: v.bankSwiftCode || null,
            });
            toast.success("Company details updated");
            revalidator.revalidate();
          }}
        />
      )}
    </>
  );
}
