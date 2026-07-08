"use client";

import { ReactNode } from "react";
import { useParams } from "next/navigation";
import { useUnifiedEventDetail } from "@/hooks/useUnifiedEventDetail";
import { UnifiedEventDetailContent } from "./UnifiedEventDetailContent";

export default function UnifiedEventDetailLayout({
  children,
}: {
  children: ReactNode;
}) {
  const params = useParams();
  const eventId = params.eventId as string;
  const { isHost } = useUnifiedEventDetail(eventId);

  return (
    <UnifiedEventDetailContent isHost={isHost}>
      {children}
    </UnifiedEventDetailContent>
  );
}
