"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useAuthContext } from "@/contexts/AuthContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDownIcon } from "lucide-react";

export default function CreateEventForm() {
  const router = useRouter();
  const t = useTranslations();
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: null as Date | null,
    endDate: null as Date | null,
    startTime: "00:00",
    endTime: "23:59",
    slotDurationMin: 15,
    timeZone: "Asia/Taipei",
  });
  const [endDateManuallySet, setEndDateManuallySet] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.startDate || !formData.endDate) {
        alert("請選擇開始和結束日期");
        setLoading(false);
        return;
      }

      if (!process.env.NEXT_PUBLIC_API) {
        throw new Error("NEXT_PUBLIC_API is not set");
      }

      // 格式化日期為 YYYY-MM-DD
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const payload = {
        title: formData.title,
        description: formData.description || undefined,
        startDate: formatDate(formData.startDate),
        endDate: formatDate(formData.endDate),
        startTime: formData.startTime,
        endTime: formData.endTime,
        slotDurationMin: formData.slotDurationMin,
        timeZone: formData.timeZone,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to create event");
      }

      const result = (await response.json()) as { eventId: string };
      router.push(`/hosted/${result.eventId}`);
    } catch (error) {
      console.error("建立活動失敗:", error);
      alert("建立活動失敗，請重試");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="max-w-4xl mx-auto py-8 pr-4">
      {/* Header */}
      <div className="md:ml-6 lg:ml-18">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100 mb-1">
          {t("createEvent.title")}
        </h1>
        <p className="text-sm text-gray-600 dark:text-zinc-400">
          {t("createEvent.description")}
        </p>
        <p className="text-sm text-gray-600 dark:text-zinc-400">
          {t("createEvent.requiredNote")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Wrapper for sections with connecting line */}
        <div className="relative">
          {/* Connecting line from step 1 bottom to Configuration section bottom */}
          <div 
            className="absolute left-[0.8rem] lg:left-[2.3rem] w-0.5 bg-gray-300 dark:bg-zinc-600"
            style={{ 
              top: '3rem', // Start from step 1 circle bottom (padding 1.5rem + circle height 2rem)
              bottom: '1.5rem', // End at Configuration section bottom (padding)
              zIndex: 1
            }}
          ></div>
          
          {/* Section 1: General */}
          <div className="rounded-lg py-6 lg:px-6 bg-white dark:bg-zinc-900 relative">
            <div className="flex items-start gap-6">
              {/* Step Number */}
              <div className="flex-shrink-0 flex flex-col items-center relative z-10">
                <div className="w-7 h-7 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                  1
                </div>
              </div>

            {/* Content */}
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-zinc-100 mb-1">
                  {t("createEvent.general.title")}
                </h2>
              </div>

              {/* Host and Event Name side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Host */}
                <div>
                  <label
                    htmlFor="host"
                    className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5"
                  >
                    {t("createEvent.general.host")} <span className="text-red-500">*</span>
                  </label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
                      >
                        <span>{user?.displayName || user?.primaryEmail || "You"}</span>
                        <ChevronDownIcon className="h-4 w-4 opacity-50" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
                      <DropdownMenuItem>
                        {user?.displayName || user?.primaryEmail || "You"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
                    {t("createEvent.general.hostDescription")}
                  </p>
                </div>

                {/* Event Name */}
                <div>
                  <label
                    htmlFor="title"
                    className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5"
                  >
                    {t("createEvent.general.eventName")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t("createEvent.general.eventNamePlaceholder")}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5"
                >
                  {t("createEvent.general.description")}
                </label>
                <textarea
                  id="description"
                  rows={4}
                  maxLength={350}
                  value={formData.description}
                  onChange={(e) => {
                    if (e.target.value.length <= 350) {
                      setFormData({ ...formData, description: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder={t("createEvent.general.descriptionPlaceholder")}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
                  {formData.description.length} / 350 {t("createEvent.general.characters")}
                </p>
              </div>
            </div>
          </div>
        </div>

          {/* Section 2: Configuration */}
          <div className="rounded-lg lg:p-6 bg-white dark:bg-zinc-900 relative">
          <div className="flex items-start gap-6">
            {/* Step Number */}
            <div className="flex-shrink-0 flex flex-col items-center relative z-10">
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
                    {t("createEvent.configuration.startDate")} <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    selected={formData.startDate}
                    onChange={(date: Date | null) => {
                      setFormData({ ...formData, startDate: date });
                      // Auto-fill end date if it's the first time setting start date and end date hasn't been manually set
                      if (date && !endDateManuallySet && !formData.endDate) {
                        setFormData((prev) => ({ ...prev, startDate: date, endDate: date }));
                      }
                    }}
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
                    {t("createEvent.configuration.endDate")} <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    selected={formData.endDate}
                    onChange={(date: Date | null) => {
                      setFormData({ ...formData, endDate: date });
                      setEndDateManuallySet(true);
                    }}
                    dateFormat="yyyy-MM-dd"
                    minDate={formData.startDate || new Date()}
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
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
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
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
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
                  value={formData.slotDurationMin}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      slotDurationMin: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={15}>15 {t("createEvent.configuration.minutes")}</option>
                  <option value={30}>30 {t("createEvent.configuration.minutes")}</option>
                  <option value={60}>60 {t("createEvent.configuration.minutes")}</option>
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
                  {t("createEvent.configuration.slotDurationDescription")}
                </p>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-1.5 text-sm border border-gray-300 dark:border-zinc-700 rounded-md font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
          >
            {t("createEvent.cancel")}
          </button>
          <button
            type="submit"
            disabled={loading || !formData.title || !formData.startDate || !formData.endDate}
            className="px-4 py-1.5 text-sm border border-transparent rounded-md font-medium text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? t("createEvent.creating") : t("createEvent.create")}
          </button>
        </div>
      </form>
    </div>
  );
}

