"use client";

import { ReactNode } from "react";
import { EventsLayout } from "@/components/eventCommon/eventsOverview";
import { EventRowMode } from "@/components/eventCommon/eventsOverview/types";

interface JoinedEventsLayoutProps {
  children: ReactNode;
}

export default function JoinedEventsLayout({
  children,
}: JoinedEventsLayoutProps) {
  return (
    <EventsLayout
      mode={EventRowMode.JOINED}
      translationNamespace="joinedEvents"
    >
      {children}
    </EventsLayout>
  );
}
