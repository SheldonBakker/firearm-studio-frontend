import { useState } from "react";
import { Outlet, redirect } from "react-router";
import type { Route } from "./+types/app-layout";
import { hasCompanyAccess, requireAuth } from "~/context/auth-context";
import { Sidebar, MobileSidebar } from "~/components/layout/sidebar";
import { Topbar } from "~/components/layout/topbar";
import { PageActionsProvider } from "~/context/page-actions";
import { AppShellSkeleton } from "~/components/common/skeletons";

export function meta() {
  return [
    { title: "Dashboard - Firearm Studio" },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const user = await requireAuth(request);

  if (!(await hasCompanyAccess())) throw redirect("/onboarding");

  return { user };
}

export function HydrateFallback() {
  return <AppShellSkeleton />;
}

export default function AppLayout({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;
  const [navOpen, setNavOpen] = useState(false);
  return (
    // 63px = sticky SiteHeader height (14px padding ×2 + 34px row + 1px border)
    <div className="flex h-[calc(100dvh-63px)] w-full overflow-hidden bg-background text-foreground">
      <Sidebar user={user} />
      <MobileSidebar user={user} open={navOpen} onOpenChange={setNavOpen} />
      <PageActionsProvider>
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenuClick={() => setNavOpen(true)} />
          <div className="flex-1 overflow-y-auto">
            <Outlet />
          </div>
        </div>
      </PageActionsProvider>
    </div>
  );
}
