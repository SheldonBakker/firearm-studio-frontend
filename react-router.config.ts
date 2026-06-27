import type { Config } from "@react-router/dev/config";

export default {
  // Auth-gated dashboard: render as an SPA so the Supabase session
  // (stored in localStorage) is available to clientLoader guards.
  ssr: false,
} satisfies Config;
