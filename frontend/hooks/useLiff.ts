"use client";

import { useState, useEffect, useCallback } from "react";
import {
  initializeLiff,
  getLiffProfile,
  getLiffContext,
  getLiffAccessToken,
  liffLogin,
  liffLogout,
  closeLiff,
  isLiffEnabled,
  type LiffState,
  type LiffProfile,
  type LiffContext,
} from "@/lib/liff";
import { debugLog } from "@/components/DebugConsole";

const log = (message: string, data?: unknown) =>
  debugLog("useLiff", message, data);

export interface UseLiffReturn {
  // 狀態
  isInitialized: boolean;
  isLoading: boolean;
  isInClient: boolean;
  isLoggedIn: boolean;
  error: Error | null;

  // 使用者資訊
  profile: LiffProfile | null;
  context: LiffContext | null;

  // 方法
  login: (redirectUri?: string) => Promise<void>;
  logout: () => Promise<void>;
  closeWindow: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

/**
 * LIFF Hook
 *
 * 提供 LIFF 狀態和方法的 React Hook
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isInClient, isLoggedIn, profile, login } = useLiff();
 *
 *   if (isInClient && !isLoggedIn) {
 *     return <button onClick={() => login()}>Login with LINE</button>;
 *   }
 *
 *   return <div>Welcome, {profile?.displayName}!</div>;
 * }
 * ```
 */
export function useLiff(): UseLiffReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [state, setState] = useState<LiffState>({
    isInitialized: false,
    isInClient: false,
    isLoggedIn: false,
    error: null,
  });
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [context, setContext] = useState<LiffContext | null>(null);

  // 初始化 LIFF
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // Check if URL has LIFF-related parameters (OAuth callback or LIFF launch)
      const url = new URL(window.location.href);
      const hasLiffParams =
        url.searchParams.has("liff.state") ||
        url.searchParams.has("code") ||
        url.hash.includes("access_token") ||
        url.hash.includes("id_token");

      // Check if we're in LINE client (by User-Agent)
      const isInLineClient = /Line/i.test(navigator.userAgent);

      // Initialize LIFF if:
      // 1. We have LIFF params in URL (OAuth callback), OR
      // 2. We're in LINE client (any page)
      const shouldInit = hasLiffParams || isInLineClient;

      if (!shouldInit) {
        if (mounted) {
          setIsLoading(false);
        }
        return;
      }

      // 檢查是否有設定 LIFF ID
      if (!isLiffEnabled()) {
        if (mounted) {
          setState({
            isInitialized: false,
            isInClient: false,
            isLoggedIn: false,
            error: null,
          });
          setIsLoading(false);
        }
        return;
      }

      try {
        const liffState = await initializeLiff();

        if (!mounted) {
          return;
        }

        setState(liffState);

        // 如果已登入，取得 Profile 和 Context
        if (liffState.isLoggedIn) {
          const [profileData, contextData] = await Promise.all([
            getLiffProfile(),
            getLiffContext(),
          ]);

          if (mounted) {
            setProfile(profileData);
            setContext(contextData);
          }
        } else {
          // 即使未登入也嘗試取得 context
          const contextData = await getLiffContext();
          if (mounted) {
            setContext(contextData);
          }
        }
      } catch (error) {
        if (mounted) {
          setState((prev) => ({
            ...prev,
            error:
              error instanceof Error ? error : new Error("LIFF init failed"),
          }));
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    log("init start");
    void init();
    log("init end");

    return () => {
      mounted = false;
    };
  }, []);

  // Login
  const login = useCallback(async (redirectUri?: string) => {
    await liffLogin(redirectUri);
  }, []);

  // Logout
  const logout = useCallback(async () => {
    await liffLogout();
    setProfile(null);
    setState((prev) => ({ ...prev, isLoggedIn: false }));
  }, []);

  // Close window
  const closeWindow = useCallback(async () => {
    await closeLiff();
  }, []);

  // Get access token
  const getAccessToken = useCallback(async () => {
    return getLiffAccessToken();
  }, []);

  return {
    // 狀態
    isInitialized: state.isInitialized,
    isLoading,
    isInClient: state.isInClient,
    isLoggedIn: state.isLoggedIn,
    error: state.error,

    // 使用者資訊
    profile,
    context,

    // 方法
    login,
    logout,
    closeWindow,
    getAccessToken,
  };
}
