"use client";

import { useTranslations } from "next-intl";
import ResultsView from "@/components/eventCommon/timeGrid/ResultsView";
import { LoadingState } from "@/components/ui/loading-state";
import { normalizeGranularity, toVoteMode } from "@/lib/eventPreference";
import { useJoinedEventResults } from "./useJoinedEventResults";
import { ErrorView } from "./ErrorView";

interface JoinedEventResultsPageProps {
  eventId: string;
}

export default function JoinedEventResultsPage({
  eventId,
}: JoinedEventResultsPageProps) {
  const tEvent = useTranslations("event");
  const tJoined = useTranslations("joined");
  const { data, isLoading, error, participantsWithAvatars, votesWithAvatars } =
    useJoinedEventResults(eventId);

  if (isLoading) {
    return (
      <LoadingState
        label={tEvent("loading")}
        viewport="section"
        textSize="lg"
      />
    );
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
        defaultGranularity={normalizeGranularity(
          data.event.defaultGranularityMin,
        )}
        defaultMode={toVoteMode(data.event.defaultVoteMode)}
        tip={tJoined("results.clickToSeeWho")}
      />
    </div>
  );
}
