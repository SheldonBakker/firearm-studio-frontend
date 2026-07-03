import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useMatches,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { Toaster } from "~/components/ui/sonner";
import { AppShellSkeleton } from "~/components/common/skeletons";
import { PageWrap, ErrorState } from "~/components/common/misc";
import { ApiError } from "~/lib/api/http";
import { AuthProvider } from "~/context/auth-context";
import { SiteHeader } from "~/components/marketing/site-header";
import { SiteFooter } from "~/components/marketing/site-footer";

export const meta: Route.MetaFunction = () => [{ title: "Firearm Studio" }];

const KLAVIYO_COMPANY_ID = "Thy6Vv";
const KLAVIYO_INIT = `!function(){if(!window.klaviyo){window._klOnsite=window._klOnsite||[];try{window.klaviyo=new Proxy({},{get:function(n,i){return"push"===i?function(){var n;(n=window._klOnsite).push.apply(n,arguments)}:function(){for(var n=arguments.length,o=new Array(n),w=0;w<n;w++)o[w]=arguments[w];var t="function"==typeof o[o.length-1]?o.pop():void 0,e=new Promise((function(n){window._klOnsite.push([i].concat(o,[function(i){t&&t(i),n(i)}]))}));return e}}})}catch(n){window.klaviyo=window.klaviyo||[],window.klaviyo.push=function(){var n;(n=window._klOnsite).push.apply(n,arguments)}}}}();`;

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0e1116" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <Toaster position="bottom-center" />
        <ScrollRestoration />
        <script
          async
          type="text/javascript"
          src={`https://static.klaviyo.com/onsite/js/${KLAVIYO_COMPANY_ID}/klaviyo.js?company_id=${KLAVIYO_COMPANY_ID}`}
        />
        <script dangerouslySetInnerHTML={{ __html: KLAVIYO_INIT }} />
        <Scripts />
      </body>
    </html>
  );
}

function SiteChrome({ children }: { children: React.ReactNode }) {
  const inApp = useMatches().some((m) => m.id === "routes/app-layout");
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      {!inApp && <SiteFooter />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SiteChrome>
        <Outlet />
      </SiteChrome>
    </AuthProvider>
  );
}

export function HydrateFallback() {
  return <AppShellSkeleton />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || `Error ${error.status}`;
  } else if (error instanceof ApiError) {
    details = error.message;
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <AuthProvider>
      <SiteChrome>
        <PageWrap>
          <ErrorState message={details} onBack={() => window.history.back()} />
          {stack && (
            <pre className="mt-4 w-full overflow-x-auto rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
              <code>{stack}</code>
            </pre>
          )}
        </PageWrap>
      </SiteChrome>
    </AuthProvider>
  );
}
