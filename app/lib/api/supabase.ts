import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  // Surfaced clearly during dev so a missing .env is obvious.
  console.warn(
    "[supabase] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. " +
      "Copy .env.example to .env and fill in your project credentials.",
  );
}

const projectRef = new URL(url ?? "http://localhost").hostname.split(".")[0];
export const SUPABASE_STORAGE_KEY = `sb-${projectRef}-auth-token`;

export const supabase = createClient(url ?? "http://localhost", anonKey ?? "public-anon-key", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: SUPABASE_STORAGE_KEY,
  },
});

/** Returns the current access token, refreshing the session if needed. */
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
