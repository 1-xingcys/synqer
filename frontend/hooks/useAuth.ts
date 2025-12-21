import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@/types/auth";
import {
  getLiffAccessToken,
  initializeLiff,
  isLiffEnabled,
  liffLogin,
} from "@/lib/liff";
import { debugLog } from "@/components/DebugConsole";

const log = (message: string, data?: unknown) =>
  debugLog("useAuth", message, data);

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const liffAttemptedRef = useRef(false);

  const fetchUser = useCallback(async () => {
    try {
      if (!process.env.NEXT_PUBLIC_API) {
        throw new Error("NEXT_PUBLIC_API is not set");
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API}/auth/me`, {
        credentials: "include",
      });

      if (response.ok) {
        const userData = (await response.json()) as User;
        log("Session valid", { userId: userData.id });
        setUser(userData);
        setLoading(false);
        return;
      }

      if (!liffAttemptedRef.current && isLiffEnabled()) {
        liffAttemptedRef.current = true;

        const liffState = await initializeLiff();

        if (!liffState.isInitialized) {
          setUser(null);
          setLoading(false);
          return;
        }

        if (liffState.isInClient && !liffState.isLoggedIn) {
          log("LIFF: triggering login");
          setTimeout(() => setLoading(false), 5000);
          await liffLogin(window.location.href);
          return;
        }

        if (liffState.isLoggedIn) {
          const accessToken = await getLiffAccessToken();

          if (accessToken) {
            const loginResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API}/auth/liff/login`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ accessToken }),
              },
            );

            if (loginResponse.ok) {
              const userData = (await loginResponse.json()) as User;
              log("LIFF login success", { userId: userData.id });
              setUser(userData);
              setLoading(false);
              return;
            }
          }
        }

        setUser(null);
        setLoading(false);
        return;
      } else {
        setUser(null);
        setLoading(false);
      }
    } catch (error) {
      log("Error", { error: String(error) });
      console.error("Error fetching user:", error);
      setUser(null);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  const logout = async () => {
    try {
      if (!process.env.NEXT_PUBLIC_API) {
        throw new Error("NEXT_PUBLIC_API is not set");
      }
      await fetch(`${process.env.NEXT_PUBLIC_API}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      window.location.reload();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return { user, loading, refetch: fetchUser, logout, isAuthenticated: !!user };
}
