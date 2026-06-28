import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  // The Cloudflare plugin runs the Worker (workers/app.ts) inside workerd for
  // both dev and build, so SSR happens on the same runtime as production. The
  // Worker also proxies `/api/*` using `API_BASE_URL` (from .dev.vars in dev,
  // wrangler.jsonc vars in prod), which replaces the old Vite dev proxy.
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    reactRouter(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
});
