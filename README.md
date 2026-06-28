# Firearm Studio — Dashboard

Role-based storage & compliance dashboard for a firearm storage business.
Built with **React Router v7 (framework mode, SPA)**, **Supabase auth**,
**Tailwind + shadcn/ui**, and the Firearm Studio API (`swagger.json`).

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment — copy `.env.example` to `.env` and fill in:

   ```bash
   cp .env.example .env
   ```

   | Variable                 | Description                                   |
   | ------------------------ | --------------------------------------------- |
   | `VITE_SUPABASE_URL`      | Supabase project URL (Project Settings → API) |
   | `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key                      |
   | `VITE_API_BASE_URL`      | Firearm Studio API base URL                   |

3. Run the dev server (`http://localhost:5173`):

   ```bash
   npm run dev
   ```

## How it works

- **Auth** — email/password via Supabase. `app/lib/supabase.ts` holds the
  client; the access token is attached as a `Bearer` header to every API call
  (`app/lib/api.ts`). A `401` signs the user out.
- **Routing** — `/login`, `/signup`, `/onboarding`, then a guarded app layout
  (`app/routes/app-layout.tsx`) wrapping all dashboard pages. The layout's
  `clientLoader` requires a session and gates company onboarding.
- **Roles (RBAC)** — `app/lib/rbac.ts` maps `Owner / Admin / Clerk / Viewer`
  to visible nav sections and write capabilities. All roles share one
  dashboard; Team/Settings are Admin+, write actions are hidden for Viewers.
- **Onboarding** — after signup, new users complete a company form
  (`POST /api/v1/onboarding/company`). Because the API has no "get my company"
  read, onboarding completion is inferred by probing a protected resource.
- **Design** — dark theme ported from the Claude Design prototype into shadcn
  tokens in `app/app.css` (accent `#E8973C`, IBM Plex fonts).

## Scripts

```bash
npm run dev        # Vite dev server (HMR), proxies /api → VITE_API_PROXY_TARGET
npm run build      # production SPA build → build/client
npm run typecheck  # react-router typegen + wrangler types + tsc (app & worker)
npm run preview    # build + wrangler dev (preview the Worker locally)
npm run deploy     # build + wrangler deploy
npm run cf-typegen # regenerate worker-configuration.d.ts from wrangler.jsonc
```

## Deploy to Cloudflare Workers

The app deploys as a **Worker serving static assets** (the SPA) with a tiny
Worker script (`workers/app.ts`) that **proxies `/api/*` to the backend** so
the API is same-origin in production (no CORS) — mirroring the dev proxy.
Config lives in `wrangler.jsonc`:

- `assets` → serves `build/client` with SPA fallback (`not_found_handling: single-page-application`).
- `run_worker_first: ["/api/*"]` → the Worker handles API routes; assets serve everything else.

### Where the API URL comes from

The Worker reads `env.API_BASE_URL` at **runtime** to know where to proxy
`/api/*`. This is a **Worker var/secret** — it is *not* read from `.env`
(those `VITE_*` values are build-time client vars baked into the bundle by
Vite and are not visible to the Worker).

- **Local (`npm run preview` / `wrangler dev`):** read from `.dev.vars`
  (git-ignored), e.g. `API_BASE_URL=http://localhost:5146`.
- **Production:** set it as a secret before deploying (see below).

Keep `VITE_API_BASE_URL` **empty** in `.env` so the client calls same-origin
`/api`, which the Worker proxies. `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
are baked into the client bundle at build time.

### Steps

```bash
npx wrangler login                      # or: export CLOUDFLARE_API_TOKEN=...
npx wrangler secret put API_BASE_URL    # paste your production API URL
npm run deploy
```

> Notes
> - The backend at `API_BASE_URL` must accept the proxied requests (forwarded
>   with the original method, headers incl. `Authorization`, and body).
> - If `API_BASE_URL` is unset, the Worker returns `502` for `/api/*` (assets
>   still serve normally).
> - `wrangler types` regenerates `worker-configuration.d.ts` (git-ignored) —
>   rerun it (`npm run cf-typegen`) after editing `wrangler.jsonc`.
