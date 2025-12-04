"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import Sidebar, { SidebarItem } from "@/components/ui/Sidebar";

/**
 * SidebarView 類型
 * 可擴展性：未來可添加更多視圖類型
 * 例如：'calendar-view' | 'analytics' | 'settings' 等
 */
export type SidebarView = "my-events" | "attended-events";

/**
 * DashboardSidebar Props
 */
interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: SidebarView;
  onViewChange: (view: SidebarView) => void;
  onCreateEvent: () => void;
}

/**
 * DashboardSidebar 元件
 * 使用通用 Sidebar 元件，只處理 Dashboard 特定的選單邏輯
 *
 * 可擴展性：
 * 1. 新增選單項目：只需在 menuItems 陣列中添加新項目
 * 2. 支援巢狀選單：可修改為樹狀結構
 * 3. 支援徽章/通知數字：可在 SidebarItem 中擴展
 */
export default function DashboardSidebar({
  isOpen,
  onClose,
  currentView,
  onViewChange,
  onCreateEvent,
}: DashboardSidebarProps) {
  const t = useTranslations("dashboard");
  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;

  const menuItems: Array<{
    id: SidebarView;
    label: string;
    icon: ReactNode;
  }> = [
    {
      id: "my-events",
      label: t("myEvents"),
      icon: (
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
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      id: "attended-events",
      label: t("attendedEvents"),
      icon: (
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      ),
    },
  ];

  return (
    <Sidebar isOpen={isOpen} onClose={onClose} title={t("menu")}>
      {/* 建立活動按鈕 */}
      <button
        onClick={() => {
          onCreateEvent();
          if (isMobile) {
            onClose();
          }
        }}
        className={`w-full flex items-center gap-3 px-4 py-3 font-medium rounded-lg transition-colors
          bg-blue-600 hover:bg-blue-700 text-white
          ${!isOpen ? "lg:gap-0 lg:px-3 lg:justify-center" : ""}
        `}
      >
        <span className="shrink-0">
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
              d="M12 4v16m8-8H4"
            />
          </svg>
        </span>
        <span
          className={`whitespace-nowrap transition-all duration-200 origin-left ${!isOpen ? "lg:opacity-0 lg:w-0 lg:overflow-hidden lg:sr-only" : ""}`}
        >
          {t("createNewEvent")}
        </span>
      </button>

      {/* 選單項目 */}
      {menuItems.map((item) => (
        <SidebarItem
          key={item.id}
          icon={item.icon}
          label={item.label}
          active={currentView === item.id}
          onClick={() => {
            onViewChange(item.id);
            if (isMobile) {
              onClose();
            }
          }}
        />
      ))}
    </Sidebar>
  );
}
