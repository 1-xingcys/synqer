"use client";

import { ReactNode } from "react";
import { EventsLayout } from "@/components/eventCommon/eventsOverview";
import { EventRowMode } from "@/components/eventCommon/eventsOverview/types";

interface HostedEventsLayoutProps {
  children: ReactNode;
}

export default function HostedEventsLayout({
  children,
}: HostedEventsLayoutProps) {
  return (
    <EventsLayout
      mode={EventRowMode.HOSTED}
      translationNamespace="hostedEvents"
    >
      {children}
    </EventsLayout>
  );
}
