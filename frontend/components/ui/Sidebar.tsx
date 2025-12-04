"use client";

import { Children, cloneElement, isValidElement, type ReactNode } from "react";

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
  children: ReactNode;
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
  const widthClass = isOpen ? "lg:w-64" : "lg:w-16";

  const renderedChildren = Children.map(children, (child) => {
    if (isValidElement(child)) {
      // 只對有 collapsed prop 的元件（如 SidebarItem）傳遞 collapsed
      // 原生 HTML 元素（如 button）會被跳過
      if (typeof child.type === "function") {
        return cloneElement(child, {
          collapsed: isCollapsed,
        } as Partial<unknown>);
      }
    }
    return child;
  });

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
          fixed lg:sticky top-0 left-0 h-screen
          w-64 ${widthClass} bg-white dark:bg-zinc-900 
          border-l border-r border-zinc-200 dark:border-zinc-800
          transition-[transform,opacity,width] duration-300 ease-in-out
          z-50 lg:z-0
          ${visibilityClass}
        `}
        aria-hidden={!isOpen}
      >
        {/* Sidebar Header - 手機版顯示標題和關閉按鈕 */}
        {title && (
          <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800 lg:hidden">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {title}
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
        <nav className="p-3 space-y-2">{renderedChildren}</nav>
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
        w-full flex items-center gap-3 px-4 py-3 rounded-lg
        font-medium transition-colors
        ${collapsed ? "lg:gap-0 lg:px-3 lg:justify-center" : ""}
        ${
          active
            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
            : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        }
      `}
    >
      <span className="shrink-0">{icon}</span>
      <span
        className={`
          sidebar-label whitespace-nowrap transition-all duration-200 origin-left
          ${collapsed ? "lg:opacity-0 lg:w-0 lg:overflow-hidden lg:sr-only" : ""}
        `}
      >
        {label}
      </span>
    </button>
  );
}
