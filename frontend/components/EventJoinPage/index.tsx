"use client";

import { useEventJoin } from "./useEventJoin";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorView } from "./ErrorView";
import { AlreadyParticipantView } from "./AlreadyParticipantView";
import { JoinConfirmView } from "./JoinConfirmView";

interface EventJoinPageProps {
  eventId: string;
}

export default function EventJoinPage({ eventId }: EventJoinPageProps) {
  const {
    eventInfo,
    participationStatus,
    loading,
    joining,
    error,
    handleJoin,
  } = useEventJoin(eventId);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !eventInfo) {
    return <ErrorView error={error} />;
  }

  // 如果使用者已經是參與者
  if (participationStatus?.isParticipant) {
    return (
      <AlreadyParticipantView
        eventId={eventId}
        eventTitle={eventInfo.title}
        hasVoted={participationStatus.hasVoted}
      />
    );
  }

  // 加入確認頁面
  return (
    <JoinConfirmView
      eventInfo={eventInfo}
      joining={joining}
      onJoin={() => void handleJoin()}
    />
  );
}
