import { API_KEY, apiUrl } from "./config";
import { ApiError, extractErrorMessage } from "./error";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: string;
}

export const AUTH_STORAGE_KEY = "fs-auth";

const REFRESH_SKEW_MS = 30_000;

const listeners = new Set<() => void>();

export function subscribeToTokens(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((l) => l());
}

export function readTokens(): AuthTokens | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthTokens>;
    if (!parsed.accessToken || !parsed.refreshToken || !parsed.accessExpiresAt) {
      return null;
    }
    return parsed as AuthTokens;
  } catch {
    return null;
  }
}

function storeTokens(tokens: AuthTokens) {
  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokens));
  } catch {
  }
  notify();
}

export function clearTokens() {
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
  }
  notify();
}

export interface JwtClaims {
  sub?: string;
  email?: string;
  company_id?: string;
  exp?: number;
  [key: string]: unknown;
}

const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

export function decodeAccessToken(token: string): JwtClaims | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalised = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalised + "=".repeat((4 - (normalised.length % 4)) % 4);
    return JSON.parse(atob(padded)) as JwtClaims;
  } catch {
    return null;
  }
}

export function rolesFromClaims(claims: JwtClaims | null): string[] {
  if (!claims) return [];
  const raw = claims[ROLE_CLAIM] ?? claims.role;
  if (Array.isArray(raw)) return raw.filter((r): r is string => typeof r === "string");
  return typeof raw === "string" ? [raw] : [];
}

async function authRequest<T>(path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (API_KEY) headers["X-Api-Key"] = API_KEY;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(apiUrl(path).toString(), {
    method: "POST",
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const { message, body: errBody } = await extractErrorMessage(res);
    throw new ApiError(res.status, message, errBody);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

let refreshInflight: Promise<AuthTokens | null> | null = null;

export function refreshTokens(): Promise<AuthTokens | null> {
  const current = readTokens();
  if (!current) return Promise.resolve(null);

  refreshInflight ??= authRequest<AuthTokens>("/api/v1/auth/refresh", {
    refreshToken: current.refreshToken,
  })
    .then((tokens) => {
      storeTokens(tokens);
      return tokens;
    })
    .catch(() => {
      clearTokens();
      return null;
    })
    .finally(() => {
      refreshInflight = null;
    });

  return refreshInflight;
}

export async function getAccessToken(): Promise<string | null> {
  const tokens = readTokens();
  if (!tokens) return null;

  const expiresAt = Date.parse(tokens.accessExpiresAt);
  if (Number.isNaN(expiresAt) || expiresAt - REFRESH_SKEW_MS > Date.now()) {
    return tokens.accessToken;
  }

  const refreshed = await refreshTokens();
  return refreshed?.accessToken ?? null;
}

export const authApi = {
  register: (email: string, password: string) =>
    authRequest<void>("/api/v1/auth/register", { email, password }),

  verifyEmail: async (email: string, code: string) => {
    const tokens = await authRequest<AuthTokens>("/api/v1/auth/verify-email", {
      email,
      code,
    });
    storeTokens(tokens);
    return tokens;
  },

  resendCode: (email: string, purpose: "EmailConfirmation" | "PasswordReset" | "Invite") =>
    authRequest<void>("/api/v1/auth/resend-code", { email, purpose }),

  login: async (email: string, password: string) => {
    const tokens = await authRequest<AuthTokens>("/api/v1/auth/login", {
      email,
      password,
    });
    storeTokens(tokens);
    return tokens;
  },

  logout: async () => {
    const current = readTokens();
    clearTokens();
    if (!current) return;
    try {
      await authRequest<void>("/api/v1/auth/logout", {
        refreshToken: current.refreshToken,
      });
    } catch {
    }
  },

  forgotPassword: (email: string) =>
    authRequest<void>("/api/v1/auth/forgot-password", { email }),

  resetPassword: (email: string, code: string, newPassword: string) =>
    authRequest<void>("/api/v1/auth/reset-password", { email, code, newPassword }),

  acceptInvite: async (email: string, code: string, password: string) => {
    const tokens = await authRequest<AuthTokens>("/api/v1/auth/accept-invite", {
      email,
      code,
      password,
    });
    storeTokens(tokens);
    return tokens;
  },
};
