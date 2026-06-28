import { createRequestHandler } from "react-router";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (url.hostname === "www.firearmstudio.com") {
      url.hostname = "firearmstudio.com";
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname.startsWith("/api/")) {
      const base = (env.API_BASE_URL ?? "").replace(/\/+$/, "");
      if (!base) {
        return new Response("API_BASE_URL is not configured", { status: 502 });
      }
      const target = base + url.pathname + url.search;
      return fetch(new Request(target, request));
    }

    return requestHandler(request);
  },
} satisfies ExportedHandler<Env>;
