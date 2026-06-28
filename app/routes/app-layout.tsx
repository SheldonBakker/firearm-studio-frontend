import { useState } from "react";
import { Outlet, redirect, useRouteLoaderData } from "react-router";
import type { Route } from "./+types/app-layout";
import { getSessionUser, hasCompanyAccess, requireAuth } from "~/lib/auth";
import type { SessionUser } from "~/lib/rbac";
import { Sidebar, MobileSidebar } from "~/components/layout/sidebar";
import { Topbar } from "~/components/layout/topbar";
import { AppShellSkeleton } from "~/components/common/skeletons";

export function meta() {
  return [
    { title: "Dashboard — Firearm Studio" },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  await requireAuth(request);

  if (!(await hasCompanyAccess())) throw redirect("/onboarding");

  const user = (await getSessionUser())!;
  return { user };
}

export function HydrateFallback() {
  return <AppShellSkeleton />;
}

export function useSessionUser(): SessionUser {
  const data = useRouteLoaderData("routes/app-layout") as
    | { user: SessionUser }
    | undefined;
  if (!data) throw new Error("useSessionUser used outside the app layout");
  return data.user;
}

export default function AppLayout({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;
  const [navOpen, setNavOpen] = useState(false);
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <Sidebar user={user} />
      <MobileSidebar user={user} open={navOpen} onOpenChange={setNavOpen} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} onMenuClick={() => setNavOpen(true)} />
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
