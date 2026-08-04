"use client";

import { useParams } from "next/navigation";
import EventJoinPage from "@/features/event-join";

export default function EventJoinPageRoute() {
  const params = useParams();
  const eventId = params.eventId as string;

  return <EventJoinPage eventId={eventId} />;
}
