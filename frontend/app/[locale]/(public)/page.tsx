"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useAuthContext } from "@/contexts/AuthContext";
import Header from "@/components/Header";

export default function LandingPage() {
  const t = useTranslations("landing");
  const commonT = useTranslations("common");
  const router = useRouter();
  const { user, loading } = useAuthContext();

  const handleGetStarted = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-zinc-600 dark:text-zinc-400">{commonT("loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-zinc-50 to-white dark:from-black dark:to-zinc-900">
      <Header variant="public" />

      {/* Hero Section */}
      <main className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-5xl sm:text-6xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
              {t("hero.title")}
            </h2>
            <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-8 max-w-2xl mx-auto">
              {t("hero.subtitle")}
            </p>
            <button
              onClick={handleGetStarted}
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-white bg-linear-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
            >
              {t("hero.getStarted")}
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>
          </div>

          {/* Features */}
          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                {t("features.events.title")}
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                {t("features.events.description")}
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-purple-500 dark:hover:border-purple-500 transition-colors">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-purple-600 dark:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                {t("features.collaboration.title")}
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                {t("features.collaboration.description")}
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-green-500 dark:hover:border-green-500 transition-colors">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                {t("features.simple.title")}
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                {t("features.simple.description")}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
