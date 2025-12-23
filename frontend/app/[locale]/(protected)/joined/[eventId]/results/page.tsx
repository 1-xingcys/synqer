"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useEventDetail } from "@/hooks/useEventDetail";
import ResultsView from "@/components/eventCommon/ResultsView";
import { useMemo } from "react";

export default function JoinedEventResultsPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const t = useTranslations("event");
  const tJoined = useTranslations("joined");
  const router = useRouter();

  const { data: eventDetailData, loading, error } = useEventDetail(eventId);

  // Transform participants to include avatar info
  const participantsWithAvatars = useMemo(() => {
    if (!eventDetailData) return [];

    return eventDetailData.expectedParticipants.map((p) => ({
      userId: p.userId || p.user?.id || p.id,
      displayName:
        p.user?.displayName || p.lineGroupMember?.displayName || "Unknown",
      pictureUrl: p.user?.avatarUrl || p.lineGroupMember?.pictureUrl,
    }));
  }, [eventDetailData]);

  // Create a mapping of userId to pictureUrl for votes
  const pictureUrlMap = useMemo(() => {
    const map = new Map<string, string | undefined>();
    participantsWithAvatars.forEach((p) => {
      if (p.userId) {
        map.set(p.userId, p.pictureUrl);
      }
    });
    return map;
  }, [participantsWithAvatars]);

  // Transform votes to include avatar info
  const votesWithAvatars = useMemo(() => {
    if (!eventDetailData) return [];

    return eventDetailData.votes.map((vote) => ({
      ...vote,
      pictureUrl: pictureUrlMap.get(vote.userId),
    }));
  }, [eventDetailData, pictureUrlMap]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-lg text-zinc-600 dark:text-zinc-300">
            {t("loading")}
          </p>
        </div>
      </div>
    );
  }

  if (error || !eventDetailData) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
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
            {error || t("notFound")}
          </p>
          <button
            onClick={() => router.push("/joined")}
            className="mt-4 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {tJoined("backToJoined")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          {tJoined("tabs.results")}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {eventDetailData.event.title || t("untitled")}
        </p>
      </div>

      {/* Results View with HeatMap */}
      <ResultsView
        slots={eventDetailData.slots}
        votes={votesWithAvatars}
        participants={participantsWithAvatars}
      />
    </div>
  );
}
