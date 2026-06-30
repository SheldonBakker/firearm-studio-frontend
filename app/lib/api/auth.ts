import { redirect } from "react-router";
import { supabase } from "./supabase";
import { api, ApiError } from "./client";
import { normalizeRoles, type SessionUser } from "../utils/rbac";

export async function getSessionUser(): Promise<SessionUser | null> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;

  const u = data.session.user;
  const jwtRoles = u.app_metadata?.roles as string[] | undefined;

  if (jwtRoles?.length) {
    return {
      id: u.id,
      email: u.email ?? null,
      roles: normalizeRoles(jwtRoles),
    };
  }

  // Fallback: JWT has no roles claim — fetch from API
  try {
    const me = await api.me();
    return {
      id: me.id,
      email: me.email,
      roles: normalizeRoles(me.roles),
    };
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    return { id: u.id, email: u.email ?? null, roles: ["Viewer"] };
  }
}

export async function requireAuth(request: Request): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    const url = new URL(request.url);
    const next = encodeURIComponent(url.pathname + url.search);
    throw redirect(`/login?next=${next}`);
  }
  return user;
}

export async function refreshSession(): Promise<void> {
  await supabase.auth.refreshSession();
}

let companyAccess = false;
export function grantCompanyAccess() {
  companyAccess = true;
}
function resetCompanyAccess() {
  companyAccess = false;
}

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
