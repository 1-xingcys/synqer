"use client";

import { useTranslations } from "next-intl";
import { useAttendedEvents } from "@/hooks/useAttendedEvents";
import { useFilteredAttendedEvents } from "@/hooks/useFilteredAttendedEvents";
import {
  EventSection,
  EmptyState,
} from "@/components/eventCommon/eventsOverview";
import { EventStatus } from "@/types/event";
import { EventRowMode } from "@/components/eventCommon/eventsOverview/types";
import { LoadingState } from "@/components/ui/loading-state";

const TOP_N = 5;

export default function OverviewContent() {
  const t = useTranslations("joinedEvents");
  const { events, loading, error } = useAttendedEvents();
  const filteredEvents = useFilteredAttendedEvents(events);

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
    return <EmptyState category="all" translationNamespace="joinedEvents" />;
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
          viewMoreHref="/joined/voting"
          limit={undefined} // Show all voting events
          mode={EventRowMode.JOINED}
          translationNamespace="joinedEvents"
        />
      )}

      {/* Voting Ended Section - Top 5 */}
      {filteredEvents[EventStatus.VOTING_ENDED].length > 0 && (
        <EventSection
          title={t("sections.votingEnded")}
          events={filteredEvents[EventStatus.VOTING_ENDED]}
          category={EventStatus.VOTING_ENDED}
          showViewMore={true}
          viewMoreHref="/joined/voting-ended"
          limit={TOP_N}
          mode={EventRowMode.JOINED}
          translationNamespace="joinedEvents"
        />
      )}

      {/* Confirmed Section - Top 5 */}
      {filteredEvents[EventStatus.CONFIRMED].length > 0 && (
        <EventSection
          title={t("sections.confirmed")}
          events={filteredEvents[EventStatus.CONFIRMED]}
          category={EventStatus.CONFIRMED}
          showViewMore={true}
          viewMoreHref="/joined/confirmed"
          limit={TOP_N}
          mode={EventRowMode.JOINED}
          translationNamespace="joinedEvents"
        />
      )}

      {/* Completed Section - Top 5 */}
      {filteredEvents[EventStatus.COMPLETED].length > 0 && (
        <EventSection
          title={t("sections.completed")}
          events={filteredEvents[EventStatus.COMPLETED]}
          category={EventStatus.COMPLETED}
          showViewMore={true}
          viewMoreHref="/joined/completed"
          limit={TOP_N}
          mode={EventRowMode.JOINED}
          translationNamespace="joinedEvents"
        />
      )}
    </div>
  );
}
