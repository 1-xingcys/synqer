"use client";

import { createContext, useContext, ReactNode } from "react";
import { useEventDetail, EventDetailData } from "@/hooks/useEventDetail";
import { VoteMode } from "@/types/event";

interface JoinedEventContextType {
  data: EventDetailData | null;
  loading: boolean;
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
  const { data, loading, error, saveVotes, refetch } = useEventDetail(eventId);

  return (
    <JoinedEventContext.Provider
      value={{ data, loading, error, saveVotes, refetch }}
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
