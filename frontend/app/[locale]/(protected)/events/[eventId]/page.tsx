"use client";

import { useParams } from "next/navigation";
import EventsPage from "@/components/Events";

export default function EventPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  return <EventsPage eventId={eventId} />;
}
