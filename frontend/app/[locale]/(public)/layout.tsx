"use client";

import { ReactNode } from "react";

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  // Public layout 不需要做任何驗證
  // 如果需要在某些 public 頁面（如 login）做「已登入就跳轉」的邏輯，
  // 可以在該頁面自己處理
  return <>{children}</>;
}
