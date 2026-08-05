import { useCallback, useRef, type MutableRefObject } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import type { LiffLoginRequest, LiffLoginResponse, User } from "@/types/auth";
import {
  getLiffAccessToken,
  initializeLiff,
  isLiffEnabled,
  liffLogin,
} from "@/lib/liff";

export const authKeys = {
  me: ["auth", "me"] as const,
};

/**
 * Resolve the current session.
 * Returns the user when authenticated, or null when not.
 * May navigate the browser away (LIFF login redirect); in that case the
 * promise stays pending until the page unloads, keeping the query loading.
 */
async function resolveSession(
  liffAttemptedRef: MutableRefObject<boolean>,
): Promise<User | null> {
  const response = await apiFetch("/auth/me");

  if (response.ok) {
    const userData = (await response.json()) as User;
    return userData;
  }

  if (liffAttemptedRef.current || !isLiffEnabled()) {
    return null;
  }
  liffAttemptedRef.current = true;

  const liffState = await initializeLiff();

  if (!liffState.isInitialized) {
    return null;
  }

  if (liffState.isInClient && !liffState.isLoggedIn) {
    try {
      // 正常情況會立即跳轉到 LINE Login，回來後重新走 useAuth。
      await liffLogin(window.location.href);
      return null;
    } catch {
      return null;
    }
  }

  if (!liffState.isLoggedIn) {
    return null;
  }

  const accessToken = await getLiffAccessToken();
  if (!accessToken) {
    return null;
  }

  const payload: LiffLoginRequest = { accessToken };
  const loginResponse = await apiFetch("/auth/liff/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (loginResponse.ok) {
    const userData = (await loginResponse.json()) as LiffLoginResponse;
    return userData;
  }

  return null;
}

export function useAuth() {
  const liffAttemptedRef = useRef(false);

  const query = useQuery({
    queryKey: authKeys.me,
    queryFn: () => resolveSession(liffAttemptedRef),
    retry: false,
    staleTime: Infinity,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiFetch("/auth/logout", { method: "POST" });
    },
    onSuccess: () => {
      // A full reload, deliberately without clearing the auth cache first.
      // The cookie is gone, so middleware answers the next document with
      // /login. Emptying the cache here instead would leave *this* document
      // rendering a signed-out tree for as long as the reload takes — long
      // enough for ProtectedShell to start its own redirect and for protected
      // queries to refetch into a 401.
      window.location.reload();
    },
  });

  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // ignore error
    }
  }, [logoutMutation]);

  const user = query.data ?? null;

  return {
    user,
    loading: query.isLoading,
    refetch,
    logout,
    isAuthenticated: !!user,
  };
}
