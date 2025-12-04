"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";

interface ProtectedLayoutProps {
  children: ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("common");
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_API) {
          throw new Error("NEXT_PUBLIC_API is not set");
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API}/auth/me`, {
          credentials: "include", // 讓瀏覽器帶上 backend 的 session cookie
          cache: "no-store",
        });

        if (res.status === 401) {
          // 未登入 → 丟去 login，帶上 redirect
          const redirectPath = pathname || "/";
          router.replace(`/login?redirect=${encodeURIComponent(redirectPath)}`);
          return;
        }

        if (!res.ok) {
          console.error("Unexpected status from /auth/me:", res.status);
          // 發生錯誤當作未登入處理
          const redirectPath = pathname || "/";
          router.replace(`/login?redirect=${encodeURIComponent(redirectPath)}`);
          return;
        }

        // 通過驗證
        setChecked(true);
      } catch (err) {
        console.error("Auth check failed:", err);
        const redirectPath = pathname || "/";
        router.replace(`/login?redirect=${encodeURIComponent(redirectPath)}`);
      }
    };

    void checkAuth();
  }, [router, pathname]);

  if (!checked) {
    // Loading 狀態
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-zinc-600 dark:text-zinc-400">{t("loading")}</p>
      </div>
    );
  }

  // 通過驗證，渲染所有 protected children
  return <>{children}</>;
}
