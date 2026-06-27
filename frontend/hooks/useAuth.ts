import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import type { LiffLoginRequest, LiffLoginResponse, User } from "@/types/auth";
import {
  getLiffAccessToken,
  initializeLiff,
  isLiffEnabled,
  liffLogin,
} from "@/lib/liff";
import { debugLog } from "@/components/DebugConsole";

const log = (message: string, data?: unknown) =>
  debugLog("useAuth", message, data);
const LIFF_LOGIN_REDIRECT_TIMEOUT_MS = 15000;

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const liffAttemptedRef = useRef(false);

  const fetchUser = useCallback(async () => {
    try {
      log("Fetching /auth/me...");
      const response = await apiFetch("/auth/me");
      log("/auth/me response", { status: response.status });

      if (response.ok) {
        const userData = (await response.json()) as User;
        log("Session valid", { userId: userData.id });
        setUser(userData);
        setLoading(false);
        return;
      }

      log("Session invalid, checking LIFF...", {
        liffAttempted: liffAttemptedRef.current,
        liffEnabled: isLiffEnabled(),
        liffId: process.env.NEXT_PUBLIC_LINE_LIFF_ID,
      });

      if (!liffAttemptedRef.current && isLiffEnabled()) {
        liffAttemptedRef.current = true;

        log("Initializing LIFF...");
        const liffState = await initializeLiff();
        log("LIFF state", liffState);

        if (!liffState.isInitialized) {
          log("LIFF init failed", { error: liffState.error?.message });
          setUser(null);
          setLoading(false);
          return;
        }

        if (liffState.isInClient && !liffState.isLoggedIn) {
          log("LIFF: triggering login");
          const fallbackTimer = window.setTimeout(() => {
            log("LIFF login redirect timeout, fallback to /login");
            setLoading(false);
          }, LIFF_LOGIN_REDIRECT_TIMEOUT_MS);

          try {
            await liffLogin(window.location.href);
            // 正常情況會立即跳轉到 LINE Login，回來後重新走 useAuth。
            return;
          } catch (error) {
            window.clearTimeout(fallbackTimer);
            log("LIFF login trigger failed", { error: String(error) });
            setUser(null);
            setLoading(false);
            return;
          }
        }

        if (liffState.isLoggedIn) {
          log("LIFF logged in, getting access token...");
          const accessToken = await getLiffAccessToken();
          log("Access token", { hasToken: !!accessToken });

          if (accessToken) {
            const payload: LiffLoginRequest = { accessToken };
            log("Calling /auth/liff/login...");
            const loginResponse = await apiFetch("/auth/liff/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            log("/auth/liff/login response", { status: loginResponse.status });

            if (loginResponse.ok) {
              const userData =
                (await loginResponse.json()) as LiffLoginResponse;
              log("LIFF login success", { userId: userData.id });
              setUser(userData);
              setLoading(false);
              return;
            } else {
              const errorText = await loginResponse.text();
              log("LIFF login failed", {
                status: loginResponse.status,
                error: errorText,
              });
            }
          }
        } else {
          log("LIFF not logged in and not in client", {
            isInClient: liffState.isInClient,
          });
        }

        setUser(null);
        setLoading(false);
        return;
      } else {
        log("LIFF already attempted or not enabled");
        setUser(null);
        setLoading(false);
      }
    } catch (error) {
      log("Error", { error: String(error) });
      setUser(null);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    log("useAuth initialize start");
    // fetchUser 的 setUser/setLoading 都在 await 之後；此處的同步 setState 來自
    // debugLog 更新外部 log store。待 useAuth 遷移到 react-query 後可移除此 disable。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchUser();
    log("useAuth initialized end");
  }, [fetchUser]);

  const logout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
      setUser(null);
      window.location.reload();
    } catch {
      // ignore error
    }
  };

  return { user, loading, refetch: fetchUser, logout, isAuthenticated: !!user };
}
