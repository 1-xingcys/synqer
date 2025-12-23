"use client";

import { createContext, useContext, ReactNode } from "react";
import { useLiff, type UseLiffReturn } from "@/hooks/useLiff";

/**
 * LIFF Context
 *
 * 提供全域 LIFF 狀態和方法
 */
const LiffContext = createContext<UseLiffReturn | undefined>(undefined);

interface LiffProviderProps {
  children: ReactNode;
}

/**
 * LIFF Provider
 *
 * 在應用程式根層級包裝此 Provider，即可在任何地方使用 useLiffContext
 *
 * @example
 * ```tsx
 * // app/layout.tsx
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <LiffProvider>
 *           {children}
 *         </LiffProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function LiffProvider({ children }: LiffProviderProps) {
  const liff = useLiff();

  return <LiffContext.Provider value={liff}>{children}</LiffContext.Provider>;
}

/**
 * 使用 LIFF Context
 *
 * 必須在 LiffProvider 內部使用
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isInClient, profile, login } = useLiffContext();
 *   // ...
 * }
 * ```
 */
export function useLiffContext(): UseLiffReturn {
  const context = useContext(LiffContext);

  if (context === undefined) {
    throw new Error("useLiffContext must be used within a LiffProvider");
  }

  return context;
}

/**
 * 安全版本的 useLiffContext
 *
 * 如果不在 LiffProvider 內部，會返回 null 而不是拋出錯誤
 * 適用於可能在 Provider 外部使用的元件
 */
export function useLiffContextSafe(): UseLiffReturn | null {
  const context = useContext(LiffContext);
  return context ?? null;
}

export default LiffContext;
