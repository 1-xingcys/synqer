"use client";

import { ReactNode } from "react";
import { useParams } from "next/navigation";
import { JoinedEventProvider } from "@/contexts/JoinedEventContext";
import { JoinedEventGuard } from "./JoinedEventGuard";
import { JoinedEventLayoutContent } from "./JoinedEventLayoutContent";

interface JoinedEventLayoutProps {
  children: ReactNode;
}

export default function JoinedEventLayout({
  children,
}: JoinedEventLayoutProps) {
  const params = useParams();
  const eventId = params.eventId as string;

  return (
    <JoinedEventProvider eventId={eventId}>
      <JoinedEventGuard>
        <JoinedEventLayoutContent>{children}</JoinedEventLayoutContent>
      </JoinedEventGuard>
    </JoinedEventProvider>
  );
}
