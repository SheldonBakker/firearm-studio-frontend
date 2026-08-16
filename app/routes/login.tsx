import { useState } from "react";
import { z } from "zod";
import { Loader2Icon } from "lucide-react";
import { Link, redirect, useNavigate, useSearchParams } from "react-router";
import type { Route } from "./+types/login";
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
  const { signIn, verifyLoginCode } = useAuth();
  const [params] = useSearchParams();
  const next = params.get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [preAuthToken, setPreAuthToken] = useState<string | null>(null);

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
    const { error, preAuthToken: challenge } = await signIn(
      result.data.email,
      result.data.password,
    );
    if (error) {
      setError(error);
      setLoading(false);
      return;
    }
    if (challenge) {
      setPreAuthToken(challenge);
      setLoading(false);
      return;
    }
    navigate(next ? decodeURIComponent(next) : "/dashboard", { replace: true });
  }

  if (preAuthToken) {
    return (
      <AuthShell
        title="Enter your code"
        subtitle="Two-factor authentication is on for this account"
      >
        <VerifyCodeForm
          destination={email}
          submitLabel="Verify and sign in"
          allowResend={false}
          onSubmit={async (code) => {
            const { error } = await verifyLoginCode(preAuthToken, code);
            if (!error) {
              navigate(next ? decodeURIComponent(next) : "/dashboard", {
                replace: true,
              });
            }
            return { error };
          }}
        />
        <button
          type="button"
          onClick={() => {
            setPreAuthToken(null);
            setPassword("");
            setError(null);
          }}
          className="mt-3 w-full text-center text-[13px] font-medium text-primary hover:underline"
        >
          Start over
        </button>
      </AuthShell>
    );
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
            aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
          />
          {fieldErrors.email && (
            <p id="login-email-error" className="text-[12px] font-medium text-destructive">
              {fieldErrors.email}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              to="/forgot-password"
              className="text-[12px] font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
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
          {loading ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
