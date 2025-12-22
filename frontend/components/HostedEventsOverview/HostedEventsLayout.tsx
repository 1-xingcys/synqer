"use client";

import { ReactNode } from "react";
import { EventsLayout } from "@/components/eventCommon/EventsOverview";

interface HostedEventsLayoutProps {
  children: ReactNode;
}

export default function HostedEventsLayout({
  children,
}: HostedEventsLayoutProps) {
  return (
    <EventsLayout mode="hosted" translationNamespace="hostedEvents">
      {children}
    </EventsLayout>
  );
}
