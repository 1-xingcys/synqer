"use client";

import { useTranslations } from "next-intl";
import { useAttendedEvents } from "@/hooks/useAttendedEvents";
import EventList from "@/components/Dashboard/EventList";

export default function Dashboard() {
  const t = useTranslations();

  // 載入參與的活動列表
  const attendedEventsData = useAttendedEvents();

  return (
    <div className="py-8 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          {t("dashboard.joinedEvents")}
        </h2>
      </div>

      <EventList
        events={attendedEventsData.events}
        loading={attendedEventsData.loading}
        error={attendedEventsData.error}
      />
    </div>
  );
}
