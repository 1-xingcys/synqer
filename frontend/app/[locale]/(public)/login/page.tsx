"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import LoginPage from "@/components/LoginPage";
import { LoadingState } from "@/components/ui/loading-state";
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
      <LoadingState
        viewport="screen"
        background="muted"
        spinnerTone="neutral"
      />
    );
  }

  const redirectPath = validateRedirectPath(searchParams.get("redirect"));

  return <LoginPage redirectPath={redirectPath} />;
}
