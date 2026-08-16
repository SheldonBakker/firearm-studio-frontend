# Firearm Studio - Dashboard

Role-based storage & compliance dashboard for a firearm storage business.
Built with **React Router v8 (framework mode, SPA)**, **Tailwind + shadcn/ui**,
and the Firearm Studio API (`swagger.json`).

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment - copy `.env.example` to `.env` and fill in:

   ```bash
   cp .env.example .env
   ```

   | Variable                    | Description                                       |
   | ---------------------------- | -------------------------------------------------- |
   | `VITE_API_BASE_URL`          | Firearm Studio API base URL (leave empty for same-origin `/api`, see below) |
   | `VITE_TURNSTILE_SITEKEY`     | Cloudflare Turnstile site key (contact form)       |
   | `VITE_TURNSTILE_WORKER_URL`  | Worker endpoint that verifies the Turnstile token  |

   > `VITE_*` variables are compiled into the client bundle at build time and
   > shipped to the browser. They are **not secret** - never put a value in a
   > `VITE_*` variable that must stay private.

   The `X-Api-Key` header is injected by the Worker (not the client bundle). Set
   it as a Worker secret - see the deploy steps below.

3. Run the dev server (`http://localhost:5173`):

   ```bash
   npm run dev
   ```

## How it works

- **Auth** - email/password (plus optional WhatsApp-based two-factor) against
  the Firearm Studio API, not a third-party auth provider. `app/lib/api/auth.ts`
  handles login/register/refresh/2FA and stores the access/refresh token pair;
  `app/lib/auth/session-store.ts` exposes the current session (a subscribable
  snapshot) to the rest of the app. Every API call attaches the access token
  as a `Bearer` header (`app/lib/api/http.ts`), transparently refreshes it
  when it's near expiry, and signs the user out on a `401`.
- **Routing** - `/login`, `/signup`, `/onboarding`, then a guarded app layout
  (`app/routes/app-layout.tsx`) wrapping all dashboard pages. The layout's
  `clientLoader` requires a session and gates company onboarding.
- **Roles (RBAC)** - `app/lib/utils/rbac.ts` maps `Admin / Manager / Staff /
  Viewer` to visible nav sections and write capabilities. All roles share one
  dashboard; Team/Settings/Audit are Admin-only, the Register nav is Staff+,
  and write actions are hidden for Viewers.
- **Onboarding** - after signup, new users complete a company form
  (`POST /api/v1/onboarding/company`). Because the API has no "get my company"
  read, onboarding completion is inferred by probing a protected resource.
- **Design** - dark theme ported from the Claude Design prototype into shadcn
  tokens in `app/app.css` (accent `#E8973C`, IBM Plex fonts).

## Scripts

```bash
npm run dev        # Vite dev server (HMR); Worker proxies /api/* to API_BASE_URL
npm run build      # production SPA build → build/client
npm run typecheck  # react-router typegen + wrangler types + tsc (app & worker)
npm run preview    # build + wrangler dev (preview the Worker locally)
npm run deploy     # build + wrangler deploy
npm run cf-typegen # regenerate worker-configuration.d.ts from wrangler.jsonc
```

## Project layout

```
app/
  routes/       route components (flat files, registered in app/routes.ts)
  lib/
    api/        typed API clients per resource, auth, http request wrapper
    auth/       session store (auth state, company-access probing)
    utils/      rbac, formatting, validation, phone/date/SA-ID helpers
  components/   shared UI (shadcn primitives + app-specific components)
workers/
  app.ts        Cloudflare Worker: serves the SPA, proxies /api/* to the API
```

## Deploy to Cloudflare Workers

The app deploys as a **Worker serving static assets** (the SPA) with a tiny
Worker script (`workers/app.ts`) that **proxies `/api/*` to the backend** so
the API is same-origin (no CORS). Config lives in `wrangler.jsonc`:

- `assets` → serves `build/client` with SPA fallback (`not_found_handling: single-page-application`).
- `run_worker_first: ["/api/*"]` → the Worker handles API routes; assets serve everything else.

### Where the API URL comes from

The Worker reads `env.API_BASE_URL` at **runtime** to know where to proxy
`/api/*`. This is a **Worker var/secret** - it is *not* read from `.env`
(those `VITE_*` values are build-time client vars baked into the bundle by
Vite and are not visible to the Worker). The Cloudflare Vite plugin runs this
same Worker during `npm run dev`, so the proxy behaves the same in dev and in
production - only where `API_BASE_URL` comes from differs:

- **Local (`npm run dev` / `npm run preview`):** read from `.dev.vars`
  (git-ignored), e.g. `API_BASE_URL=http://localhost:5146`.
- **Production:** set it as a secret before deploying (see below), or via the
  `vars.API_BASE_URL` default in `wrangler.jsonc`.

Keep `VITE_API_BASE_URL` **empty** in `.env` so the client calls same-origin
`/api`, which the Worker proxies.

### Steps

```bash
npx wrangler login                      # or: export CLOUDFLARE_API_TOKEN=...
npx wrangler secret put API_BASE_URL    # paste your production API URL
npx wrangler secret put API_KEY         # paste your shared API key
npm run deploy
```

For local dev (`npm run dev`), add `API_KEY=your-api-key` to `.dev.vars` alongside `API_BASE_URL`.

> Notes
> - The backend at `API_BASE_URL` must accept the proxied requests (forwarded
>   with the original method, headers incl. `Authorization`, and body).
> - If `API_BASE_URL` is unset, the Worker returns `502` for `/api/*` (assets
>   still serve normally).
> - `wrangler types` regenerates `worker-configuration.d.ts` (git-ignored) -
>   rerun it (`npm run cf-typegen`) after editing `wrangler.jsonc`.
