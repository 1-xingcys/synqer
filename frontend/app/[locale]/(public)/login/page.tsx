"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import LoginPage from "@/components/LoginPage";
import { useAuthContext } from "@/contexts/AuthContext";

/**
 * 驗證 redirect 路徑，防止 open redirect 攻擊
 */
const validateRedirectPath = (redirect: string | null): string => {
  if (!redirect) return "/joined";

  // 只允許以 / 開頭的相對路徑
  if (redirect.startsWith("/")) {
    // 防止 protocol-relative URLs 如 //evil.com
    if (redirect.startsWith("//")) {
      return "/joined";
    }
    return redirect;
  }

  // 拒絕其他模式（絕對 URLs、javascript:、data: 等）
  return "/joined";
};

export default function Login() {
  const t = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuthContext();

  // 如果已登入，重定向到 redirect 或 dashboard
  useEffect(() => {
    if (!loading && user) {
      const redirect = validateRedirectPath(searchParams.get("redirect"));
      router.replace(redirect);
    }
  }, [loading, user, router, searchParams]);

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-zinc-600 dark:text-zinc-400">{t("loading")}</p>
      </div>
    );
  }

  const redirectPath = validateRedirectPath(searchParams.get("redirect"));

  return <LoginPage redirectPath={redirectPath} />;
}
