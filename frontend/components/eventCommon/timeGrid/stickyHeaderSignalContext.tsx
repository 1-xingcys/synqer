"use client";

import { createContext, ReactNode, useContext, useMemo } from "react";

interface TimeGridStickyHeaderSignalContextValue {
  setStickyActive: (active: boolean) => void;
}

const noop = () => {};

const TimeGridStickyHeaderSignalContext =
  createContext<TimeGridStickyHeaderSignalContextValue>({
    setStickyActive: noop,
  });

interface TimeGridStickyHeaderSignalProviderProps {
  children: ReactNode;
  setStickyActive: (active: boolean) => void;
}

export function TimeGridStickyHeaderSignalProvider({
  children,
  setStickyActive,
}: TimeGridStickyHeaderSignalProviderProps) {
  const value = useMemo(() => ({ setStickyActive }), [setStickyActive]);

  return (
    <TimeGridStickyHeaderSignalContext.Provider value={value}>
      {children}
    </TimeGridStickyHeaderSignalContext.Provider>
  );
}

export function useTimeGridStickyHeaderSignal() {
  return useContext(TimeGridStickyHeaderSignalContext);
}
