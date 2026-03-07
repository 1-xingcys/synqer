"use client";

import { useTranslations } from "next-intl";
import { useHostedEvents } from "@/hooks/useHostedEvents";
import { useFilteredHostedEvents } from "@/hooks/useFilteredHostedEvents";
import {
  EventSection,
  EmptyState,
} from "@/components/eventCommon/eventsOverview";
import { EventStatus } from "@/types/event";
import { EventRowMode } from "@/components/eventCommon/eventsOverview/types";
import { LoadingState } from "@/components/ui/loading-state";

const TOP_N = 5;
const TRANSLATION_NS = "hostedEvents";

export default function HostedOverviewContent() {
  const t = useTranslations(TRANSLATION_NS);
  const { events, loading, error } = useHostedEvents();
  const filteredEvents = useFilteredHostedEvents(events);

  if (loading) {
    return <LoadingState label={t("loading")} spinnerTone="neutral" />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-red-600 dark:text-red-400">{t("error")}</p>
      </div>
    );
  }

  const hasAnyEvents =
    filteredEvents[EventStatus.VOTING].length > 0 ||
    filteredEvents[EventStatus.VOTING_ENDED].length > 0 ||
    filteredEvents[EventStatus.CONFIRMED].length > 0 ||
    filteredEvents[EventStatus.COMPLETED].length > 0;

  if (!hasAnyEvents) {
    return <EmptyState category="all" translationNamespace={TRANSLATION_NS} />;
  }

  return (
    <div className="space-y-6">
      {/* Voting Section - Show all */}
      {filteredEvents[EventStatus.VOTING].length > 0 && (
        <EventSection
          title={t("sections.voting")}
          events={filteredEvents[EventStatus.VOTING]}
          category={EventStatus.VOTING}
          showViewMore={filteredEvents[EventStatus.VOTING].length > TOP_N}
          viewMoreHref="/hosted/voting"
          limit={undefined} // Show all voting events
          mode={EventRowMode.HOSTED}
          translationNamespace={TRANSLATION_NS}
        />
      )}

      {/* Voting Ended Section - Top 5 */}
      {filteredEvents[EventStatus.VOTING_ENDED].length > 0 && (
        <EventSection
          title={t("sections.votingEnded")}
          events={filteredEvents[EventStatus.VOTING_ENDED]}
          category={EventStatus.VOTING_ENDED}
          showViewMore={true}
          viewMoreHref="/hosted/voting-ended"
          limit={TOP_N}
          mode={EventRowMode.HOSTED}
          translationNamespace={TRANSLATION_NS}
        />
      )}

      {/* Confirmed Section - Top 5 */}
      {filteredEvents[EventStatus.CONFIRMED].length > 0 && (
        <EventSection
          title={t("sections.confirmed")}
          events={filteredEvents[EventStatus.CONFIRMED]}
          category={EventStatus.CONFIRMED}
          showViewMore={true}
          viewMoreHref="/hosted/confirmed"
          limit={TOP_N}
          mode={EventRowMode.HOSTED}
          translationNamespace={TRANSLATION_NS}
        />
      )}

      {/* Completed Section - Top 5 */}
      {filteredEvents[EventStatus.COMPLETED].length > 0 && (
        <EventSection
          title={t("sections.completed")}
          events={filteredEvents[EventStatus.COMPLETED]}
          category={EventStatus.COMPLETED}
          showViewMore={true}
          viewMoreHref="/hosted/completed"
          limit={TOP_N}
          mode={EventRowMode.HOSTED}
          translationNamespace={TRANSLATION_NS}
        />
      )}
    </div>
  );
}
