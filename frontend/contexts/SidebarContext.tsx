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
  // null = never toggled manually. The default appearance (collapsed on mobile,
  // expanded on desktop) comes from CSS breakpoints; window is not read here so
  // that the first server and client render agree.
  const [isOpen, setIsOpen] = useState<SidebarOpenState>(null);
  const [content, setContent] = useState<ReactNode>(null);
  const [title, setTitle] = useState<string | undefined>(undefined);

  const toggle = useCallback(() => {
    // Runs only on user interaction, where reading the window width is safe
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
