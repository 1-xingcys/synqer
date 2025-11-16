"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import LoginPage from "@/components/LoginPage";

export default function Login() {
  const t = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checking, setChecking] = useState(true);

  // 如果已登入，重定向到 dashboard 或指定頁面
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_API) {
          throw new Error("NEXT_PUBLIC_API is not set");
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API}/auth/me`, {
          credentials: "include",
          cache: "no-store",
        });

        if (res.ok) {
          // 已登入 → 跳轉到 redirect 或 dashboard
          const redirect = searchParams.get("redirect") || "/dashboard";
          router.replace(redirect);
        } else {
          // 未登入 → 顯示登入頁面
          setChecking(false);
        }
      } catch (e) {
        console.error(e);
        // 發生錯誤當作未登入
        setChecking(false);
      }
    };

    void checkAuth();
  }, [router, searchParams]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-zinc-600 dark:text-zinc-400">{t("loading")}</p>
      </div>
    );
  }

  return <LoginPage />;
}
