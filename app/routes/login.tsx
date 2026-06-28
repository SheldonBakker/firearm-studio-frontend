import { useState } from "react";
import { z } from "zod";
import { Link, redirect, useNavigate, useSearchParams } from "react-router";
import type { Route } from "./+types/login";
import { supabase } from "~/lib/supabase";
import { getSessionUser } from "~/lib/auth";
import { pageMeta } from "~/lib/seo";
import { AuthShell } from "~/components/common/auth-shell";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { requiredEmailSchema } from "~/lib/validation";

export function meta({ location }: Route.MetaArgs) {
  return pageMeta({
    title: "Sign in - Firearm Studio",
    description: "Sign in to your Firearm Studio account.",
    pathname: location.pathname,
    noIndex: true,
  });
}

export async function clientLoader() {
  // Already signed in? Skip the form.
  const user = await getSessionUser();
  if (user) throw redirect("/dashboard");
  return null;
}

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const result = z
      .object({
        email: requiredEmailSchema,
        password: z.string().min(1, "Password is required."),
      })
      .safeParse({ email, password });

    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const fieldName = issue.path[0];
        if (typeof fieldName === "string" && !errors[fieldName]) {
          errors[fieldName] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: result.data.email,
      password: result.data.password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate(next ? decodeURIComponent(next) : "/dashboard", { replace: true });
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your Firearm Studio account"
      footer={
        <>
          No account?{" "}
          <Link
            to="/signup"
            className="font-semibold text-primary hover:underline"
          >
            Create one
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFieldErrors((previous) => {
                if (!previous.email) return previous;
                const next = { ...previous };
                delete next.email;
                return next;
              });
            }}
            onBlur={() => {
              const result = requiredEmailSchema.safeParse(email);
              setFieldErrors((previous) => {
                const next = { ...previous };
                if (!result.success) {
                  next.email = result.error.issues[0]?.message;
                } else delete next.email;
                return next;
              });
            }}
            placeholder="you@company.co.za"
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
          />
          {fieldErrors.email && (
            <p id="login-email-error" className="text-[12px] font-medium text-destructive">
              {fieldErrors.email}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setFieldErrors((previous) => {
                if (!previous.password) return previous;
                const next = { ...previous };
                delete next.password;
                return next;
              });
            }}
            placeholder="••••••••"
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={
              fieldErrors.password ? "login-password-error" : undefined
            }
          />
          {fieldErrors.password && (
            <p id="login-password-error" className="text-[12px] font-medium text-destructive">
              {fieldErrors.password}
            </p>
          )}
        </div>
        {error && (
          <p className="text-[13px] font-medium text-destructive">{error}</p>
        )}
        <Button type="submit" disabled={loading} className="mt-1 w-full">
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}
