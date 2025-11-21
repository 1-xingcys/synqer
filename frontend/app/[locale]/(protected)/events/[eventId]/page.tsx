"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { useEventDetail } from "@/hooks/useEventDetail";
import TimeSlotGrid from "@/components/TimeSlotGrid";
import HeatmapGrid from "@/components/HeatmapGrid";
import EventInfo from "@/components/EventInfo";

export default function EventPage() {
  const t = useTranslations("event");
  const params = useParams();
  const eventId = params.eventId as string;
  const { user } = useAuthContext();

  const { data, loading, error, saveVotes } = useEventDetail(eventId);
  const [activeTab, setActiveTab] = useState<"vote" | "heatmap">("vote");

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">{t("loading")}</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-red-600">{error || t("notFound")}</div>
      </div>
    );
  }

  // 取得目前使用者已投票的 slotIds
  const currentUserVotes: string[] = user
    ? data.votes
        .filter((vote) => vote.userId === user.id.toString())
        .map((vote) => vote.slotId)
    : [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 標題區 */}
      <EventInfo event={data.event} participants={data.participants} />

      {/* Tab 切換 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("vote")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "vote"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {t("myAvailability")}
            </button>
            <button
              onClick={() => setActiveTab("heatmap")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "heatmap"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {t("heatmap")}
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "vote" ? (
            <TimeSlotGrid
              slots={data.slots}
              onSave={saveVotes}
              initialSelectedIds={currentUserVotes}
            />
          ) : (
            <HeatmapGrid
              slots={data.slots}
              votes={data.votes}
              participants={data.participants}
            />
          )}
        </div>
      </div>
    </div>
  );
}
