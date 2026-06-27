import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Dev proxy: the browser calls same-origin `/api/...`, Vite forwards to the
  // real API server-side. This sidesteps CORS during local development.
  const target = env.VITE_API_PROXY_TARGET || "http://localhost:5146";

  return {
    plugins: [tailwindcss(), reactRouter()],
    resolve: {
      tsconfigPaths: true,
    },
    server: {
      proxy: {
        "/api": { target, changeOrigin: true, secure: false },
      },
    },
  };
});
