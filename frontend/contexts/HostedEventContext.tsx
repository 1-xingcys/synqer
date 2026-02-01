"use client";

import { createContext, useContext, ReactNode, useCallback } from "react";
import {
  useHostedEventDetail,
  HostedEventDetailData,
} from "@/hooks/useHostedEventDetail";

interface HostedEventContextType {
  data: HostedEventDetailData | null;
  isLoading: boolean;
  isFetching: boolean;
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
  const { data, isLoading, isFetching, error, refetch } =
    useHostedEventDetail(eventId);

  // Wrap refetch to return Promise<void>
  const handleRefetch = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return (
    <HostedEventContext.Provider
      value={{ data, isLoading, isFetching, error, refetch: handleRefetch }}
    >
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
