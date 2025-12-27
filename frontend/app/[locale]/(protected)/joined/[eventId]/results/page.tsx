"use client";

import { useParams } from "next/navigation";
import JoinedEventResultsPage from "@/components/joinedEvent/JoinedEventResultsPage";

export default function JoinedEventResultsPageRoute() {
  const params = useParams();
  const eventId = params.eventId as string;

  return <JoinedEventResultsPage eventId={eventId} />;
}
