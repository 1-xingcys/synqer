"use client";

import { createContext, useContext, ReactNode } from "react";
import {
  useHostedEventDetail,
  HostedEventDetailData,
} from "@/hooks/useHostedEventDetail";

interface HostedEventContextType {
  data: HostedEventDetailData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const HostedEventContext = createContext<HostedEventContextType | null>(null);

interface HostedEventProviderProps {
  eventId: string;
  children: ReactNode;
}

export function HostedEventProvider({
  eventId,
  children,
}: HostedEventProviderProps) {
  const { data, loading, error, refetch } = useHostedEventDetail(eventId);

  return (
    <HostedEventContext.Provider value={{ data, loading, error, refetch }}>
      {children}
    </HostedEventContext.Provider>
  );
}

export function useHostedEventContext() {
  const context = useContext(HostedEventContext);
  if (!context) {
    throw new Error(
      "useHostedEventContext must be used within a HostedEventProvider",
    );
  }
  return context;
}
