"use client";

import { ReactNode } from "react";
import { useParams } from "next/navigation";
import {
  JoinedEventProvider,
  useJoinedEventContext,
} from "@/contexts/JoinedEventContext";
import { HostedEventProvider } from "@/contexts/HostedEventContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { UnifiedEventDetailContent } from "./UnifiedEventDetailContent";

function Inner({ children }: { children: ReactNode }) {
  const params = useParams();
  const eventId = params.eventId as string;
  const { data } = useJoinedEventContext();
  const { user } = useAuthContext();

  const isHost = Boolean(
    user?.id !== undefined &&
      data?.event.ownerId != null &&
      user.id.toString() === data.event.ownerId.toString(),
  );

  const content = (
    <UnifiedEventDetailContent isHost={isHost}>
      {children}
    </UnifiedEventDetailContent>
  );

  // 主辦者：額外掛 HostedEventProvider 讓 host 視角 tabs（Results/Participants/Settings）取得資料
  return isHost ? (
    <HostedEventProvider eventId={eventId}>{content}</HostedEventProvider>
  ) : (
    content
  );
}

export default function UnifiedEventDetailLayout({
  children,
}: {
  children: ReactNode;
}) {
  const params = useParams();
  const eventId = params.eventId as string;

  return (
    <JoinedEventProvider eventId={eventId}>
      <Inner>{children}</Inner>
    </JoinedEventProvider>
  );
}
