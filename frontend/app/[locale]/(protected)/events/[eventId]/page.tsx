"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/routing";
import { format } from "date-fns";
import { EventStatusBadge } from "@/components/Events/EventStatusBadge";
import { EventStatus } from "@/types/event";

interface EventPublicInfo {
  id: string;
  title: string | null;
  description: string | null;
  startDate: string;
  endDate: string;
  votingDeadline: string | null;
  confirmedStartTime: string | null;
  confirmedEndTime: string | null;
  status: EventStatus;
  participantCount: number;
}

interface ParticipationStatus {
  isParticipant: boolean;
  hasVoted: boolean;
}

export default function EventJoinPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const t = useTranslations();
  const router = useRouter();

  const [eventInfo, setEventInfo] = useState<EventPublicInfo | null>(null);
  const [participationStatus, setParticipationStatus] =
    useState<ParticipationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const apiBase = process.env.NEXT_PUBLIC_API;

        // 取得活動公開資訊
        const eventResponse = await fetch(
          `${apiBase}/events/${eventId}/public`,
        );
        if (!eventResponse.ok) {
          if (eventResponse.status === 404) {
            throw new Error("Event not found");
          }
          throw new Error("Failed to load event");
        }
        const eventData = (await eventResponse.json()) as EventPublicInfo;
        setEventInfo(eventData);

        // 取得使用者參與狀態
        const participationResponse = await fetch(
          `${apiBase}/events/${eventId}/participation`,
          { credentials: "include" },
        );
        if (participationResponse.ok) {
          const participationData =
            (await participationResponse.json()) as ParticipationStatus;
          setParticipationStatus(participationData);
        }

        setError(null);
      } catch (err) {
        console.error("Error loading event:", err);
        setError(err instanceof Error ? err.message : "Failed to load event");
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [eventId]);

  const handleJoin = async () => {
    try {
      setJoining(true);
      const apiBase = process.env.NEXT_PUBLIC_API;

      const response = await fetch(`${apiBase}/events/${eventId}/join`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to join event");
      }

      // 加入成功，跳轉到投票頁面
      router.push(`/joined/${eventId}`);
    } catch (err) {
      console.error("Error joining event:", err);
      setError(err instanceof Error ? err.message : "Failed to join event");
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-zinc-600 dark:text-zinc-400">
            {t("common.loading")}
          </p>
        </div>
      </div>
    );
  }

  if (error || !eventInfo) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
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
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            {t("event.notFound")}
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            {error || t("eventJoin.eventNotFoundDescription")}
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            {t("event.backToDashboard")}
          </Link>
        </div>
      </div>
    );
  }

  // 如果使用者已經是參與者
  if (participationStatus?.isParticipant) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            {t("eventJoin.alreadyParticipant")}
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-2">
            {t("eventJoin.alreadyParticipantDescription")}
          </p>
          <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-6">
            {eventInfo.title || t("event.untitled")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/joined/${eventId}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {participationStatus.hasVoted
                ? t("eventJoin.goToEvent")
                : t("eventJoin.goToVote")}
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 加入確認頁面
  return (
    <div className="min-h-[60vh] flex items-center justify-center py-8">
      <div className="max-w-lg w-full mx-auto px-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-linear-to-br from-blue-500 to-indigo-600 px-6 py-8 text-white text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-blue-100 text-sm mb-1">
              {t("eventJoin.youAreInvited")}
            </p>
            <h1 className="text-2xl font-bold">
              {eventInfo.title || t("event.untitled")}
            </h1>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Status Badge */}
            <div className="flex justify-center">
              <EventStatusBadge status={eventInfo.status} />
            </div>

            {/* Description */}
            {eventInfo.description && (
              <p className="text-zinc-600 dark:text-zinc-400 text-center">
                {eventInfo.description}
              </p>
            )}

            {/* Event Details */}
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 space-y-3">
              {/* Date Range */}
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                    {t("eventJoin.votingDateRange")}
                  </p>
                  <p className="text-zinc-900 dark:text-zinc-100 font-medium">
                    {format(new Date(eventInfo.startDate), "MMM d")} -{" "}
                    {format(new Date(eventInfo.endDate), "MMM d, yyyy")}
                  </p>
                </div>
              </div>

              {/* Voting Deadline */}
              {eventInfo.votingDeadline && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-amber-600 dark:text-amber-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                      {t("eventJoin.votingDeadline")}
                    </p>
                    <p className="text-zinc-900 dark:text-zinc-100 font-medium">
                      {format(
                        new Date(eventInfo.votingDeadline),
                        "MMM d, yyyy HH:mm",
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Confirmed Time */}
              {eventInfo.confirmedStartTime && eventInfo.confirmedEndTime && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-green-600 dark:text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                      {t("eventJoin.confirmedTime")}
                    </p>
                    <p className="text-zinc-900 dark:text-zinc-100 font-medium">
                      {format(
                        new Date(eventInfo.confirmedStartTime),
                        "MMM d, yyyy HH:mm",
                      )}{" "}
                      - {format(new Date(eventInfo.confirmedEndTime), "HH:mm")}
                    </p>
                  </div>
                </div>
              )}

              {/* Participants */}
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-purple-600 dark:text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                    {t("eventJoin.currentParticipants")}
                  </p>
                  <p className="text-zinc-900 dark:text-zinc-100 font-medium">
                    {t("dashboard.participants", {
                      count: eventInfo.participantCount,
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={() => void handleJoin()}
                disabled={joining}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {joining ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    {t("eventJoin.joining")}
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                      />
                    </svg>
                    {t("eventJoin.joinEvent")}
                  </>
                )}
              </button>
              <Link
                href="/dashboard"
                className="w-full py-3 px-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-medium text-center"
              >
                {t("eventJoin.cancel")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
