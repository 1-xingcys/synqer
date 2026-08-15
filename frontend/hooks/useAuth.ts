import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/apiClient";
import type { LiffLoginRequest, LiffLoginResponse, User } from "@/types/auth";
import {
  getLiffAccessToken,
  initializeLiff,
  isLiffEnabled,
  liffLogin,
} from "@/lib/line/liff";

export const authKeys = {
  me: ["auth", "me"] as const,
};

/**
 * Whether this document has already run the LIFF handshake.
 *
 * Module scope rather than a ref: every caller of useAuth observes the same
 * ["auth", "me"] query, and react-query runs whichever observer registered its
 * queryFn last. A per-instance ref would tie "only try LIFF once" to whichever
 * component happened to render most recently.
 */
let liffAttempted = false;

/**
 * Resolve the current session.
 * Returns the user when authenticated, or null when not.
 * May navigate the browser away (LIFF login redirect); in that case the
 * promise stays pending until the page unloads, keeping the query loading.
 */
async function resolveSession(): Promise<User | null> {
  const response = await apiFetch("/auth/me");

  if (response.ok) {
    const userData = (await response.json()) as User;
    return userData;
  }

  if (liffAttempted || !isLiffEnabled()) {
    return null;
  }
  liffAttempted = true;

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

/**
 * The current session.
 *
 * Safe to call from as many components as need it: they all observe the one
 * ["auth", "me"] query, so the cache — not a context — is what keeps them on
 * the same answer, and react-query only re-renders the ones whose slice of the
 * result actually changed.
 */
export function useAuth() {
  const query = useQuery({
    queryKey: authKeys.me,
    queryFn: resolveSession,
    retry: false,
    staleTime: Infinity,
  });

  const user = query.data ?? null;

  return {
    user,
    loading: query.isLoading,
    isAuthenticated: !!user,
  };
}

/** Ends the session and sends the browser to /login. */
export function useLogout(): () => void {
  const { mutate } = useMutation({
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

  return mutate;
}
