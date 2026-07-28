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

function buildUrl(path: string, query?: RequestOptions["query"]): URL {
  const url = new URL(BASE_URL + path, BASE_URL || window.location.origin);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  return url;
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {};
  if (API_KEY) headers["X-Api-Key"] = API_KEY;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function extractErrorMessage(res: Response): Promise<{
  message: string;
  body?: unknown;
}> {
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
  return { message, body };
}

export async function request<T>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const url = buildUrl(path, opts.query);
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(await authHeaders()),
  };
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
    const { message, body } = await extractErrorMessage(res);
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

export interface BlobResponse {
  blob: Blob;
  filename: string | null;
}

function parseFilename(disposition: string | null): string | null {
  if (!disposition) return null;
  const match = /filename\*?=(?:UTF-8'')?"?([^;"]+)"?/i.exec(disposition);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function requestBlob(
  path: string,
  opts: RequestOptions = {},
): Promise<BlobResponse> {
  const url = buildUrl(path, opts.query);
  const headers = await authHeaders();

  const res = await fetch(url.toString(), {
    method: opts.method ?? "GET",
    headers,
  });

  if (res.status === 401 && !opts.skipAuthRedirect) {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") window.location.assign("/login");
    throw new ApiError(401, "Unauthorized");
  }

  if (!res.ok) {
    const { message, body } = await extractErrorMessage(res);
    throw new ApiError(res.status, message, body);
  }

  const blob = await res.blob();
  const filename = parseFilename(res.headers.get("Content-Disposition"));
  return { blob, filename };
}
