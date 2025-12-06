"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useMyEvents } from "@/hooks/useMyEvents";
import { useAttendedEvents } from "@/hooks/useAttendedEvents";
import EventList from "@/components/Dashboard/EventList";

export type SidebarView = "my-events" | "attended-events";

export default function Dashboard() {
  const t = useTranslations();
  const searchParams = useSearchParams();

  // 從 URL 參數讀取當前視圖
  const currentView = useMemo<SidebarView>(() => {
    const view = searchParams.get("view");
    if (view === "attended-events") return "attended-events";
    return "my-events";
  }, [searchParams]);

  // 載入兩種活動列表
  const myEventsData = useMyEvents();
  const attendedEventsData = useAttendedEvents();

  // 根據當前 view 決定顯示哪個列表
  const currentData =
    currentView === "my-events" ? myEventsData : attendedEventsData;

  const viewTitles: Record<SidebarView, string> = {
    "my-events": t("dashboard.myEvents"),
    "attended-events": t("dashboard.attendedEvents"),
  };

  return (
    <div className="py-8 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          {viewTitles[currentView]}
        </h2>
      </div>

      <EventList
        events={currentData.events}
        loading={currentData.loading}
        error={currentData.error}
      />
    </div>
  );
}
