"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useHostedEventDetail } from "@/hooks/useHostedEventDetail";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function SettingsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const t = useTranslations();
  const { data: eventData, loading, refetch } = useHostedEventDetail(eventId);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: null as Date | null,
    endDate: null as Date | null,
    startTime: "00:00",
    endTime: "23:59",
    slotDurationMin: 15,
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initialize form data from event
  useEffect(() => {
    if (eventData?.event) {
      const event = eventData.event;
      const formatMinuteToTime = (minute: number) => {
        const hours = Math.floor(minute / 60);
        const mins = minute % 60;
        return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
      };

      setFormData({
        title: event.title || "",
        description: event.description || "",
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        startTime: formatMinuteToTime(event.startMinuteOfDay),
        endTime: formatMinuteToTime(event.endMinuteOfDay),
        slotDurationMin: event.slotDurationMin,
      });
    }
  }, [eventData]);

  const handleSave = async () => {
    try {
      setSaving(true);

      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API}/events/${eventId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            startDate: formData.startDate ? formatDate(formData.startDate) : undefined,
            endDate: formData.endDate ? formatDate(formData.endDate) : undefined,
            startTime: formData.startTime,
            endTime: formData.endTime,
            slotDurationMin: formData.slotDurationMin,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update event");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      void refetch();
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API}/events/${eventId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      router.push("/hosted");
    } catch (error) {
      console.error("Failed to delete event:", error);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-zinc-600 dark:text-zinc-400">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {t("hosted.settingsPage.title")}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {t("hosted.settingsPage.description")}
        </p>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
        {/* Event Name */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            {t("hosted.settingsPage.eventName")}
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={t("createEvent.general.eventNamePlaceholder")}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            {t("hosted.settingsPage.eventDescription")}
          </label>
          <textarea
            rows={4}
            maxLength={350}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            placeholder={t("createEvent.general.descriptionPlaceholder")}
          />
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {formData.description.length} / 350{" "}
            {t("createEvent.general.characters")}
          </p>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            {t("hosted.settingsPage.dateRange")}
          </label>
          <div className="grid grid-cols-2 gap-4">
            <DatePicker
              selected={formData.startDate}
              onChange={(date: Date | null) =>
                setFormData({ ...formData, startDate: date })
              }
              dateFormat="yyyy-MM-dd"
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholderText={t("createEvent.configuration.startDate")}
            />
            <DatePicker
              selected={formData.endDate}
              onChange={(date: Date | null) =>
                setFormData({ ...formData, endDate: date })
              }
              dateFormat="yyyy-MM-dd"
              minDate={formData.startDate || undefined}
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholderText={t("createEvent.configuration.endDate")}
            />
          </div>
        </div>

        {/* Time Range */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            {t("hosted.settingsPage.timeRange")}
          </label>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) =>
                setFormData({ ...formData, startTime: e.target.value })
              }
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="time"
              value={formData.endTime}
              onChange={(e) =>
                setFormData({ ...formData, endTime: e.target.value })
              }
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Slot Duration */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            {t("hosted.settingsPage.slotDuration")}
          </label>
          <select
            value={formData.slotDurationMin}
            onChange={(e) =>
              setFormData({
                ...formData,
                slotDurationMin: Number(e.target.value),
              })
            }
            className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={15}>15 {t("createEvent.configuration.minutes")}</option>
            <option value={30}>30 {t("createEvent.configuration.minutes")}</option>
            <option value={60}>60 {t("createEvent.configuration.minutes")}</option>
          </select>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <svg
                  className="animate-spin w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {t("common.saving")}
              </>
            ) : saveSuccess ? (
              <>
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {t("hosted.settingsPage.saved")}
              </>
            ) : (
              t("hosted.settingsPage.saveChanges")
            )}
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-red-200 dark:border-red-900/50 p-6">
        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
          {t("hosted.settingsPage.dangerZone")}
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          {t("hosted.settingsPage.deleteWarning")}
        </p>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            {t("hosted.settingsPage.deleteEvent")}
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <p className="text-sm text-red-600 dark:text-red-400">
              {t("hosted.settingsPage.confirmDelete")}
            </p>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              {deleting ? t("common.loading") : t("common.delete")}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors text-sm font-medium"
            >
              {t("common.cancel")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

