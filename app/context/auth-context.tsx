import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useRouteLoaderData } from "react-router";
import { authApi } from "~/lib/api/auth";
import { ApiError } from "~/lib/api/http";
import type { SessionUser } from "~/lib/utils/rbac";
import {
  adoptSession,
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

type Result = { error: string | null };

interface AuthContextValue {
  status: AuthStatus;
  user: SessionUser | null;
  isLoggedIn: boolean;
  signIn: (email: string, password: string) => Promise<Result>;
  signUp: (email: string, password: string) => Promise<Result>;
  verifyEmail: (email: string, code: string) => Promise<Result>;
  resendCode: (
    email: string,
    purpose: "EmailConfirmation" | "PasswordReset" | "Invite",
  ) => Promise<Result>;
  requestPasswordReset: (email: string) => Promise<Result>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<Result>;
  acceptInvite: (email: string, code: string, password: string) => Promise<Result>;
  signOut: () => Promise<void>;
}

function messageFor(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return err instanceof Error ? err.message : "Something went wrong. Try again.";
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      await authApi.login(email, password);
      await adoptSession();
      return { error: null };
    } catch (err) {
      return { error: messageFor(err) };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      await authApi.register(email, password);
      return { error: null };
    } catch (err) {
      return { error: messageFor(err) };
    }
  }, []);

  const verifyEmail = useCallback(async (email: string, code: string) => {
    try {
      await authApi.verifyEmail(email, code);
      await adoptSession();
      return { error: null };
    } catch (err) {
      return { error: messageFor(err) };
    }
  }, []);

  const resendCode = useCallback(
    async (
      email: string,
      purpose: "EmailConfirmation" | "PasswordReset" | "Invite",
    ) => {
      try {
        await authApi.resendCode(email, purpose);
        return { error: null };
      } catch (err) {
        return { error: messageFor(err) };
      }
    },
    [],
  );

  const requestPasswordReset = useCallback(async (email: string) => {
    try {
      await authApi.forgotPassword(email);
      return { error: null };
    } catch (err) {
      return { error: messageFor(err) };
    }
  }, []);

  const resetPassword = useCallback(
    async (email: string, code: string, newPassword: string) => {
      try {
        await authApi.resetPassword(email, code, newPassword);
        return { error: null };
      } catch (err) {
        return { error: messageFor(err) };
      }
    },
    [],
  );

  const acceptInvite = useCallback(
    async (email: string, code: string, password: string) => {
      try {
        await authApi.acceptInvite(email, code, password);
        await adoptSession();
        return { error: null };
      } catch (err) {
        return { error: messageFor(err) };
      }
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status: snap.status,
      user: snap.user,
      isLoggedIn: snap.status === "authenticated",
      signIn,
      signUp,
      verifyEmail,
      resendCode,
      requestPasswordReset,
      resetPassword,
      acceptInvite,
      signOut: signOutUser,
    }),
    [
      snap,
      signIn,
      signUp,
      verifyEmail,
      resendCode,
      requestPasswordReset,
      resetPassword,
      acceptInvite,
    ],
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
