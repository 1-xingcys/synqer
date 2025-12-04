"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMyEvents } from "@/hooks/useMyEvents";
import { useAttendedEvents } from "@/hooks/useAttendedEvents";
import EventList from "@/components/Dashboard/EventList";
import CreateEventModal from "@/components/CreateEventModal";
import DashboardSidebar, {
  type SidebarView,
} from "@/components/Dashboard/DashboardSidebar";
import ProtectedPageLayout from "@/components/ProtectedPageLayout";

export default function Dashboard() {
  const t = useTranslations();
  const [currentView, setCurrentView] = useState<SidebarView>("my-events");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // 預設收合

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

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <ProtectedPageLayout
      sidebar={
        <DashboardSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          currentView={currentView}
          onViewChange={setCurrentView}
          onCreateEvent={() => setIsCreateModalOpen(true)}
        />
      }
      onMenuClick={toggleSidebar}
      contentClassName="py-8 space-y-6"
    >
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

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </ProtectedPageLayout>
  );
}
