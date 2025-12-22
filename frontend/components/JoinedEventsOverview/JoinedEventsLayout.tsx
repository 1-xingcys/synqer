"use client";

import { ReactNode } from "react";
import { EventsLayout } from "@/components/eventCommon/EventsOverview";

interface JoinedEventsLayoutProps {
  children: ReactNode;
}

export default function JoinedEventsLayout({
  children,
}: JoinedEventsLayoutProps) {
  return (
    <EventsLayout mode="joined" translationNamespace="joinedEvents">
      {children}
    </EventsLayout>
  );
}
