"use client";

import { useTranslations } from "next-intl";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface ConfigurationSectionProps {
  startDate: Date | null;
  endDate: Date | null;
  startTime: string;
  endTime: string;
  slotDurationMin: number;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onSlotDurationChange: (value: number) => void;
}

export function ConfigurationSection({
  startDate,
  endDate,
  startTime,
  endTime,
  slotDurationMin,
  onStartDateChange,
  onEndDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onSlotDurationChange,
}: ConfigurationSectionProps) {
  const t = useTranslations();

  return (
    <div className="rounded-lg lg:p-6 bg-white dark:bg-zinc-900 relative">
      <div className="flex items-start gap-6">
        {/* Step Number */}
        <div className="shrink-0 flex flex-col items-center relative z-10">
          <div className="w-7 h-7 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
            2
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-zinc-100 mb-1">
              {t("createEvent.configuration.title")}
            </h2>
          </div>

          {/* Start Date & End Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="startDate"
                className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5"
              >
                {t("createEvent.configuration.startDate")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <DatePicker
                selected={startDate}
                onChange={onStartDateChange}
                dateFormat="yyyy-MM-dd"
                minDate={new Date()}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                wrapperClassName="w-full"
                required
                placeholderText={t("createEvent.configuration.selectDate")}
              />
            </div>

            <div>
              <label
                htmlFor="endDate"
                className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5"
              >
                {t("createEvent.configuration.endDate")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <DatePicker
                selected={endDate}
                onChange={onEndDateChange}
                dateFormat="yyyy-MM-dd"
                minDate={startDate || new Date()}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                wrapperClassName="w-full"
                required
                placeholderText={t("createEvent.configuration.selectDate")}
              />
            </div>
          </div>

          {/* Start Time & End Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="startTime"
                className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5"
              >
                {t("createEvent.configuration.startTime")}
              </label>
              <input
                type="time"
                id="startTime"
                value={startTime}
                onChange={(e) => onStartTimeChange(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
                {t("createEvent.configuration.timeDescription")}
              </p>
            </div>

            <div>
              <label
                htmlFor="endTime"
                className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5"
              >
                {t("createEvent.configuration.endTime")}
              </label>
              <input
                type="time"
                id="endTime"
                value={endTime}
                onChange={(e) => onEndTimeChange(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Slot Duration */}
          <div>
            <label
              htmlFor="slotDurationMin"
              className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5"
            >
              {t("createEvent.configuration.slotDuration")}
            </label>
            <select
              id="slotDurationMin"
              value={slotDurationMin}
              onChange={(e) => onSlotDurationChange(Number(e.target.value))}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
              {t("createEvent.configuration.slotDurationDescription")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
