"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import Sidebar, { SidebarItem } from "@/components/ui/Sidebar";

/**
 * EventSidebar Props
 */
interface EventSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * EventSidebar 元件
 * 用於事件頁面的側邊欄，提供簡單的導航功能
 *
 * 可擴展性：
 * 未來可以添加更多功能，例如：
 * - 事件相關操作（編輯、刪除、分享）
 * - 快速跳轉到其他事件
 * - 事件統計資訊
 */
export default function EventSidebar({ isOpen, onClose }: EventSidebarProps) {
  const t = useTranslations("event");
  const router = useRouter();

  const handleBackToDashboard = () => {
    router.push("/dashboard");
    onClose();
  };

  return (
    <Sidebar isOpen={isOpen} onClose={onClose} title={t("menu")}>
      <SidebarItem
        icon={
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        }
        label={t("backToDashboard")}
        onClick={handleBackToDashboard}
      />
    </Sidebar>
  );
}
