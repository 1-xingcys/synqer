"use client";

import { useTranslations } from "next-intl";
import ResultsView from "@/features/time-grid/results-view";
import { SkeletonRegion } from "@/components/ui/skeleton-region";
import { ResultsTabSkeleton } from "../ResultsTabSkeleton";
import { normalizeGranularity, toVoteMode } from "@/lib/eventPreference";
import { useJoinedEventResults } from "./useJoinedEventResults";
import { ErrorView } from "./ErrorView";

interface GuestResultsViewProps {
  eventId: string;
}

export default function GuestResultsView({ eventId }: GuestResultsViewProps) {
  const tJoined = useTranslations("joined");
  const {
    data,
    isLoading,
    error,
    participantsWithAvatars,
    votesWithAvatars,
    committedSlotIds,
  } = useJoinedEventResults(eventId);

  // Unreachable in practice: this shares useEventDetail's query with the layout,
  // which only renders this view once that query has settled. Kept as a guard,
  // and matched to the host view so both read the same.
  if (isLoading) {
    return (
      <SkeletonRegion>
        <ResultsTabSkeleton />
      </SkeletonRegion>
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
        committedSlotIds={committedSlotIds}
      />
    </div>
  );
}
