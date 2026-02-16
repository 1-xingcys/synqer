"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useEventDetail } from "@/hooks/useEventDetail";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useMemo, useState } from "react";
import { FilterTabs } from "./FilterTabs";
import { SearchInput } from "./SearchInput";
import { ParticipantCard } from "./ParticipantCard";
import { ParticipantListItem } from "./ParticipantListItem";
import { FilterType, ParticipantItem } from "./types";

export default function JoinedEventParticipantsPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const t = useTranslations();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const { data: eventDetailData, isLoading, error } = useEventDetail(eventId);

  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Transform expectedParticipants to ParticipantItem
  const participants = useMemo<ParticipantItem[]>(() => {
    if (!eventDetailData) return [];

    return eventDetailData.expectedParticipants.map((p) => ({
      id: p.id,
      displayName: p.user?.displayName || p.lineUserId || "Unknown",
      pictureUrl: p.user?.avatarUrl || undefined,
      hasVoted: p.hasVoted,
    }));
  }, [eventDetailData]);

  // Calculate counts
  const counts = useMemo(() => {
    const voted = participants.filter((p) => p.hasVoted).length;
    return {
      all: participants.length,
      voted,
      notVoted: participants.length - voted,
    };
  }, [participants]);

  // Filter and search participants
  const filteredParticipants = useMemo(() => {
    let result = participants;

    // Apply filter
    if (filter === "voted") {
      result = result.filter((p) => p.hasVoted);
    } else if (filter === "notVoted") {
      result = result.filter((p) => !p.hasVoted);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((p) =>
        p.displayName.toLowerCase().includes(query),
      );
    }

    return result;
  }, [participants, filter, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-lg text-zinc-600 dark:text-zinc-300">
            {t("event.loading")}
          </p>
        </div>
      </div>
    );
  }

  if (error || !eventDetailData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-lg text-red-600 dark:text-red-400">
            {error || t("event.notFound")}
          </p>
          <Link
            href="/joined"
            className="mt-4 inline-block px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {t("joined.backToJoined")}
          </Link>
        </div>
      </div>
    );
  }

  const statusLabels = {
    voted: t("joined.voted"),
    notVoted: t("joined.notVoted"),
  };

  return (
    <div className="py-4 space-y-6">
      {/* Filter, Search, and Participants */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Filter and Search */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <FilterTabs
              activeFilter={filter}
              onFilterChange={setFilter}
              counts={counts}
              labels={{
                all: t("joinedParticipants.filterAll"),
                voted: t("joinedParticipants.filterVoted"),
                notVoted: t("joinedParticipants.filterNotVoted"),
              }}
            />
            <div className="sm:w-64">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={t("joinedParticipants.searchPlaceholder")}
              />
            </div>
          </div>
        </div>

        {/* Participants Grid/List */}
        {filteredParticipants.length === 0 ? (
          <div className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
            {searchQuery
              ? t("joinedParticipants.noSearchResults")
              : t("joinedParticipants.noParticipants")}
          </div>
        ) : isDesktop ? (
          // Desktop: Grid view
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {filteredParticipants.map((participant) => (
              <ParticipantCard
                key={participant.id}
                participant={participant}
                labels={statusLabels}
              />
            ))}
          </div>
        ) : (
          // Mobile: List view
          <div>
            {filteredParticipants.map((participant) => (
              <ParticipantListItem
                key={participant.id}
                participant={participant}
                labels={statusLabels}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
