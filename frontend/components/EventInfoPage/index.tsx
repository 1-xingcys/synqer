"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEventInfo } from "./hooks/useEventInfo";
import { useAuthContext } from "@/contexts/AuthContext";
import { EventInfoHeader } from "./EventInfoHeader";
import { EventInfoDetail } from "./EventInfoDetail";
import { EventInfoParticipants } from "./EventInfoParticipants";

export function EventInfoPage() {
  const params = useParams();
  const t = useTranslations();
  const eventId = params.eventId as string;
  const { data, isLoading, error } = useEventInfo(eventId);
  const { user } = useAuthContext();

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-600 dark:text-zinc-400">
              {t("common.loading")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-center min-h-[40vh]">
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
            <p className="text-red-600 dark:text-red-400">
              {error || t("event.notFound")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (data.isDeleted) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <p className="text-zinc-600 dark:text-zinc-400">
              {t("joined.eventDeleted")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { event, host, expectedParticipants, currentUserHasVoted } = data;

  return (
    <div className="mx-auto py-4 sm:py-8">
      <EventInfoHeader
        eventId={eventId}
        title={event.title}
        host={host}
        createdAt={event.createdAt}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-8">
        {/* Left Column: Main Info */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl py-4 px-5 sm:py-5 sm:px-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <EventInfoDetail
              status={event.status}
              startDate={event.startDate}
              endDate={event.endDate}
              startMinuteOfDay={event.startMinuteOfDay}
              endMinuteOfDay={event.endMinuteOfDay}
              votingDeadline={event.votingDeadline}
              currentUserHasVoted={currentUserHasVoted}
            />
          </div>
        </div>

        {/* Right Column: Participants */}
        <div className="lg:col-span-1">
          <EventInfoParticipants
            expectedParticipants={expectedParticipants}
            currentUserId={user?.id?.toString()}
          />
        </div>
      </div>
    </div>
  );
}
