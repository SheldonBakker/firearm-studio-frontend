import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/verified";
import { pageMeta } from "~/lib/utils/seo";
import { AuthShell } from "~/components/common/auth-shell";
import { Button } from "~/components/ui/button";
import { landingAuthParams } from "~/lib/api/supabase";
import { signOutUser } from "~/lib/auth/session-store";

export function meta({ location }: Route.MetaArgs) {
  return pageMeta({
    title: "Email verified - Firearm Studio",
    description: "Your Firearm Studio email address is confirmed.",
    pathname: location.pathname,
    noIndex: true,
  });
}

export async function clientLoader() {
  const failed = Boolean(
    landingAuthParams.error ?? landingAuthParams.error_code,
  );
  if (!failed) await signOutUser();
  return { failed };
}

export function HydrateFallback() {
  return (
    <AuthShell
      title="Confirming your email"
      subtitle="This will only take a moment"
    >
      <p className="text-center text-[13px] text-muted-foreground">
        Checking your confirmation link…
      </p>
    </AuthShell>
  );
}

export default function Verified({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();

  if (loaderData.failed) {
    return (
      <AuthShell
        title="Link expired"
        subtitle="This confirmation link is no longer valid"
        footer={
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Back to sign in
          </Link>
        }
      >
        <p className="text-center text-[13px] leading-relaxed text-muted-foreground">
          Confirmation links can only be used once and expire after a while.{" "}
          <Link to="/signup" className="font-semibold text-primary hover:underline">
            Sign up again
          </Link>{" "}
          to get a fresh link.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Your account has been verified"
      subtitle="Sign in to finish setting up your company"
      footer={
        <>
          Wrong account?{" "}
          <Link to="/signup" className="font-semibold text-primary hover:underline">
            Create another
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-center text-[13px] leading-relaxed text-muted-foreground">
          Your email address is confirmed. Sign in with the password you chose to
          continue.
        </p>
        <Button
          className="w-full"
          onClick={() => navigate("/login", { replace: true })}
        >
          Login
        </Button>
      </div>
    </AuthShell>
  );
}
