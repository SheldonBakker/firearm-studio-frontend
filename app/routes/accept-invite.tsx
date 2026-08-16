import { useState } from "react";
import { z } from "zod";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/accept-invite";
import { useAuth } from "~/context/auth-context";
import { pageMeta } from "~/lib/utils/seo";
import { AuthShell } from "~/components/common/auth-shell";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { PasswordInput } from "~/components/common/password-input";
import { PhoneInput } from "~/components/common/phone-input";
import { VerifyCodeForm } from "~/components/common/verify-code-form";
import { requiredEmailSchema } from "~/lib/utils/validation";
import { optionalPhoneSchema } from "~/lib/utils/phone";

export function meta({ location }: Route.MetaArgs) {
  return pageMeta({
    title: "Accept your invite - Firearm Studio",
    description: "Set a password and join your team on Firearm Studio.",
    pathname: location.pathname,
    noIndex: true,
  });
}

export default function AcceptInvite() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { acceptInvite, resendCode } = useAuth();

  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [phone, setPhone] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const result = z
      .object({
        email: requiredEmailSchema,
        password: z.string().min(12, "Password must be at least 12 characters."),
        confirm: z.string().min(1, "Confirm your password."),
        phone: optionalPhoneSchema,
      })
      .refine((data) => data.password === data.confirm, {
        message: "Passwords do not match.",
        path: ["confirm"],
      })
      .safeParse({ email, password, confirm, phone });

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
      title="Accept your invite"
      subtitle="Enter your code and choose a password"
      footer={
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <VerifyCodeForm
        destination={email}
        submitLabel="Join the team"
        onSubmit={async (code) => {
          if (!validate()) {
            return { error: "Check the highlighted fields and try again." };
          }
          const result = await acceptInvite(email, code, password, phone || null);
          if (!result.error) {
            toast.success("Welcome aboard.");
            navigate("/dashboard", { replace: true });
          }
          return result;
        }}
        onResend={() => resendCode(email, "Invite")}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
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
          <Label htmlFor="invite-password">Choose a password</Label>
          <PasswordInput
            id="invite-password"
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
          <Label htmlFor="invite-confirm">Confirm password</Label>
          <PasswordInput
            id="invite-confirm"
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

        <div className="flex flex-col gap-2">
          <Label htmlFor="invite-phone">Phone number (optional)</Label>
          <PhoneInput
            id="invite-phone"
            value={phone}
            onValueChange={setPhone}
            aria-invalid={Boolean(fieldErrors.phone)}
          />
          {fieldErrors.phone && (
            <p className="text-[12px] font-medium text-destructive">
              {fieldErrors.phone}
            </p>
          )}
        </div>
      </VerifyCodeForm>
    </AuthShell>
  );
}
