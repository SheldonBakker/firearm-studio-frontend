import { clearTokens, getAccessToken, refreshTokens } from "./auth";
import { apiUrl } from "./config";
import { ApiError, extractErrorMessage } from "./error";

export { ApiError };

export interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  skipAuthRedirect?: boolean;
  retried?: boolean;
}

function buildUrl(path: string, query?: RequestOptions["query"]): URL {
  return apiUrl(path, query);
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
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

  const send = (h: Record<string, string>) =>
    fetch(url.toString(), {
      method: opts.method ?? "GET",
      headers: h,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });

  let res = await send(headers);

  if (res.status === 401 && !opts.retried) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      res = await send({ ...headers, Authorization: `Bearer ${refreshed.accessToken}` });
    }
  }

  if (res.status === 401 && !opts.skipAuthRedirect) {
    clearTokens();
    if (typeof window !== "undefined") window.location.assign("/login");
    const { message, code, body } = await extractErrorMessage(res);
    throw new ApiError(401, message, body, code);
  }

  if (!res.ok) {
    const { message, code, body } = await extractErrorMessage(res);
    throw new ApiError(res.status, message, body, code);
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

  let res = await fetch(url.toString(), { method: opts.method ?? "GET", headers });

  if (res.status === 401 && !opts.retried) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      res = await fetch(url.toString(), {
        method: opts.method ?? "GET",
        headers: { ...headers, Authorization: `Bearer ${refreshed.accessToken}` },
      });
    }
  }

  if (res.status === 401 && !opts.skipAuthRedirect) {
    clearTokens();
    if (typeof window !== "undefined") window.location.assign("/login");
    const { message, code, body } = await extractErrorMessage(res);
    throw new ApiError(401, message, body, code);
  }

  if (!res.ok) {
    const { message, code, body } = await extractErrorMessage(res);
    throw new ApiError(res.status, message, body, code);
  }

  const blob = await res.blob();
  const filename = parseFilename(res.headers.get("Content-Disposition"));
  return { blob, filename };
}
