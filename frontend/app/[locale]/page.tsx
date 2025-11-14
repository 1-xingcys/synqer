"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface User {
  id: number;
  displayName: string | null;
  primaryEmail: string | null;
  providers: string[];
}

export default function Home() {
  const t = useTranslations();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        credentials: "include",
      });

      if (response.ok) {
        const userData = (await response.json()) as User;
        setUser(userData);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      window.location.reload();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-zinc-600 dark:text-zinc-400">
          {t("common.loading")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="fixed top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-8 py-32 px-16 bg-white dark:bg-black">
        <h1 className="text-4xl font-bold text-black dark:text-white">
          {t("auth.title")}
        </h1>

        {!user ? (
          <div className="flex flex-col gap-4 w-full max-w-md">
            <h2 className="text-xl font-semibold text-center text-zinc-800 dark:text-zinc-200">
              {t("auth.pleaseSignIn")}
            </h2>

            <a
              href={`${API_BASE}/auth/google/start?redirect=/`}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-white border-2 border-zinc-300 px-5 text-zinc-800 font-medium transition-colors hover:bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-600 dark:text-white dark:hover:bg-zinc-700"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {t("auth.signInWithGoogle")}
            </a>

            <a
              href={`${API_BASE}/auth/line/start?redirect=/`}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#06C755] px-5 text-white font-medium transition-colors hover:bg-[#05b34c]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
              </svg>
              {t("auth.signInWithLine")}
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-6 w-full max-w-md p-8 rounded-lg border-2 border-zinc-200 dark:border-zinc-700">
            <h2 className="text-2xl font-semibold text-center text-zinc-800 dark:text-zinc-200">
              {t("auth.welcome")}
            </h2>

            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  {t("auth.displayName")}
                </span>
                <span className="text-lg text-zinc-900 dark:text-zinc-100">
                  {user.displayName || t("auth.notAvailable")}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  {t("auth.email")}
                </span>
                <span className="text-lg text-zinc-900 dark:text-zinc-100">
                  {user.primaryEmail || t("auth.notAvailable")}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  {t("auth.connectedProviders")}
                </span>
                <div className="flex gap-2">
                  {user.providers.map((provider) => (
                    <span
                      key={provider}
                      className="px-3 py-1 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-sm font-medium capitalize"
                    >
                      {provider}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => void handleLogout()}
              className="flex h-12 w-full items-center justify-center rounded-lg bg-red-600 px-5 text-white font-medium transition-colors hover:bg-red-700"
            >
              {t("auth.logout")}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
