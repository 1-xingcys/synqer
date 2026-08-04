"use client";

import { ReactNode } from "react";
import { useParams } from "next/navigation";
import { useEventDetailWithRole } from "@/hooks/useEventDetailWithRole";
import { EventDetailContent } from "./EventDetailContent";

export default function EventDetailLayout({
  children,
}: {
  children: ReactNode;
}) {
  const params = useParams();
  const eventId = params.eventId as string;
  const { isHost } = useEventDetailWithRole(eventId);

  return <EventDetailContent isHost={isHost}>{children}</EventDetailContent>;
}
