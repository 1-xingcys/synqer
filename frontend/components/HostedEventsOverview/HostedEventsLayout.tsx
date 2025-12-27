"use client";

import { ReactNode } from "react";
import { EventsLayout } from "@/components/eventCommon/EventsOverview";
import { EventRowMode } from "@/components/eventCommon/EventsOverview/types";

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
