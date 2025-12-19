"use client";

import { usePathname } from "@/i18n/routing";
import { useAuthContext } from "@/contexts/AuthContext";
import PublicHeader from "./PublicHeader";
import ProtectedHeader from "./ProtectedHeader";
import type { ReactNode } from "react";

interface HeaderProps {
  /**
   * 用於 ProtectedHeader 的中間內容
   */
  children?: ReactNode;

  /**
   * 用於 ProtectedHeader 的 Sidebar 開關回調
   */
  onMenuClick?: () => void;

  /**
   * 強制使用特定 Header 類型（可選）
   * 如果不提供，會根據 user 狀態和 pathname 自動判斷
   */
  variant?: "public" | "protected";
}

/**
 * Header 統一入口元件
 *
 * 根據登入狀態和頁面類型自動選擇顯示：
 * - PublicHeader：登入前的公開頁面
 * - ProtectedHeader：登入後的受保護頁面
 *
 * 也可以通過 variant prop 強制指定類型
 */
export default function Header({
  children,
  onMenuClick,
  variant,
}: HeaderProps) {
  const { user } = useAuthContext();
  const pathname = usePathname();

  // 判斷是否為受保護頁面
  const isProtectedPage =
    pathname?.startsWith("/events") ||
    pathname?.startsWith("/joined") ||
    pathname?.startsWith("/hosted");

  // 決定使用哪個 Header
  const shouldUseProtected =
    variant === "protected" ||
    (variant !== "public" && user && isProtectedPage);

  if (shouldUseProtected) {
    return (
      <ProtectedHeader onMenuClick={onMenuClick}>{children}</ProtectedHeader>
    );
  }

  return <PublicHeader />;
}
