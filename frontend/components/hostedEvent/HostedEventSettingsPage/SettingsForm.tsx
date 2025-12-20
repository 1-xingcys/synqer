"use client";

import { useTranslations } from "next-intl";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import type { EventSettingsFormData } from "./useEventSettings";

interface SettingsFormProps {
  formData: EventSettingsFormData;
  onFieldChange: <K extends keyof EventSettingsFormData>(
    field: K,
    value: EventSettingsFormData[K],
  ) => void;
}

export function SettingsForm({ formData, onFieldChange }: SettingsFormProps) {
  const t = useTranslations();

  return (
    <div className="space-y-6">
      {/* Event Name */}
      <FormField label={t("hosted.settingsPage.eventName")}>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => onFieldChange("title", e.target.value)}
          className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder={t("createEvent.general.eventNamePlaceholder")}
        />
      </FormField>

      {/* Description */}
      <FormField label={t("hosted.settingsPage.eventDescription")}>
        <textarea
          rows={4}
          maxLength={350}
          value={formData.description}
          onChange={(e) => onFieldChange("description", e.target.value)}
          className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          placeholder={t("createEvent.general.descriptionPlaceholder")}
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {formData.description.length} / 350{" "}
          {t("createEvent.general.characters")}
        </p>
      </FormField>

      {/* Date Range */}
      <FormField label={t("hosted.settingsPage.dateRange")}>
        <div className="grid grid-cols-2 gap-4">
          <DatePicker
            selected={formData.startDate}
            onChange={(date: Date | null) => onFieldChange("startDate", date)}
            dateFormat="yyyy-MM-dd"
            className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholderText={t("createEvent.configuration.startDate")}
          />
          <DatePicker
            selected={formData.endDate}
            onChange={(date: Date | null) => onFieldChange("endDate", date)}
            dateFormat="yyyy-MM-dd"
            minDate={formData.startDate || undefined}
            className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholderText={t("createEvent.configuration.endDate")}
          />
        </div>
      </FormField>

      {/* Time Range */}
      <FormField label={t("hosted.settingsPage.timeRange")}>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="time"
            value={formData.startTime}
            onChange={(e) => onFieldChange("startTime", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="time"
            value={formData.endTime}
            onChange={(e) => onFieldChange("endTime", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </FormField>

      {/* Slot Duration */}
      <FormField label={t("hosted.settingsPage.slotDuration")}>
        <select
          value={formData.slotDurationMin}
          onChange={(e) =>
            onFieldChange("slotDurationMin", Number(e.target.value))
          }
          className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value={15}>
            15 {t("createEvent.configuration.minutes")}
          </option>
          <option value={30}>
            30 {t("createEvent.configuration.minutes")}
          </option>
          <option value={60}>
            60 {t("createEvent.configuration.minutes")}
          </option>
        </select>
      </FormField>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
