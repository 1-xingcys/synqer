"use client";

import { ReactNode } from "react";
import { DebugProvider, DEBUG_ENABLED } from "./index";

interface DebugWrapperProps {
  children: ReactNode;
}

/**
 * DebugWrapper - 用於包裝整個應用的 Debug Provider
 * 這是一個 Client Component，可以在 Server Component layout 中使用
 */
export function DebugWrapper({ children }: DebugWrapperProps) {
  if (!DEBUG_ENABLED) {
    return <>{children}</>;
  }

  return <DebugProvider title="App Debug">{children}</DebugProvider>;
}
