import { getAccessToken, supabase } from "./supabase";

const BASE_URL = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ""
).replace(/\/$/, "");

const API_KEY = import.meta.env.VITE_API_KEY as string | undefined;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  skipAuthRedirect?: boolean;
}

export async function request<T>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const token = await getAccessToken();
  const url = new URL(BASE_URL + path, BASE_URL || window.location.origin);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (API_KEY) headers["X-Api-Key"] = API_KEY;
  if (token) headers.Authorization = `Bearer ${token}`;
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(url.toString(), {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 401 && !opts.skipAuthRedirect) {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") window.location.assign("/login");
    throw new ApiError(401, "Unauthorized");
  }

  if (!res.ok) {
    let body: unknown;
    let message = `${res.status} ${res.statusText}`;
    try {
      body = await res.json();
      if (body && typeof body === "object") {
        const m =
          (body as Record<string, unknown>).detail ??
          (body as Record<string, unknown>).message ??
          (body as Record<string, unknown>).title;
        if (typeof m === "string") message = m;
      }
    } catch {
    }
    throw new ApiError(res.status, message, body);
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
