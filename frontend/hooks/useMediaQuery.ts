import { useCallback, useSyncExternalStore } from "react";

/**
 * useMediaQuery Hook
 * Subscribes to a media query and returns its current state.
 *
 * There is no window to measure on the server, so the snapshot is always false;
 * React re-renders with the real value right after mount and does not treat
 * that difference as a hydration mismatch.
 *
 * Because of that, callers must not use this to decide what the first paint
 * looks like -- leave that to CSS breakpoints, otherwise desktop renders the
 * mobile layout first and then jumps.
 *
 * @param query - CSS media query string (e.g. "(min-width: 1024px)")
 * @returns boolean - whether the media query matches; always false before mount
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
