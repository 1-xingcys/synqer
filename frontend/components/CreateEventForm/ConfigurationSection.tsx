"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  parseTimeToMinutes,
  RESTRICT_START_DATE_TO_TODAY,
} from "./types";

interface ConfigurationSectionProps {
  startDate: Date | null;
  endDate: Date | null;
  startTime: string;
  endTime: string;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
}

// Time picker component with 12-hour format
function TimePicker({
  value,
  onChange,
  minTime,
  maxTime,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  minTime?: string;
  maxTime?: string;
  id: string;
}) {
  const t = useTranslations();

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
  const hour12 = hour24 === 0 ? 12 : hour24 === 12 ? 12 : hour24 === 24 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;

  // Parse min/max constraints
  const minMinutes = minTime ? parseTimeToMinutes(minTime) : 0;
  const maxMinutes = maxTime
    ? maxTime === "24:00"
      ? 24 * 60
      : parseTimeToMinutes(maxTime)
    : 24 * 60;

  // Generate valid hours based on constraints
  const getValidHours = () => {
    const hours: { value: number; label: string; period: "AM" | "PM" }[] = [];

    for (let h = 0; h <= 24; h++) {
      // Check if any minute in this hour is valid
      const hourStart = h * 60;
      const hourEnd = h * 60 + 45; // Last valid minute slot

      // For 24:00, only allow if maxMinutes is 24*60
      if (h === 24) {
        if (maxMinutes >= 24 * 60 && minMinutes < 24 * 60) {
          hours.push({ value: 24, label: "12", period: "AM" }); // 24:00 shown as 12 AM (midnight end)
        }
        continue;
      }

      if (hourEnd >= minMinutes && hourStart < maxMinutes) {
        const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
        const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
        hours.push({ value: h, label: displayHour.toString(), period });
      }
    }

    return hours;
  };

  // Generate valid minutes for selected hour
  const getValidMinutes = () => {
    const minutes: number[] = [];
    const currentHour24 =
      is24 || (isPM && hour12 === 12)
        ? is24
          ? 24
          : 12
        : isPM
          ? hour12 + 12
          : hour12 === 12
            ? 0
            : hour12;

    for (let m = 0; m < 60; m += 15) {
      const totalMinutes = currentHour24 * 60 + m;
      if (totalMinutes >= minMinutes && totalMinutes <= maxMinutes) {
        // For 24:00, only allow minute 0
        if (currentHour24 === 24 && m !== 0) continue;
        minutes.push(m);
      }
    }

    return minutes;
  };

  const validHours = useMemo(getValidHours, [minMinutes, maxMinutes]);
  const validMinutes = useMemo(getValidMinutes, [
    hour12,
    isPM,
    is24,
    minMinutes,
    maxMinutes,
  ]);

  // Handle hour change
  const handleHourChange = (newHour12: number, newPeriod: "AM" | "PM") => {
    let newHour24: number;

    if (newHour12 === 12) {
      newHour24 = newPeriod === "AM" ? 0 : 12;
    } else {
      newHour24 = newPeriod === "PM" ? newHour12 + 12 : newHour12;
    }

    // Check for 24:00 special case (shown as 12 AM at end)
    if (newHour24 === 24) {
      onChange("24:00");
      return;
    }

    // Keep current minute if valid, otherwise use first valid minute
    let newMinute = minute;
    const newMinutes: number[] = [];
    for (let m = 0; m < 60; m += 15) {
      const totalMinutes = newHour24 * 60 + m;
      if (totalMinutes >= minMinutes && totalMinutes <= maxMinutes) {
        newMinutes.push(m);
      }
    }

    if (!newMinutes.includes(newMinute)) {
      newMinute = newMinutes[0] ?? 0;
    }

    onChange(
      `${newHour24.toString().padStart(2, "0")}:${newMinute.toString().padStart(2, "0")}`,
    );
  };

  // Handle minute change
  const handleMinuteChange = (newMinute: number) => {
    if (is24) {
      // If currently 24:00, changing minutes means we need to change hour
      onChange(`23:${newMinute.toString().padStart(2, "0")}`);
      return;
    }

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

  // Group hours by AM/PM for display
  const amHours = validHours.filter((h) => h.period === "AM");
  const pmHours = validHours.filter((h) => h.period === "PM");

  return (
    <div className="flex gap-2">
      {/* Hour selector */}
      <select
        id={`${id}-hour`}
        value={is24 ? "24" : hour12.toString()}
        onChange={(e) => {
          const val = e.target.value;
          if (val === "24") {
            onChange("24:00");
          } else {
            handleHourChange(parseInt(val, 10), isPM ? "PM" : "AM");
          }
        }}
        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {validHours.map((h) => (
          <option
            key={`${h.value}-${h.period}`}
            value={h.value === 24 ? "24" : h.label}
          >
            {h.label}
          </option>
        ))}
      </select>

      {/* Minute selector */}
      <select
        id={`${id}-minute`}
        value={is24 ? "00" : minute.toString().padStart(2, "0")}
        onChange={(e) => handleMinuteChange(parseInt(e.target.value, 10))}
        className="w-20 px-3 py-1.5 text-sm border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        disabled={is24}
      >
        {validMinutes.map((m) => (
          <option key={m} value={m.toString().padStart(2, "0")}>
            {m.toString().padStart(2, "0")}
          </option>
        ))}
      </select>

      {/* AM/PM selector */}
      <select
        id={`${id}-period`}
        value={is24 ? "AM" : isPM ? "PM" : "AM"}
        onChange={(e) => handlePeriodChange(e.target.value as "AM" | "PM")}
        className="w-20 px-3 py-1.5 text-sm border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        disabled={is24}
      >
        {amHours.length > 0 && <option value="AM">AM</option>}
        {pmHours.length > 0 && <option value="PM">PM</option>}
      </select>
    </div>
  );
}

export function ConfigurationSection({
  startDate,
  endDate,
  startTime,
  endTime,
  onStartDateChange,
  onEndDateChange,
  onStartTimeChange,
  onEndTimeChange,
}: ConfigurationSectionProps) {
  const t = useTranslations();

  // Min date for date picker
  const minDate = RESTRICT_START_DATE_TO_TODAY ? new Date() : undefined;

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
                {t("createEvent.configuration.startDate")}
              </label>
              <DatePicker
                selected={startDate}
                onChange={onStartDateChange}
                dateFormat="yyyy-MM-dd"
                minDate={minDate}
                maxDate={endDate || undefined}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                wrapperClassName="w-full"
                placeholderText={t("createEvent.configuration.selectDate")}
              />
            </div>

            <div>
              <label
                htmlFor="endDate"
                className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5"
              >
                {t("createEvent.configuration.endDate")}
              </label>
              <DatePicker
                selected={endDate}
                onChange={onEndDateChange}
                dateFormat="yyyy-MM-dd"
                minDate={startDate || minDate}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                wrapperClassName="w-full"
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
              <TimePicker
                id="startTime"
                value={startTime}
                onChange={onStartTimeChange}
                maxTime={endTime}
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
              <TimePicker
                id="endTime"
                value={endTime}
                onChange={onEndTimeChange}
                minTime={startTime}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
