import { redirect } from "react-router";
import {
  AUTH_STORAGE_KEY,
  authApi,
  decodeAccessToken,
  readTokens,
  refreshTokens,
  rolesFromClaims,
  subscribeToTokens,
} from "~/lib/api/auth";
import { ApiError } from "~/lib/api/http";
import { meApi } from "~/lib/api/me/me";
import { companyApi } from "~/lib/api/company/company";
import { normalizeRoles, type SessionUser } from "~/lib/utils/rbac";
import { clearAllCarts } from "~/lib/booking/cart";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthSnapshot {
  status: AuthStatus;
  user: SessionUser | null;
}

const SERVER_SNAPSHOT: AuthSnapshot = { status: "loading", user: null };

let snapshot: AuthSnapshot = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): AuthSnapshot {
  return snapshot;
}

export function getServerSnapshot(): AuthSnapshot {
  return SERVER_SNAPSHOT;
}

function sameUser(a: SessionUser | null, b: SessionUser | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.id === b.id &&
    a.email === b.email &&
    a.roles.length === b.roles.length &&
    a.roles.every((r, i) => r === b.roles[i])
  );
}

function publish(user: SessionUser | null) {
  const status: AuthStatus = user ? "authenticated" : "unauthenticated";
  if (snapshot.status === status && sameUser(snapshot.user, user)) return;
  snapshot = { status, user };
  listeners.forEach((l) => l());
}

function userFromToken(accessToken: string): SessionUser | null {
  const claims = decodeAccessToken(accessToken);
  if (!claims?.sub) return null;
  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
    roles: normalizeRoles(rolesFromClaims(claims)),
  };
}

async function resolveSessionUser(): Promise<SessionUser | null> {
  const tokens = readTokens();
  if (!tokens) return null;

  const fromToken = userFromToken(tokens.accessToken);
  if (!fromToken) return null;

  if (fromToken.roles.length) return fromToken;

  try {
    const me = await meApi.me();
    return { id: me.id, email: me.email, roles: normalizeRoles(me.roles) };
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    return fromToken;
  }
}

let inflight: Promise<SessionUser | null> | null = null;
let resolved = false;
let sessionSeq = 0;

export function getSessionUser(options?: {
  refresh?: boolean;
}): Promise<SessionUser | null> {
  if (resolved && !options?.refresh && !inflight) {
    return Promise.resolve(snapshot.user);
  }
  const seq = sessionSeq;
  inflight ??= resolveSessionUser()
    .then((user) => {
      if (sessionSeq !== seq) return snapshot.user;
      resolved = true;
      publish(user);
      return user;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
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
  await refreshTokens();
  await getSessionUser({ refresh: true });
}

let companyAccess: boolean | null = null;
let companyProbe: Promise<boolean> | null = null;

export function grantCompanyAccess() {
  companyAccess = true;
}

function resetCompanyAccess() {
  companyAccess = null;
  companyProbe = null;
}

async function probeCompanyAccess(): Promise<boolean | null> {
  if (!snapshot.user && !(await getSessionUser())) return null;

  const probe = async (): Promise<"ok" | "forbidden" | "missing" | "error"> => {
    try {
      const company = await companyApi.get();
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

  if (result === "ok") return true;
  if (result === "forbidden" || result === "missing") return false;
  return null;
}

export function hasCompanyAccess(): Promise<boolean> {
  if (companyAccess !== null) return Promise.resolve(companyAccess);

  companyProbe ??= probeCompanyAccess()
    .then((ok) => {
      if (ok === null) return false;
      companyAccess = ok;
      return ok;
    })
    .finally(() => {
      companyProbe = null;
    });

  return companyProbe;
}

export async function signOutUser(): Promise<void> {
  sessionSeq++;
  inflight = null;
  resetCompanyAccess();
  clearAllCarts();
  resolved = false;
  publish(null);
  await authApi.logout();
}

export async function adoptSession(): Promise<SessionUser | null> {
  resetCompanyAccess();
  resolved = false;
  return getSessionUser({ refresh: true });
}

if (typeof window !== "undefined") {
  const tokens = readTokens();
  const seeded = tokens ? userFromToken(tokens.accessToken) : null;
  snapshot = seeded
    ? { status: "authenticated", user: seeded }
    : { status: "unauthenticated", user: null };

  subscribeToTokens(() => {
    const current = readTokens();
    if (!current) {
      resetCompanyAccess();
      resolved = false;
      publish(null);
      return;
    }
    const user = userFromToken(current.accessToken);
    if (user && !sameUser(user, snapshot.user)) publish(user);
  });

  window.addEventListener("storage", (event) => {
    if (event.key !== AUTH_STORAGE_KEY) return;
    resolved = false;
    void getSessionUser({ refresh: true });
  });
}
