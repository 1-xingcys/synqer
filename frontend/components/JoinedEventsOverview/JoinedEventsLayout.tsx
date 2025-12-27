"use client";

import { ReactNode } from "react";
import { EventsLayout } from "@/components/eventCommon/EventsOverview";
import { EventRowMode } from "@/components/eventCommon/EventsOverview/types";

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
