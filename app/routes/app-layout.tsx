import { Outlet, redirect, useRouteLoaderData } from "react-router";
import type { Route } from "./+types/app-layout";
import { getSessionUser, hasCompanyAccess, requireAuth } from "~/lib/auth";
import type { SessionUser } from "~/lib/rbac";
import { Sidebar } from "~/components/layout/sidebar";
import { Topbar } from "~/components/layout/topbar";

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  await requireAuth(request);

  // No "get my company" endpoint exists, so infer onboarding state by probing a
  // protected resource. A 403 means the JWT lacks company claims — hasCompanyAccess
  // refreshes the session once and retries before concluding onboarding is needed.
  if (!(await hasCompanyAccess())) throw redirect("/onboarding");

  // Re-read the user after any token refresh so roles reflect the latest claims.
  const user = (await getSessionUser())!;
  return { user };
}

/** Read the authenticated session user from any route under the app layout. */
export function useSessionUser(): SessionUser {
  const data = useRouteLoaderData("routes/app-layout") as
    | { user: SessionUser }
    | undefined;
  if (!data) throw new Error("useSessionUser used outside the app layout");
  return data.user;
}

export default function AppLayout({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} />
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
