"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useRouter, usePathname, Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useSidebar } from "@/contexts/SidebarContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";

/**
 * Sidebar 通用元件
 * 提供乾淨的 UI 結構，不依賴特定業務邏輯
 *
 * 可擴展性：
 * 1. 支援任意選單項目通過 children 傳入
 * 2. 支援收合/展開狀態
 * 3. 響應式設計（手機版/桌面版）
 */

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
}

export default function Sidebar({
  isOpen,
  onClose,
  title,
  children,
}: SidebarProps) {
  const isCollapsed = !isOpen;
  const visibilityClass = isOpen
    ? "translate-x-0 opacity-100 pointer-events-auto"
    : "-translate-x-full opacity-0 pointer-events-none lg:translate-x-0 lg:opacity-100 lg:pointer-events-auto";
  const widthClass = isOpen ? "lg:w-64" : "lg:w-20";

  // 如果沒有傳入 children，使用 context 中的 content，並自動設置內容
  const { content: contextContent, title: contextTitle } = useSidebar();
  const sidebarContent = children !== undefined ? children : contextContent;
  const sidebarTitle = title !== undefined ? title : contextTitle;

  // 如果沒有傳入 children，自動設置 sidebar 內容
  useEffect(() => {
    if (children === undefined) {
      // ProtectedSidebarContent 會自動設置內容
      return;
    }
  }, [children]);

  // 處理 children，傳遞 collapsed prop
  const renderedChildren = sidebarContent
    ? Children.map(sidebarContent, (child) => {
        if (isValidElement(child)) {
          // 只對有 collapsed prop 的元件（如 SidebarItem）傳遞 collapsed
          // 原生 HTML 元素（如 button）會被跳過
          if (typeof child.type === "function") {
            // 檢查是否是 SidebarItem 組件
            const componentType = child.type as {
              name?: string;
              displayName?: string;
            };
            const componentName =
              componentType.name || componentType.displayName;
            const childProps = child.props as { collapsed?: boolean };
            if (
              componentName === "SidebarItem" ||
              childProps.collapsed !== undefined
            ) {
              return cloneElement(child, {
                collapsed: isCollapsed,
              } as Partial<unknown>);
            }
          }
        }
        return child;
      })
    : null;

  return (
    <>
      {/* Overlay - 手機版點擊關閉 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen lg:h-[calc(100vh-73px)]
          w-64 ${widthClass} bg-white dark:bg-zinc-900 
          border-r border-zinc-200 dark:border-zinc-800
          transition-[transform,opacity,width] duration-300 ease-in-out
          z-50 lg:z-0
          ${visibilityClass}
        `}
        aria-hidden={!isOpen}
      >
        {/* Sidebar Header - 手機版顯示標題和關閉按鈕 */}
        {sidebarTitle && (
          <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800 lg:hidden">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {sidebarTitle}
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Close menu"
            >
              <svg
                className="w-5 h-5 text-zinc-600 dark:text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <nav className="p-3 space-y-2">
          {children === undefined && <ProtectedSidebarContent />}
          {renderedChildren}
        </nav>
      </aside>
    </>
  );
}

/**
 * SidebarItem 元件
 * 用於 Sidebar 中的選單項目
 */
interface SidebarItemProps {
  icon?: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  collapsed?: boolean;
}

export function SidebarItem({
  icon,
  label,
  active = false,
  onClick,
  collapsed = false,
}: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full h-12 rounded-lg font-medium transition-colors
        ${
          active
            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
            : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        }
        ${collapsed ? "lg:flex lg:items-center lg:justify-center lg:px-2" : "flex items-center gap-3 px-4"}
      `}
    >
      <span className="shrink-0">{icon}</span>
      <span
        className={`
          transition-all duration-200
          ${collapsed ? "lg:hidden" : "whitespace-nowrap"}
        `}
      >
        {label}
      </span>
    </button>
  );
}

/**
 * ProtectedSidebarContent
 * 自動設置受保護頁面的 Sidebar 內容
 */
type SidebarView = "hosted-events" | "joined-events";

function ProtectedSidebarContent() {
  const { isOpen, close, setContent, setTitle } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isCollapsed = !isOpen;

  // 判斷當前視圖
  const currentView = useMemo<SidebarView>(() => {
    // Check if we're on the hosted events pages
    if (pathname?.startsWith("/hosted")) return "hosted-events";
    // Check if we're on the joined events pages
    if (pathname?.startsWith("/joined")) return "joined-events";
    // Default to joined-events (main page after login)
    return "joined-events";
  }, [pathname]);

  // 設置 Sidebar 內容 - 所有頁面都顯示相同的 Dashboard sidebar
  useEffect(() => {
    setTitle(t("dashboard.menu"));

    const menuItems: Array<{
      id: SidebarView;
      label: string;
      icon: ReactNode;
      href: string;
    }> = [
      {
        id: "joined-events",
        label: t("dashboard.joinedEvents"),
        href: "/joined",
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
      {
        id: "hosted-events",
        label: t("dashboard.hostedEvents"),
        href: "/hosted",
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
    ];

    setContent(
      <>
        {/* 建立活動按鈕 */}
        <Link
          href="/new"
          onClick={() => {
            if (!isDesktop) {
              close();
            }
          }}
          className={`
            w-full h-12 font-medium rounded-lg transition-colors bg-blue-600 hover:bg-blue-700 text-white no-underline
            ${
              isCollapsed && isDesktop
                ? "lg:flex lg:items-center lg:justify-center lg:px-2"
                : "flex items-center gap-3 px-4"
            }
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
            className={`
            transition-all duration-200
            ${isCollapsed && isDesktop ? "lg:hidden" : "whitespace-nowrap"}
          `}
          >
            {t("dashboard.createNewEvent")}
          </span>
        </Link>

        {/* 選單項目 */}
        {menuItems.map((item) => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={currentView === item.id}
            collapsed={isCollapsed}
            onClick={() => {
              router.push(item.href);
              if (!isDesktop) {
                close();
              }
            }}
          />
        ))}
      </>,
    );
  }, [
    currentView,
    pathname,
    setContent,
    setTitle,
    t,
    router,
    close,
    isDesktop,
    isCollapsed,
  ]);

  // 這個組件不渲染任何內容，只是用來設置 sidebar 內容
  return null;
}
