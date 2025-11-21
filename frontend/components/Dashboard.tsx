"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMyEvents } from "@/hooks/useMyEvents";
import EventList from "@/components/EventList";
import CreateEventModal from "@/components/CreateEventModal";

export default function Dashboard() {
  const t = useTranslations();
  const { events, loading, error } = useMyEvents();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {t("dashboard.myEvents")}
          </h2>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          {t("dashboard.createNewEvent")}
        </button>
      </div>

      <EventList events={events} loading={loading} error={error} />

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
