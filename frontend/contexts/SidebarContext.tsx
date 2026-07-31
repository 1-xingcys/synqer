"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import {
  nextSidebarOpenState,
  type SidebarOpenState,
} from "@/components/ui/sidebarState";

const DESKTOP_QUERY = "(min-width: 1024px)";

interface SidebarContextType {
  isOpen: SidebarOpenState;
  toggle: () => void;
  open: () => void;
  close: () => void;
  content: ReactNode;
  setContent: (content: ReactNode) => void;
  title?: string;
  setTitle: (title?: string) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  // null = 還沒手動開關過。預設外觀（手機收合、桌面展開）由 CSS 斷點決定，
  // 這裡不讀 window，server 與 client 的第一次渲染才會一致。
  const [isOpen, setIsOpen] = useState<SidebarOpenState>(null);
  const [content, setContent] = useState<ReactNode>(null);
  const [title, setTitle] = useState<string | undefined>(undefined);

  const toggle = useCallback(() => {
    // 只在使用者互動時執行，此時讀取視窗寬度是安全的
    const isDesktop = window.matchMedia(DESKTOP_QUERY).matches;
    setIsOpen((prev) => nextSidebarOpenState(prev, isDesktop));
  }, []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({
      isOpen,
      toggle,
      open,
      close,
      content,
      setContent,
      title,
      setTitle,
    }),
    [isOpen, toggle, open, close, content, title],
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
