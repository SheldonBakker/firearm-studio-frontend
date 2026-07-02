import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { redirect, useRouteLoaderData } from "react-router";
import { supabase } from "~/lib/api/supabase";
import { api, ApiError } from "~/lib/api/client";
import { normalizeRoles, type SessionUser } from "~/lib/utils/rbac";

// Last resolved session user. Route clientLoaders call getSessionUser() during
// the loader phase (via requireAuth), warming this before AuthProvider first
// renders — so the provider seeds synchronously with no flash and without
// repeating the resolution. Reset on a hard reload (module re-init).
let cachedUser: SessionUser | null = null;

async function resolveSessionUser(): Promise<SessionUser | null> {
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

export async function getSessionUser(): Promise<SessionUser | null> {
  cachedUser = await resolveSessionUser();
  return cachedUser;
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

async function signOut(): Promise<void> {
  resetCompanyAccess();
  await supabase.auth.signOut();
}

// ---------------------------------------------------------------------------
// React context — render-time auth for components.
// ---------------------------------------------------------------------------

interface AuthContextValue {
  isLoggedIn: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error: string | null; hasSession: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Seed from the cache warmed by route loaders (see cachedUser) so authenticated
  // routes and client navigations render the correct state with no flash.
  const [user, setUser] = useState<SessionUser | null>(() => cachedUser);

  useEffect(() => {
    let active = true;

    // Cold cache (e.g. a prerendered public page, where no clientLoader ran):
    // resolve the session once so the header can reflect a logged-in visitor.
    if (cachedUser === null) {
      getSessionUser().then((u) => {
        if (active) setUser(u);
      });
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "INITIAL_SESSION") return; // already seeded above
      if (event === "SIGNED_OUT" || !session) {
        resetCompanyAccess();
        cachedUser = null;
        setUser(null);
        return;
      }
      // Supabase warns against awaiting other auth calls synchronously inside
      // this callback — defer the (possibly networked) user resolution.
      setTimeout(() => {
        getSessionUser().then((u) => {
          if (active) setUser(u);
        });
      }, 0);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, fullName: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      return { error: error?.message ?? null, hasSession: !!data.session };
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ isLoggedIn: !!user, signIn, signUp, signOut }),
    [user, signIn, signUp],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth used outside AuthProvider");
  return ctx;
}

export function useSessionUser(): SessionUser {
  const data = useRouteLoaderData("routes/app-layout") as
    | { user: SessionUser }
    | undefined;
  if (!data) throw new Error("useSessionUser used outside the app layout");
  return data.user;
}
