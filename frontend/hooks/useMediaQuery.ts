import { useEffect, useState } from "react";

/**
 * useMediaQuery Hook
 * 監聽 media query 變化並返回當前狀態
 *
 * @param query - CSS media query 字串 (例如: "(min-width: 1024px)")
 * @returns boolean - 是否符合 media query
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    // Lazy initialization: 只在初始化時執行一次
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    // 檢查是否在瀏覽器環境
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(query);

    // 監聽變化
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    // 清理
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [query]);

  return matches;
}
