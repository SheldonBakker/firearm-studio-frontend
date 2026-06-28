import { useState } from "react";
import { redirect, useNavigate } from "react-router";
import type { Route } from "./+types/onboarding";
import { api, ApiError } from "~/lib/api";
import {
  grantCompanyAccess,
  hasCompanyAccess,
  refreshSession,
  requireAuth,
} from "~/lib/auth";
import { pageMeta } from "~/lib/seo";
import { BrandMark } from "~/components/common/brand";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { CreateCompanyRequest } from "~/lib/api-types";

export function meta({ location }: Route.MetaArgs) {
  return pageMeta({
    title: "Set up your company - Firearm Studio",
    description: "Set up your company to start using Firearm Studio.",
    pathname: location.pathname,
    noIndex: true,
  });
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  await requireAuth(request);
  // Already part of a company? Skip onboarding.
  if (await hasCompanyAccess()) throw redirect("/dashboard");
  return null;
}

const FIELDS: {
  key: keyof CreateCompanyRequest;
  label: string;
  required?: boolean;
  full?: boolean;
  type?: string;
}[] = [
  { key: "name", label: "Company name", required: true, full: true },
  { key: "registrationNumber", label: "Registration number" },
  { key: "vatNumber", label: "VAT number" },
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Phone" },
  { key: "addressLine1", label: "Address line 1", full: true },
  { key: "addressLine2", label: "Address line 2", full: true },
  { key: "city", label: "City" },
  { key: "province", label: "Province" },
  { key: "postalCode", label: "Postal code" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [values, setValues] = useState<CreateCompanyRequest>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set(key: keyof CreateCompanyRequest, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.createCompany(values);
      // New company joined → refresh the session so the JWT carries the new
      // company/role claims, then enter the dashboard.
      await refreshSession();
      grantCompanyAccess();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      // 409 = the user already belongs to a company; just refresh and proceed.
      if (err instanceof ApiError && err.status === 409) {
        await refreshSession();
        grantCompanyAccess();
        navigate("/dashboard", { replace: true });
        return;
      }
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not save company details. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-155 animate-fade-up">
        <div className="mb-7 flex flex-col items-center text-center">
          <BrandMark size={46} />
          <h1 className="mt-4 text-xl font-bold tracking-tight text-foreground">
            Set up your company
          </h1>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            These details appear on invoices and compliance records. You can
            edit them later in Settings.
          </p>
        </div>
        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-border bg-card p-6"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <div
                key={f.key}
                className={`flex flex-col gap-2 ${f.full ? "sm:col-span-2" : ""}`}
              >
                <Label htmlFor={f.key}>
                  {f.label}
                  {f.required && <span className="text-destructive"> *</span>}
                </Label>
                <Input
                  id={f.key}
                  type={f.type ?? "text"}
                  required={f.required}
                  value={(values[f.key] as string) ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              </div>
            ))}
          </div>
          {error && (
            <p className="mt-4 text-[13px] font-medium text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={loading} className="mt-5 w-full">
            {loading ? "Saving…" : "Continue to dashboard"}
          </Button>
        </form>
      </div>
    </div>
  );
}
