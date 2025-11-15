"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import LoginPage from "@/components/LoginPage";

export default function Login() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuthContext();

  // 如果已登入，重定向到 dashboard 或指定頁面
  useEffect(() => {
    if (user) {
      const redirect = searchParams.get("redirect");
      if (redirect) {
        router.push(redirect);
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, searchParams, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-zinc-600 dark:text-zinc-400">
          {t("common.loading")}
        </p>
      </div>
    );
  }

  // 如果已登入，顯示載入中（即將重定向）
  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-zinc-600 dark:text-zinc-400">
          {t("common.loading")}
        </p>
      </div>
    );
  }

  return <LoginPage />;
}
