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
npm run dev        # dev server (HMR)
npm run build      # production SPA build
npm run typecheck  # react-router typegen + tsc
```
