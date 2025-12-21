"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { combineDateAndTime, parseTimeToMinutes } from "./types";
import { AlertCircle } from "lucide-react";

interface VotingDeadlineSectionProps {
  votingDeadline: Date | null;
  votingDeadlineTime: string;
  startDate: Date | null;
  startTime: string;
  isManuallySet: boolean;
  hasError: boolean;
  onDeadlineDateChange: (date: Date | null) => void;
  onDeadlineTimeChange: (time: string) => void;
}

// Time picker component with 12-hour format
function TimePicker({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  id: string;
}) {
  // Parse current value
  const [hourStr, minuteStr] = value.split(":");
  let hour24 = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  // Handle 24:00 case
  const is24 = value === "24:00";
  if (is24) {
    hour24 = 24;
  }

  // Convert to 12-hour format
  const isPM = hour24 >= 12 && hour24 < 24;
  const hour12 =
    hour24 === 0
      ? 12
      : hour24 === 12
        ? 12
        : hour24 === 24
          ? 12
          : hour24 > 12
            ? hour24 - 12
            : hour24;

  // Generate hours 1-12
  const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  // Generate minutes 00, 15, 30, 45
  const minutes = [0, 15, 30, 45];

  // Handle hour change
  const handleHourChange = (newHour12: number, period: "AM" | "PM") => {
    let newHour24: number;

    if (newHour12 === 12) {
      newHour24 = period === "AM" ? 0 : 12;
    } else {
      newHour24 = period === "PM" ? newHour12 + 12 : newHour12;
    }

    onChange(
      `${newHour24.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
    );
  };

  // Handle minute change
  const handleMinuteChange = (newMinute: number) => {
    let currentHour24: number;
    if (hour12 === 12) {
      currentHour24 = isPM ? 12 : 0;
    } else {
      currentHour24 = isPM ? hour12 + 12 : hour12;
    }

    onChange(
      `${currentHour24.toString().padStart(2, "0")}:${newMinute.toString().padStart(2, "0")}`,
    );
  };

  // Handle AM/PM change
  const handlePeriodChange = (newPeriod: "AM" | "PM") => {
    if (isPM === (newPeriod === "PM")) return;
    handleHourChange(hour12, newPeriod);
  };

  return (
    <div className="flex gap-2">
      {/* Hour selector */}
      <select
        id={`${id}-hour`}
        value={hour12.toString()}
        onChange={(e) => {
          handleHourChange(parseInt(e.target.value, 10), isPM ? "PM" : "AM");
        }}
        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {hours.map((h) => (
          <option key={h} value={h.toString()}>
            {h}
          </option>
        ))}
      </select>

      {/* Minute selector */}
      <select
        id={`${id}-minute`}
        value={minute.toString().padStart(2, "0")}
        onChange={(e) => handleMinuteChange(parseInt(e.target.value, 10))}
        className="w-20 px-3 py-1.5 text-sm border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {minutes.map((m) => (
          <option key={m} value={m.toString().padStart(2, "0")}>
            {m.toString().padStart(2, "0")}
          </option>
        ))}
      </select>

      {/* AM/PM selector */}
      <select
        id={`${id}-period`}
        value={isPM ? "PM" : "AM"}
        onChange={(e) => handlePeriodChange(e.target.value as "AM" | "PM")}
        className="w-20 px-3 py-1.5 text-sm border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}

export function VotingDeadlineSection({
  votingDeadline,
  votingDeadlineTime,
  startDate,
  startTime,
  isManuallySet,
  hasError,
  onDeadlineDateChange,
  onDeadlineTimeChange,
}: VotingDeadlineSectionProps) {
  const t = useTranslations();

  // Calculate if deadline is after event start
  const isDeadlineInvalid = useMemo(() => {
    if (!votingDeadline || !startDate) return false;

    const deadlineDateTime = combineDateAndTime(
      votingDeadline,
      votingDeadlineTime,
    );
    const startDateTime = combineDateAndTime(startDate, startTime);

    return deadlineDateTime > startDateTime;
  }, [votingDeadline, votingDeadlineTime, startDate, startTime]);

  return (
    <div className="rounded-lg lg:p-6 bg-white dark:bg-zinc-900 relative">
      <div className="flex items-start gap-6">
        {/* Step Number */}
        <div className="shrink-0 flex flex-col items-center relative z-10">
          <div className="w-7 h-7 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
            3
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-zinc-100 mb-1">
              {t("createEvent.votingDeadline.title")}
            </h2>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              {t("createEvent.votingDeadline.description")}
            </p>
          </div>

          {/* Deadline Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="votingDeadlineDate"
                className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5"
              >
                {t("createEvent.votingDeadline.date")}
              </label>
              <DatePicker
                selected={votingDeadline}
                onChange={onDeadlineDateChange}
                dateFormat="yyyy-MM-dd"
                maxDate={startDate || undefined}
                className={`w-full px-3 py-1.5 text-sm border rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isDeadlineInvalid
                    ? "border-red-400 dark:border-red-500"
                    : "border-gray-300 dark:border-zinc-700"
                }`}
                wrapperClassName="w-full"
                placeholderText={t("createEvent.configuration.selectDate")}
              />
            </div>

            <div>
              <label
                htmlFor="votingDeadlineTime"
                className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5"
              >
                {t("createEvent.votingDeadline.time")}
              </label>
              <TimePicker
                id="votingDeadlineTime"
                value={votingDeadlineTime}
                onChange={onDeadlineTimeChange}
              />
            </div>
          </div>

          {/* Auto-sync indicator */}
          {!isManuallySet && (
            <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
              {t("createEvent.votingDeadline.autoSync")}
            </p>
          )}

          {/* Error message */}
          {isDeadlineInvalid && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">
                {t("createEvent.votingDeadline.error")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
