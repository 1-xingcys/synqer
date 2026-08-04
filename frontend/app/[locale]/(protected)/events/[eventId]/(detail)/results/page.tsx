"use client";

import { useParams } from "next/navigation";
import { useUnifiedEventDetail } from "@/hooks/useUnifiedEventDetail";
import HostResultsView from "@/features/event-detail/results/host";
import GuestResultsView from "@/features/event-detail/results/guest";

export default function Page() {
  const params = useParams();
  const eventId = params.eventId as string;
  const { isHost } = useUnifiedEventDetail(eventId);

  // 主辦者：HostResultsView 已含 EventTimeSelector + ResultsView 拖拉合併
  return isHost ? (
    <HostResultsView />
  ) : (
    <GuestResultsView eventId={eventId} />
  );
}
