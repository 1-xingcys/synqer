import { useCallback, useRef, type MutableRefObject } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import type { LiffLoginRequest, LiffLoginResponse, User } from "@/types/auth";
import {
  getLiffAccessToken,
  initializeLiff,
  isLiffEnabled,
  liffLogin,
} from "@/lib/liff";
import { debugLog } from "@/components/DebugConsole";
// TEMPORARY: loading-time instrumentation, remove with lib/perfTrace.ts
import { perfMark } from "@/lib/perfTrace";

const log = (message: string, data?: unknown) => {
  perfMark(`useAuth · ${message}`, data);
  debugLog("useAuth", message, data);
};

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
  log("Fetching /auth/me...");
  const response = await apiFetch("/auth/me");
  log("/auth/me response", { status: response.status });

  if (response.ok) {
    const userData = (await response.json()) as User;
    log("Session valid", { userId: userData.id });
    return userData;
  }

  log("Session invalid, checking LIFF...", {
    liffAttempted: liffAttemptedRef.current,
    liffEnabled: isLiffEnabled(),
    liffId: process.env.NEXT_PUBLIC_LINE_LIFF_ID,
  });

  if (liffAttemptedRef.current || !isLiffEnabled()) {
    log("LIFF already attempted or not enabled");
    return null;
  }
  liffAttemptedRef.current = true;

  log("Initializing LIFF...");
  const liffState = await initializeLiff();
  log("LIFF state", liffState);

  if (!liffState.isInitialized) {
    log("LIFF init failed", { error: liffState.error?.message });
    return null;
  }

  if (liffState.isInClient && !liffState.isLoggedIn) {
    log("LIFF: triggering login");
    try {
      // 正常情況會立即跳轉到 LINE Login，回來後重新走 useAuth。
      await liffLogin(window.location.href);
      return null;
    } catch (error) {
      log("LIFF login trigger failed", { error: String(error) });
      return null;
    }
  }

  if (!liffState.isLoggedIn) {
    log("LIFF not logged in and not in client", {
      isInClient: liffState.isInClient,
    });
    return null;
  }

  log("LIFF logged in, getting access token...");
  const accessToken = await getLiffAccessToken();
  log("Access token", { hasToken: !!accessToken });
  if (!accessToken) {
    return null;
  }

  const payload: LiffLoginRequest = { accessToken };
  log("Calling /auth/liff/login...");
  const loginResponse = await apiFetch("/auth/liff/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  log("/auth/liff/login response", { status: loginResponse.status });

  if (loginResponse.ok) {
    const userData = (await loginResponse.json()) as LiffLoginResponse;
    log("LIFF login success", { userId: userData.id });
    return userData;
  }

  const errorText = await loginResponse.text();
  log("LIFF login failed", {
    status: loginResponse.status,
    error: errorText,
  });
  return null;
}

export function useAuth() {
  const queryClient = useQueryClient();
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
      queryClient.setQueryData(authKeys.me, null);
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
