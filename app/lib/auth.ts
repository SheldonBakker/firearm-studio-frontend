import { redirect } from "react-router";
import { supabase } from "./supabase";
import { api, ApiError } from "./api";
import { normalizeRoles, type SessionUser } from "./rbac";

/** Returns the signed-in user (with API roles) or null if no session. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;

  try {
    const me = await api.me();
    return {
      id: me.id,
      email: me.email,
      roles: normalizeRoles(me.roles),
    };
  } catch (err) {
    // 401 is handled inside the api layer (sign-out + redirect).
    if (err instanceof ApiError && err.status === 401) return null;
    // API reachable but /me failed: fall back to the Supabase identity so the
    // app still renders (read-only) rather than bouncing to login.
    const u = data.session.user;
    return { id: u.id, email: u.email ?? null, roles: ["Viewer"] };
  }
}

/** clientLoader guard: require a session, else redirect to /login. */
export async function requireAuth(request: Request): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    const url = new URL(request.url);
    const next = encodeURIComponent(url.pathname + url.search);
    throw redirect(`/login?next=${next}`);
  }
  return user;
}

/** Force-refresh the Supabase session so the JWT picks up new claims
 *  (the API only emits company/role claims after the company is joined). */
export async function refreshSession(): Promise<void> {
  await supabase.auth.refreshSession();
}

// Cached within the page session: once we know the user can reach company
// resources we skip the probe on subsequent navigations.
let companyAccess = false;
export function grantCompanyAccess() {
  companyAccess = true;
}
export function resetCompanyAccess() {
  companyAccess = false;
}

/**
 * Whether the signed-in user already belongs to a company. Reads the canonical
 * GET /api/v1/company endpoint:
 *   - 200 with a company  → onboarded
 *   - 404 / no company    → needs onboarding
 *   - 403                 → JWT lacks company claims (fresh signup): refresh the
 *                           session once and retry before deciding
 *   - other/connectivity  → returns `true` so a transient API outage doesn't
 *                           trap the user on the onboarding screen
 */
export async function hasCompanyAccess(): Promise<boolean> {
  if (companyAccess) return true;

  const probe = async (): Promise<"ok" | "forbidden" | "missing" | "error"> => {
    try {
      const company = await api.company();
      return company && company.id ? "ok" : "missing";
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403) return "forbidden";
        if (err.status === 404) return "missing";
      }
      return "error";
    }
  };

  let result = await probe();
  if (result === "forbidden") {
    await refreshSession();
    result = await probe();
  }

  if (result === "ok") {
    companyAccess = true;
    return true;
  }
  if (result === "forbidden" || result === "missing") return false;
  return true; // connectivity error - don't trap in onboarding
}

export async function signOut(): Promise<void> {
  resetCompanyAccess();
  await supabase.auth.signOut();
}
