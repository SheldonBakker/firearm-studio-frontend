import { useState } from "react";
import { Link, redirect, useNavigate } from "react-router";
import type { Route } from "./+types/forgot-password";
import { getSessionUser, useAuth } from "~/context/auth-context";
import { pageMeta } from "~/lib/utils/seo";
import { AuthShell } from "~/components/common/auth-shell";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { requiredEmailSchema } from "~/lib/utils/validation";

export function meta({ location }: Route.MetaArgs) {
  return pageMeta({
    title: "Reset your password - Firearm Studio",
    description: "Request a password reset link for your Firearm Studio account.",
    pathname: location.pathname,
    noIndex: true,
  });
}

export async function clientLoader() {
  const user = await getSessionUser();
  if (user) throw redirect("/dashboard");
  return null;
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const result = requiredEmailSchema.safeParse(email);

    if (!result.success) {
      setFieldErrors({ email: result.error.issues[0]?.message ?? "Enter a valid email." });
      return;
    }

    setFieldErrors({});
    setLoading(true);
    const { error } = await requestPasswordReset(result.data);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthShell
        title="Check your inbox"
        subtitle="We sent a password reset code to your email"
        footer={
          <Link
            to="/login"
            className="font-semibold text-primary hover:underline"
          >
            Back to sign in
          </Link>
        }
      >
        <p className="text-center text-[13px] leading-relaxed text-muted-foreground">
          If an account exists for{" "}
          <span className="text-foreground">{email}</span>, you'll receive a
          six-digit code. It may take a few minutes to arrive.
        </p>
        <Button
          className="mt-4 w-full"
          onClick={() =>
            navigate(`/reset-password?email=${encodeURIComponent(email)}`)
          }
        >
          Enter code
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset code"
      footer={
        <Link
          to="/login"
          className="font-semibold text-primary hover:underline"
        >
          Back to sign in
        </Link>
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
            aria-describedby={
              fieldErrors.email ? "forgot-email-error" : undefined
            }
          />
          {fieldErrors.email && (
            <p id="forgot-email-error" className="text-[12px] font-medium text-destructive">
              {fieldErrors.email}
            </p>
          )}
        </div>
        {error && (
          <p className="text-[13px] font-medium text-destructive">{error}</p>
        )}
        <Button type="submit" disabled={loading} className="mt-1 w-full">
          {loading ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </AuthShell>
  );
}
