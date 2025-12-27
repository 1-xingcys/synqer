"use client";

import { useTranslations } from "next-intl";
import { useHostedEvents } from "@/hooks/useHostedEvents";
import { useFilteredHostedEvents } from "@/hooks/useFilteredHostedEvents";
import {
  EventSection,
  EmptyState,
} from "@/components/eventCommon/EventsOverview";
import { EventStatus } from "@/types/event";

const TOP_N = 5;
const TRANSLATION_NS = "hostedEvents";

export default function HostedOverviewContent() {
  const t = useTranslations(TRANSLATION_NS);
  const { events, loading, error } = useHostedEvents();
  const filteredEvents = useFilteredHostedEvents(events);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
          <p className="text-zinc-600 dark:text-zinc-400">{t("loading")}</p>
        </div>
      </div>
    );
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
          mode="hosted"
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
          mode="hosted"
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
          mode="hosted"
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
          mode="hosted"
          translationNamespace={TRANSLATION_NS}
        />
      )}
    </div>
  );
}
