"use client";

import { createContext, useContext, ReactNode, useCallback } from "react";
import { useEventDetail, EventDetailData } from "@/hooks/useEventDetail";
import { VoteMode } from "@/types/event";

interface JoinedEventContextType {
  data: EventDetailData | null;
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  saveVotes: (selectedSlotIds: string[], voteMode?: VoteMode) => Promise<void>;
  refetch: () => Promise<void>;
}

const JoinedEventContext = createContext<JoinedEventContextType | null>(null);

interface JoinedEventProviderProps {
  eventId: string;
  children: ReactNode;
}

export function JoinedEventProvider({
  eventId,
  children,
}: JoinedEventProviderProps) {
  const { data, isLoading, isFetching, error, saveVotes, refetch } =
    useEventDetail(eventId);

  // Wrap refetch to return Promise<void>
  const handleRefetch = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return (
    <JoinedEventContext.Provider
      value={{
        data,
        isLoading,
        isFetching,
        error,
        saveVotes,
        refetch: handleRefetch,
      }}
    >
      {children}
    </JoinedEventContext.Provider>
  );
}

export function useJoinedEventContext() {
  const context = useContext(JoinedEventContext);
  if (!context) {
    throw new Error(
      "useJoinedEventContext must be used within a JoinedEventProvider",
    );
  }
  return context;
}
