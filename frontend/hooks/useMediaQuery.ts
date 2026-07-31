import { useCallback, useSyncExternalStore } from "react";

/**
 * useMediaQuery Hook
 * 監聽 media query 變化並返回當前狀態
 *
 * server 端沒有視窗可以量，snapshot 一律是 false；React 會在掛載後立刻用真正
 * 的值重新渲染，而且不會把這個差異視為 hydration mismatch。
 *
 * 也因為如此，呼叫端不能用它決定「第一次畫面長什麼樣」——那種需求請交給
 * CSS 斷點，否則桌面版會先畫成手機版再跳一下。
 *
 * @param query - CSS media query 字串 (例如: "(min-width: 1024px)")
 * @returns boolean - 是否符合 media query，掛載前一律為 false
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mediaQuery = window.matchMedia(query);
      mediaQuery.addEventListener("change", onStoreChange);
      return () => mediaQuery.removeEventListener("change", onStoreChange);
    },
    [query],
  );

  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
