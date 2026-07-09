"use client";

import { useParams } from "next/navigation";
import { useUnifiedEventDetail } from "@/hooks/useUnifiedEventDetail";
import HostedEventPanelPage from "@/components/hostedEvent/HostedEventPanelPage";
import JoinedEventResultsPage from "@/components/joinedEvent/JoinedEventResultsPage";

export default function Page() {
  const params = useParams();
  const eventId = params.eventId as string;
  const { isHost } = useUnifiedEventDetail(eventId);

  // 主辦者：HostedEventPanelPage 已含 EventTimeSelector + ResultsView 拖拉合併
  return isHost ? (
    <HostedEventPanelPage />
  ) : (
    <JoinedEventResultsPage eventId={eventId} />
  );
}
