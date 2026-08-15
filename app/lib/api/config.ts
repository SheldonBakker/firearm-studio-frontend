const BASE_URL = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ""
).replace(/\/$/, "");

export const API_KEY = import.meta.env.VITE_API_KEY as string | undefined;

export function apiUrl(
  path: string,
  query?: Record<string, string | number | undefined>,
): URL {
  const url = new URL(
    BASE_URL + path,
    BASE_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost"),
  );
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  return url;
}
