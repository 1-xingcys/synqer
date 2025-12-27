import {
  AttendedEventListItem,
  EventListItem,
  ConfirmedTimeRange,
  EventStatus,
} from "@/types/event";

export interface EventRowHost {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface EventRowData extends AttendedEventListItem {
  host?: EventRowHost | null;
  expectedParticipantCount?: number;
  votedCount?: number;
  confirmedTimeRanges: ConfirmedTimeRange[];
}

// For hosted events, we use a simpler type (no hasVoted field needed)
export interface HostedEventRowData extends EventListItem {
  host?: EventRowHost | null;
  expectedParticipantCount?: number;
  votedCount?: number;
}

export interface EventRowProps {
  event: EventRowData | HostedEventRowData;
  variant: EventStatus;
  mode?: "joined" | "hosted";
  translationNamespace?: string;
}
