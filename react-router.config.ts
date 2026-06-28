import type { Config } from "@react-router/dev/config";

export default {
  // Server-side rendering is enabled so the public marketing and legal pages
  // (home, about, contact, privacy, terms, …) are served as fully-rendered HTML
  // for SEO and fast first paint. The auth-gated dashboard remains a
  // client-rendered island: its routes keep `clientLoader` guards that read the
  // Supabase session from localStorage and render through a `HydrateFallback`.
  ssr: true,
} satisfies Config;
