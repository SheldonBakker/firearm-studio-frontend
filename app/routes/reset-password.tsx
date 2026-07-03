import { useState } from "react";
import { z } from "zod";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/reset-password";
import { useAuth } from "~/context/auth-context";
import { pageMeta } from "~/lib/utils/seo";
import { AuthShell } from "~/components/common/auth-shell";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { PasswordInput } from "~/components/common/password-input";

export function meta({ location }: Route.MetaArgs) {
  return pageMeta({
    title: "Set a new password - Firearm Studio",
    description: "Choose a new password for your Firearm Studio account.",
    pathname: location.pathname,
    noIndex: true,
  });
}

// No clientLoader guard: the recovery link establishes a valid session, so a
// redirect-if-authenticated check would bounce the user off this page.

export default function ResetPassword() {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [sessionMissing, setSessionMissing] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const result = z
      .object({
        password: z.string().min(6, "Password must be at least 6 characters."),
        confirm: z.string().min(1, "Confirm your new password."),
      })
      .refine((data) => data.password === data.confirm, {
        message: "Passwords do not match.",
        path: ["confirm"],
      })
      .safeParse({ password, confirm });

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
    const { error } = await updatePassword(result.data.password);
    setLoading(false);
    if (error) {
      // Expired or already-used link → no recovery session was established.
      if (/session/i.test(error)) {
        setSessionMissing(true);
        return;
      }
      setError(error);
      return;
    }
    toast.success("Password updated. You're signed in.");
    navigate("/dashboard", { replace: true });
  }

  if (sessionMissing) {
    return (
      <AuthShell
        title="Link expired"
        subtitle="This reset link is no longer valid"
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
          Password reset links can only be used once and expire after a while.{" "}
          <Link
            to="/forgot-password"
            className="font-semibold text-primary hover:underline"
          >
            Request a new link
          </Link>{" "}
          to continue.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a new password for your account"
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
          <Label htmlFor="password">New password</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            required
            minLength={6}
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
            placeholder="At least 6 characters"
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={
              fieldErrors.password ? "reset-password-error" : undefined
            }
          />
          {fieldErrors.password && (
            <p id="reset-password-error" className="text-[12px] font-medium text-destructive">
              {fieldErrors.password}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="confirm">Confirm new password</Label>
          <PasswordInput
            id="confirm"
            autoComplete="new-password"
            required
            minLength={6}
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              setFieldErrors((previous) => {
                if (!previous.confirm) return previous;
                const next = { ...previous };
                delete next.confirm;
                return next;
              });
            }}
            placeholder="Re-enter your new password"
            aria-invalid={Boolean(fieldErrors.confirm)}
            aria-describedby={
              fieldErrors.confirm ? "reset-confirm-error" : undefined
            }
          />
          {fieldErrors.confirm && (
            <p id="reset-confirm-error" className="text-[12px] font-medium text-destructive">
              {fieldErrors.confirm}
            </p>
          )}
        </div>
        {error && (
          <p className="text-[13px] font-medium text-destructive">{error}</p>
        )}
        <Button type="submit" disabled={loading} className="mt-1 w-full">
          {loading ? "Updating…" : "Update password"}
        </Button>
      </form>
    </AuthShell>
  );
}
