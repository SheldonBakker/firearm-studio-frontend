import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useRouteLoaderData } from "react-router";
import { supabase } from "~/lib/api/supabase";
import type { SessionUser } from "~/lib/utils/rbac";
import {
  getServerSnapshot,
  getSessionUser,
  getSnapshot,
  signOutUser,
  subscribe,
  type AuthStatus,
} from "~/lib/auth/session-store";

export {
  getSessionUser,
  requireAuth,
  refreshSession,
  hasCompanyAccess,
  grantCompanyAccess,
} from "~/lib/auth/session-store";

interface AuthContextValue {
  status: AuthStatus;
  user: SessionUser | null;
  isLoggedIn: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error: string | null; hasSession: boolean }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    await getSessionUser({ refresh: true });
    return { error: null };
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

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error?.message ?? null };
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error?.message ?? null };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status: snap.status,
      user: snap.user,
      isLoggedIn: snap.status === "authenticated",
      signIn,
      signUp,
      resetPassword,
      updatePassword,
      signOut: signOutUser,
    }),
    [snap, signIn, signUp, resetPassword, updatePassword],
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
