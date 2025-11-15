"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import Dashboard from "@/components/Dashboard";

export default function DashboardPage() {
  const t = useTranslations();
  const router = useRouter();
  const { user, loading } = useAuthContext();

  // 如果未登入，重定向到登入頁面
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-zinc-600 dark:text-zinc-400">
          {t("common.loading")}
        </p>
      </div>
    );
  }

  // 如果未登入，顯示載入中（即將重定向）
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-zinc-600 dark:text-zinc-400">
          {t("common.loading")}
        </p>
      </div>
    );
  }

  return <Dashboard />;
}
