import { useState } from "react";
import { z } from "zod";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/reset-password";
import { useAuth } from "~/context/auth-context";
import { pageMeta } from "~/lib/utils/seo";
import { AuthShell } from "~/components/common/auth-shell";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { PasswordInput } from "~/components/common/password-input";
import { VerifyCodeForm } from "~/components/common/verify-code-form";
import { requiredEmailSchema } from "~/lib/utils/validation";

export function meta({ location }: Route.MetaArgs) {
  return pageMeta({
    title: "Set a new password - Firearm Studio",
    description: "Choose a new password for your Firearm Studio account.",
    pathname: location.pathname,
    noIndex: true,
  });
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword, requestPasswordReset } = useAuth();

  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const result = z
      .object({
        email: requiredEmailSchema,
        password: z.string().min(12, "Password must be at least 12 characters."),
        confirm: z.string().min(1, "Confirm your new password."),
      })
      .refine((data) => data.password === data.confirm, {
        message: "Passwords do not match.",
        path: ["confirm"],
      })
      .safeParse({ email, password, confirm });

    if (result.success) {
      setFieldErrors({});
      return true;
    }

    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const fieldName = issue.path[0];
      if (typeof fieldName === "string" && !errors[fieldName]) {
        errors[fieldName] = issue.message;
      }
    }
    setFieldErrors(errors);
    return false;
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Enter the code we emailed you and choose a new password"
      footer={
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <VerifyCodeForm
        destination={email}
        submitLabel="Update password"
        onSubmit={async (code) => {
          if (!validate()) {
            return { error: "Check the highlighted fields and try again." };
          }
          const result = await resetPassword(email, code, password);
          if (!result.error) {
            toast.success("Password updated. Sign in with your new password.");
            navigate("/login", { replace: true });
          }
          return result;
        }}
        onResend={() => requestPasswordReset(email)}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="reset-email">Email</Label>
          <Input
            id="reset-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value.toLowerCase())}
            placeholder="you@company.co.za"
            aria-invalid={Boolean(fieldErrors.email)}
          />
          {fieldErrors.email && (
            <p className="text-[12px] font-medium text-destructive">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">New password</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            required
            minLength={12}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(fieldErrors.password)}
          />
          {fieldErrors.password && (
            <p className="text-[12px] font-medium text-destructive">
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
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={Boolean(fieldErrors.confirm)}
          />
          {fieldErrors.confirm && (
            <p className="text-[12px] font-medium text-destructive">
              {fieldErrors.confirm}
            </p>
          )}
        </div>
      </VerifyCodeForm>
    </AuthShell>
  );
}
