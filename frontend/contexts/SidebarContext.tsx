"use client";

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";

interface SidebarContextType {
  isOpen: boolean;
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
  // 桌面端預設展開，手機端預設關閉
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024; // lg breakpoint
    }
    return true; // SSR 時預設展開（桌面端）
  });
  const [content, setContent] = useState<ReactNode>(null);
  const [title, setTitle] = useState<string | undefined>(undefined);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
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
    [isOpen, toggle, open, close, content, title]
  );

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

