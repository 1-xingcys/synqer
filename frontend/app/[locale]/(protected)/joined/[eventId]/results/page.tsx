"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/routing";
import { useEventDetail } from "@/hooks/useEventDetail";
import { useMemo, useState } from "react";

interface TimeSlot {
  id: string;
  date: string;
  startMinute: number;
  endMinute: number;
  index: number;
}

interface Vote {
  slotId: string;
  userId: string;
  userDisplayName: string;
}

export default function JoinedEventResultsPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const t = useTranslations("event");
  const tJoined = useTranslations("joined");
  const router = useRouter();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const { data: eventDetailData, loading, error } = useEventDetail(eventId);

  // Calculate vote counts and find best slots
  const {
    votesBySlot,
    maxVotes,
    slotsByDate,
    dates,
    timeSlots,
    topSlots,
  } = useMemo(() => {
    if (!eventDetailData) {
      return {
        votesBySlot: {} as Record<string, Vote[]>,
        maxVotes: 0,
        slotsByDate: {} as Record<string, TimeSlot[]>,
        dates: [] as string[],
        timeSlots: [] as TimeSlot[],
        topSlots: [] as Array<{ slot: TimeSlot; count: number; voters: string[] }>,
      };
    }

    const votesBySlot = eventDetailData.votes.reduce(
      (acc, vote) => {
        if (!acc[vote.slotId]) acc[vote.slotId] = [];
        acc[vote.slotId].push(vote);
        return acc;
      },
      {} as Record<string, Vote[]>
    );

    const maxVotes = Math.max(
      ...Object.values(votesBySlot).map((votes) => votes.length),
      1
    );

    const slotsByDate = eventDetailData.slots.reduce(
      (acc, slot) => {
        const dateKey = slot.date.split("T")[0];
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(slot);
        return acc;
      },
      {} as Record<string, TimeSlot[]>
    );

    const dates = Object.keys(slotsByDate).sort();
    const timeSlots = dates.length > 0 ? slotsByDate[dates[0]] : [];

    // Find top slots (sorted by vote count)
    const slotsWithCounts = eventDetailData.slots.map((slot) => ({
      slot,
      count: votesBySlot[slot.id]?.length || 0,
      voters: (votesBySlot[slot.id] || []).map((v) => v.userDisplayName),
    }));

    const topSlots = slotsWithCounts
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { votesBySlot, maxVotes, slotsByDate, dates, timeSlots, topSlots };
  }, [eventDetailData]);

  // Format helpers
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekday = date.toLocaleDateString(undefined, { weekday: "short" });
    const day = date.getDate();
    const month = date.toLocaleDateString(undefined, { month: "short" });
    return { weekday, day, month };
  };

  const formatFullDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Get color based on vote count (heatmap style)
  const getHeatmapColor = (voteCount: number) => {
    if (voteCount === 0) return "bg-gray-50 dark:bg-zinc-800/50";
    const intensity = Math.ceil((voteCount / maxVotes) * 5);
    const colorMap: Record<number, string> = {
      1: "bg-emerald-100 dark:bg-emerald-900/20",
      2: "bg-emerald-200 dark:bg-emerald-900/40",
      3: "bg-emerald-300 dark:bg-emerald-800/60",
      4: "bg-emerald-400 dark:bg-emerald-700/80",
      5: "bg-emerald-500 dark:bg-emerald-600",
    };
    return colorMap[intensity] || "bg-gray-50 dark:bg-zinc-800/50";
  };

  const getTextColor = (voteCount: number) => {
    const intensity = Math.ceil((voteCount / maxVotes) * 5);
    return intensity >= 4 ? "text-white" : "text-gray-700 dark:text-zinc-200";
  };

  // Get selected slot details
  const selectedSlotDetails = useMemo(() => {
    if (!selectedSlot || !eventDetailData) return null;
    const slot = eventDetailData.slots.find((s) => s.id === selectedSlot);
    if (!slot) return null;
    const voters = votesBySlot[selectedSlot] || [];
    const nonVoters = eventDetailData.participants.filter(
      (p) => !voters.some((v) => v.userId === p.userId)
    );
    return { slot, voters, nonVoters };
  }, [selectedSlot, eventDetailData, votesBySlot]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-lg text-zinc-600 dark:text-zinc-300">{t("loading")}</p>
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
          <p className="text-lg text-red-600 dark:text-red-400">{error || t("notFound")}</p>
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

  const totalParticipants = eventDetailData.participants.length;

  return (
    <div className="py-8 space-y-6">
      {/* Back button */}
      <div className="mb-4">
        <Link
          href={`/joined/${eventId}`}
          className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span>{tJoined("backToEvent")}</span>
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          {tJoined("results")}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {eventDetailData.event.title || t("untitled")}
        </p>
      </div>

      {/* Top Time Slots */}
      {topSlots.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z"
                  clipRule="evenodd"
                />
              </svg>
              {tJoined("bestTimeSlots")}
            </h2>
          </div>
          <div className="p-4">
            <div className="grid gap-3">
              {topSlots.map(({ slot, count, voters }, index) => (
                <div
                  key={slot.id}
                  className={`flex items-center gap-4 p-4 rounded-lg ${
                    index === 0
                      ? "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800"
                      : "bg-gray-50 dark:bg-zinc-800/50"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0
                        ? "bg-amber-500 text-white"
                        : index === 1
                        ? "bg-gray-300 dark:bg-zinc-600 text-gray-700 dark:text-zinc-200"
                        : index === 2
                        ? "bg-amber-700 text-white"
                        : "bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {formatFullDate(slot.date)}
                    </div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400 font-mono">
                      {formatTime(slot.startMinute)} - {formatTime(slot.endMinute)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {count}/{totalParticipants}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {Math.round((count / totalParticipants) * 100)}% {tJoined("available")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Availability Grid */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
            {tJoined("availabilityOverview")}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {tJoined("clickToSeeDetails")}
          </p>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto select-none">
            <div className="min-w-fit">
              {/* Date headers */}
              <div className="flex">
                {/* Time column header */}
                <div className="w-20 shrink-0" />
                {/* Date columns */}
                {dates.map((dateKey) => {
                  const { weekday, day, month } = formatDateHeader(dateKey);
                  return (
                    <div
                      key={dateKey}
                      className="flex-1 min-w-[60px] p-2 text-center mx-0.5"
                    >
                      <div className="text-xs text-gray-500 dark:text-zinc-400 font-medium">
                        {weekday}
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-zinc-100">
                        {day}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-zinc-500">{month}</div>
                    </div>
                  );
                })}
              </div>

              {/* Time slots grid */}
              <div className="border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                {timeSlots.map((timeSlot, timeIndex) => (
                  <div key={timeIndex} className="flex">
                    {/* Time label */}
                    <div className="w-20 shrink-0 px-2 py-3 text-xs font-medium text-gray-500 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-800/50 border-r border-gray-200 dark:border-zinc-700 flex items-center">
                      {formatTime(timeSlot.startMinute)}
                    </div>
                    {/* Slot cells */}
                    {dates.map((dateKey) => {
                      const slot = slotsByDate[dateKey][timeIndex];
                      const voteCount = votesBySlot[slot.id]?.length || 0;
                      const isSelected = selectedSlot === slot.id;

                      return (
                        <div
                          key={slot.id}
                          onClick={() => setSelectedSlot(isSelected ? null : slot.id)}
                          className={`
                            flex-1 min-w-[60px] min-h-[44px] relative
                            border-r border-b border-gray-100 dark:border-zinc-800
                            cursor-pointer transition-all duration-150
                            ${getHeatmapColor(voteCount)}
                            ${getTextColor(voteCount)}
                            ${isSelected ? "ring-2 ring-blue-500 dark:ring-blue-400 z-10" : "hover:ring-2 hover:ring-gray-300 dark:hover:ring-zinc-600"}
                          `}
                        >
                          <div className="h-full flex items-center justify-center font-medium text-sm">
                            {voteCount > 0 ? voteCount : ""}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-500 dark:text-zinc-400">
            <span>{tJoined("legend")}:</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700" />
              <span>0</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-emerald-200 dark:bg-emerald-900/40" />
              <span>{tJoined("few")}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-emerald-500 dark:bg-emerald-600" />
              <span>{tJoined("many")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected slot details */}
      {selectedSlotDetails && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {formatFullDate(selectedSlotDetails.slot.date)}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-mono">
                {formatTime(selectedSlotDetails.slot.startMinute)} -{" "}
                {formatTime(selectedSlotDetails.slot.endMinute)}
              </p>
            </div>
            <button
              onClick={() => setSelectedSlot(null)}
              className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors"
            >
              <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {t("available")} ({selectedSlotDetails.voters.length})
              </h4>
              {selectedSlotDetails.voters.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{tJoined("noVoters")}</p>
              ) : (
                <ul className="space-y-2">
                  {selectedSlotDetails.voters.map((voter) => (
                    <li key={voter.userId} className="flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                        {voter.userDisplayName[0]?.toUpperCase()}
                      </div>
                      <span className="text-zinc-700 dark:text-zinc-200">{voter.userDisplayName}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h4 className="font-medium text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                {t("unavailable")} ({selectedSlotDetails.nonVoters.length})
              </h4>
              {selectedSlotDetails.nonVoters.length === 0 ? (
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                  {tJoined("everyoneAvailable")}
                </p>
              ) : (
                <ul className="space-y-2">
                  {selectedSlotDetails.nonVoters.map((participant) => (
                    <li key={participant.userId} className="flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 dark:text-zinc-400 text-xs font-semibold">
                        {participant.displayName[0]?.toUpperCase()}
                      </div>
                      <span className="text-zinc-700 dark:text-zinc-200">{participant.displayName}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4 text-center">
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {totalParticipants}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {tJoined("totalParticipants")}
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {new Set(eventDetailData.votes.map((v) => v.userId)).size}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {tJoined("voted")}
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4 text-center">
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {eventDetailData.slots.length}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {tJoined("totalSlots")}
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4 text-center">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {topSlots.length > 0 ? topSlots[0].count : 0}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {tJoined("maxAvailability")}
          </div>
        </div>
      </div>
    </div>
  );
}

