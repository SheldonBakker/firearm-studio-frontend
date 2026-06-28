export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      const base = (env.API_BASE_URL ?? "").replace(/\/+$/, "");
      if (!base) {
        return new Response("API_BASE_URL is not configured", { status: 502 });
      }
      const target = base + url.pathname + url.search;
      return fetch(new Request(target, request));
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
