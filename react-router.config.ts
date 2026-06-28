import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
  prerender: [
    "/",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/popia",
    "/fca-notice",
  ],
} satisfies Config;
