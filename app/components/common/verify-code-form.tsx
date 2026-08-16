import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

const RESEND_COOLDOWN_SECONDS = 60;

interface VerifyCodeFormProps {
  destination: string;
  submitLabel?: string;
  onSubmit: (code: string) => Promise<{ error: string | null }>;
  onResend?: () => Promise<{ error: string | null }>;
  allowResend?: boolean;
  children?: React.ReactNode;
}

export function VerifyCodeForm({
  destination,
  submitLabel = "Verify",
  onSubmit,
  onResend,
  allowResend = true,
  children,
}: VerifyCodeFormProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const resendEnabled = allowResend && Boolean(onResend);

  useEffect(() => {
    if (!resendEnabled || cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown, resendEnabled]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!/^\d{6}$/.test(code)) {
      setError("Enter the six-digit code we sent you.");
      return;
    }

    setLoading(true);
    const result = await onSubmit(code);
    setLoading(false);
    if (result.error) setError(result.error);
  }

  async function resend() {
    if (!onResend) return;
    setError(null);
    setNotice(null);
    setCooldown(RESEND_COOLDOWN_SECONDS);
    const result = await onResend();
    setNotice(
      result.error
        ? null
        : "If that destination can receive a code, a new one is on its way.",
    );
    if (result.error) setError(result.error);
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <p className="text-center text-[13px] leading-relaxed text-muted-foreground">
        We sent a six-digit code to{" "}
        <span className="text-foreground">{destination}</span>. It expires in 15 minutes.
      </p>

      <div className="flex flex-col gap-2">
        <Label htmlFor="code">Verification code</Label>
        <Input
          id="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
            setError(null);
          }}
          placeholder="123456"
          className="text-center text-lg tracking-[0.5em]"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "code-error" : undefined}
        />
        {error && (
          <p id="code-error" className="text-[12px] font-medium text-destructive">
            {error}
          </p>
        )}
        {notice && (
          <p className="text-[12px] font-medium text-muted-foreground">{notice}</p>
        )}
      </div>

      {children}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Checking…" : submitLabel}
      </Button>

      {resendEnabled && (
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0}
          className="text-[13px] font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
        </button>
      )}
    </form>
  );
}
