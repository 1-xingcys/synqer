"use client";

import ResultsView from "@/components/eventCommon/timeGrid/ResultsView";
import { useJoinedEventResults } from "./useJoinedEventResults";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorView } from "./ErrorView";

interface JoinedEventResultsPageProps {
  eventId: string;
}

export default function JoinedEventResultsPage({
  eventId,
}: JoinedEventResultsPageProps) {
  const { data, isLoading, error, participantsWithAvatars, votesWithAvatars } =
    useJoinedEventResults(eventId);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !data) {
    return <ErrorView error={error} />;
  }

  return (
    <div className="space-y-6">
      {/* Results View with HeatMap */}
      <ResultsView
        slots={data.slots}
        votes={votesWithAvatars}
        participants={participantsWithAvatars}
        eventId={eventId}
      />
    </div>
  );
}
