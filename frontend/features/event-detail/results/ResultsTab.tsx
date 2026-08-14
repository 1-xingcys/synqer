"use client";

import { useParams } from "next/navigation";
import { useEventDetailWithRole } from "@/hooks/useEventDetailWithRole";
import HostResultsView from "@/features/event-detail/results/host";
import GuestResultsView from "@/features/event-detail/results/guest";

/**
 * The results tab, split out of its route so the route can be a server
 * component and declare a share card of its own. Everything below here still
 * needs a session, and still resolves the viewer's role client-side.
 */
export default function ResultsTab() {
  const params = useParams();
  const eventId = params.eventId as string;
  const { isHost } = useEventDetailWithRole(eventId);

  // 主辦者：HostResultsView 已含 EventTimeSelector + ResultsView 拖拉合併
  return isHost ? <HostResultsView /> : <GuestResultsView eventId={eventId} />;
}
