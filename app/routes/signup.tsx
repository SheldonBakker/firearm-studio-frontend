import { useState } from "react";
import { z } from "zod";
import { Link, redirect, useNavigate } from "react-router";
import type { Route } from "./+types/signup";
import { getSessionUser, useAuth } from "~/context/auth-context";
import { pageMeta } from "~/lib/utils/seo";
import { AuthShell } from "~/components/common/auth-shell";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { PasswordInput } from "~/components/common/password-input";
import { requiredEmailSchema } from "~/lib/utils/validation";
import { VerifyCodeForm } from "~/components/common/verify-code-form";

export function meta({ location }: Route.MetaArgs) {
  return pageMeta({
    title: "Create your account - Firearm Studio",
    description: "Set up Firearm Studio for your business.",
    pathname: location.pathname,
    noIndex: true,
  });
}

export async function clientLoader() {
  const user = await getSessionUser();
  if (user) throw redirect("/dashboard");
  return null;
}

export default function Signup() {
  const navigate = useNavigate();
  const { signUp, verifyEmail, resendCode } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [awaitingCode, setAwaitingCode] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const result = z
      .object({
        email: requiredEmailSchema,
        password: z.string().min(12, "Password must be at least 12 characters."),
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
    const { error } = await signUp(result.data.email, result.data.password);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    setAwaitingCode(true);
  }

  if (awaitingCode) {
    return (
      <AuthShell
        title="Confirm your email"
        subtitle="Enter the code we just sent you"
        footer={
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Back to sign in
          </Link>
        }
      >
        <VerifyCodeForm
          email={email}
          submitLabel="Confirm email"
          onSubmit={async (code) => {
            const result = await verifyEmail(email, code);
            if (!result.error) navigate("/onboarding", { replace: true });
            return result;
          }}
          onResend={() => resendCode(email, "EmailConfirmation")}
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Set up Firearm Studio for your business"
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-primary hover:underline"
          >
            Sign in
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
              setEmail(e.target.value.toLowerCase());
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
              fieldErrors.email ? "signup-email-error" : undefined
            }
          />
          {fieldErrors.email && (
            <p id="signup-email-error" className="text-[12px] font-medium text-destructive">
              {fieldErrors.email}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            required
            minLength={12}
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
            placeholder="At least 12 characters"
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={
              fieldErrors.password ? "signup-password-error" : undefined
            }
          />
          {fieldErrors.password && (
            <p id="signup-password-error" className="text-[12px] font-medium text-destructive">
              {fieldErrors.password}
            </p>
          )}
        </div>
        {error && (
          <p className="text-[13px] font-medium text-destructive">{error}</p>
        )}
        <Button type="submit" disabled={loading} className="mt-1 w-full">
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
