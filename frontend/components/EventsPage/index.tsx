"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useAuthContext } from "@/contexts/AuthContext";
import { useEventDetail } from "@/hooks/useEventDetail";
import TimeSlotGrid from "@/components/EventsPage/TimeSlotGrid";
import HeatmapGrid from "@/components/EventsPage/HeatmapGrid";
import EventInfo from "@/components/EventsPage/EventInfo";
import ProtectedPageLayout from "@/components/ProtectedPageLayout";
import EventSidebar from "@/components/EventsPage/EventSidebar";

interface EventsPageProps {
  eventId: string;
}

export default function EventsPage({ eventId }: EventsPageProps) {
  const t = useTranslations("event");
  const { user } = useAuthContext();

  const {
    data: eventDetailData,
    loading,
    error,
    saveVotes,
  } = useEventDetail(eventId);
  const [activeTab, setActiveTab] = useState<"vote" | "heatmap">("vote");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // 預設收合

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  let content: ReactNode;

  if (loading) {
    content = (
      <div className="flex min-h-[60vh] items-center justify-center text-lg text-zinc-600 dark:text-zinc-300">
        {t("loading")}
      </div>
    );
  } else if (error || !eventDetailData) {
    content = (
      <div className="flex min-h-[60vh] items-center justify-center text-lg text-red-600 dark:text-red-400">
        {error || t("notFound")}
      </div>
    );
  } else {
    // 取得目前使用者已投票的 slotIds
    const currentUserVotes: string[] = user
      ? eventDetailData.votes
          .filter((vote) => vote.userId === user.id.toString())
          .map((vote) => vote.slotId)
      : [];

    content = (
      <>
        {/* 標題區 */}
        <EventInfo
          event={eventDetailData.event}
          participants={eventDetailData.participants}
        />

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
                slots={eventDetailData.slots}
                onSave={saveVotes}
                initialSelectedIds={currentUserVotes}
              />
            ) : (
              <HeatmapGrid
                slots={eventDetailData.slots}
                votes={eventDetailData.votes}
                participants={eventDetailData.participants}
              />
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <ProtectedPageLayout
      sidebar={
        <EventSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      }
      onMenuClick={toggleSidebar}
      contentClassName="py-8 space-y-6"
    >
      {content}
    </ProtectedPageLayout>
  );
}
