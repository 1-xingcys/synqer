"use client";

import { useParams } from "next/navigation";
import { useJoinedEventContext } from "@/contexts/JoinedEventContext";
import { useAuthContext } from "@/contexts/AuthContext";
import HostedEventPanelPage from "@/components/hostedEvent/HostedEventPanelPage";
import JoinedEventResultsPage from "@/components/joinedEvent/JoinedEventResultsPage";

export default function Page() {
  const params = useParams();
  const eventId = params.eventId as string;
  const { data } = useJoinedEventContext();
  const { user } = useAuthContext();

  const isHost = Boolean(
    user?.id !== undefined &&
      data?.event.ownerId != null &&
      user.id.toString() === data.event.ownerId.toString(),
  );

  // 主辦者：HostedEventPanelPage 已含 EventTimeSelector + ResultsView 拖拉合併
  //（HostedEventProvider 由 UnifiedEventDetailLayout 於 isHost 時提供）
  return isHost ? (
    <HostedEventPanelPage />
  ) : (
    <JoinedEventResultsPage eventId={eventId} />
  );
}
