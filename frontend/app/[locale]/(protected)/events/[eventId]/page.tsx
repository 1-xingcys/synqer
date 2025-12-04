"use client";

import { useParams } from "next/navigation";
import EventsPage from "@/components/EventsPage";

export default function EventPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  return <EventsPage eventId={eventId} />;
}
