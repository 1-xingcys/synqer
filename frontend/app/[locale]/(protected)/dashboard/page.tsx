"use client";

import Dashboard from "@/components/Dashboard";

export default function DashboardPage() {
  // ✅ 身份驗證已經在 (protected)/layout.tsx 處理
  // 這裡不需要再檢查，直接渲染內容即可
  return <Dashboard />;
}
