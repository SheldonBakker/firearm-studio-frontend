import { createRequestHandler } from "react-router";

// React Router handles every non-asset, non-/api request via SSR. Static files
// in build/client are served by the assets binding before the Worker runs.
const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    // Same-origin API proxy: forward `/api/...` to the configured backend so the
    // browser avoids CORS. `API_BASE_URL` comes from .dev.vars (dev) or
    // wrangler.jsonc vars (prod).
    if (url.pathname.startsWith("/api/")) {
      const base = (env.API_BASE_URL ?? "").replace(/\/+$/, "");
      if (!base) {
        return new Response("API_BASE_URL is not configured", { status: 502 });
      }
      const target = base + url.pathname + url.search;
      return fetch(new Request(target, request));
    }

    // No server-side loader in this app reads Cloudflare bindings (the dashboard
    // uses clientLoader guards), so the request handler needs no load context.
    return requestHandler(request);
  },
} satisfies ExportedHandler<Env>;
