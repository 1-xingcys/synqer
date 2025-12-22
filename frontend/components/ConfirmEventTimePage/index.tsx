"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/routing";
import { useHostedEventDetail } from "@/hooks/useHostedEventDetail";
import { useMemo, useState, useCallback, useEffect } from "react";

interface TimeSlot {
  id: string;
  date: string;
  startMinute: number;
  endMinute: number;
  index: number;
}

interface Vote {
  slotId: string;
  userId: string;
  userDisplayName: string;
}

export default function ConfirmEventTimePage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const t = useTranslations();
  const router = useRouter();

  const { data, loading, error, refetch } = useHostedEventDetail(eventId);

  // 選中的時段
  const [selectedSlotIds, setSelectedSlotIds] = useState<Set<string>>(
    new Set(),
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // 初始化選中的時段（從已確認的時段）
  useEffect(() => {
    if (data?.event.confirmedSlotIds) {
      setSelectedSlotIds(new Set(data.event.confirmedSlotIds));
    }
  }, [data?.event.confirmedSlotIds]);

  // 計算投票統計
  const { votesBySlot, maxVotes, slotsByDate, dates, timeSlots } =
    useMemo(() => {
      if (!data) {
        return {
          votesBySlot: {} as Record<string, Vote[]>,
          maxVotes: 0,
          slotsByDate: {} as Record<string, TimeSlot[]>,
          dates: [] as string[],
          timeSlots: [] as TimeSlot[],
        };
      }

      const votesBySlot = data.votes.reduce(
        (acc, vote) => {
          if (!acc[vote.slotId]) acc[vote.slotId] = [];
          acc[vote.slotId].push(vote);
          return acc;
        },
        {} as Record<string, Vote[]>,
      );

      const maxVotes = Math.max(
        ...Object.values(votesBySlot).map((votes) => votes.length),
        1,
      );

      const slotsByDate = data.slots.reduce(
        (acc, slot) => {
          const dateKey = slot.date.split("T")[0];
          if (!acc[dateKey]) acc[dateKey] = [];
          acc[dateKey].push(slot);
          return acc;
        },
        {} as Record<string, TimeSlot[]>,
      );

      const dates = Object.keys(slotsByDate).sort();
      const timeSlots = dates.length > 0 ? slotsByDate[dates[0]] : [];

      return { votesBySlot, maxVotes, slotsByDate, dates, timeSlots };
    }, [data]);

  // 格式化時間
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekday = date.toLocaleDateString(undefined, { weekday: "short" });
    const day = date.getDate();
    const month = date.toLocaleDateString(undefined, { month: "short" });
    return { weekday, day, month };
  };

  // 熱力圖顏色
  const getHeatmapColor = (voteCount: number, isSelected: boolean) => {
    if (isSelected) {
      return "bg-blue-500 dark:bg-blue-600";
    }
    if (voteCount === 0) return "bg-gray-50 dark:bg-zinc-800/50";
    const intensity = Math.ceil((voteCount / maxVotes) * 5);
    const colorMap: Record<number, string> = {
      1: "bg-emerald-100 dark:bg-emerald-900/20",
      2: "bg-emerald-200 dark:bg-emerald-900/40",
      3: "bg-emerald-300 dark:bg-emerald-800/60",
      4: "bg-emerald-400 dark:bg-emerald-700/80",
      5: "bg-emerald-500 dark:bg-emerald-600",
    };
    return colorMap[intensity] || "bg-gray-50 dark:bg-zinc-800/50";
  };

  const getTextColor = (voteCount: number, isSelected: boolean) => {
    if (isSelected) return "text-white";
    const intensity = Math.ceil((voteCount / maxVotes) * 5);
    return intensity >= 4 ? "text-white" : "text-gray-700 dark:text-zinc-200";
  };

  // 切換時段選擇
  const toggleSlot = useCallback((slotId: string) => {
    setSelectedSlotIds((prev) => {
      const next = new Set(prev);
      if (next.has(slotId)) {
        next.delete(slotId);
      } else {
        next.add(slotId);
      }
      return next;
    });
  }, []);

  // 儲存確認的時段
  const handleSave = async () => {
    if (selectedSlotIds.size === 0) {
      setSaveError(t("confirmTime.selectAtLeastOne"));
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API}/events/${eventId}/confirm-time`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            slotIds: Array.from(selectedSlotIds),
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to confirm time");
      }

      // 重新載入資料並返回
      await refetch();
      router.push(`/hosted/${eventId}`);
    } catch {
      setSaveError(t("confirmTime.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-lg text-zinc-600 dark:text-zinc-300">
            {t("common.loading")}
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-lg text-red-600 dark:text-red-400">
            {error || t("event.notFound")}
          </p>
          <button
            onClick={() => router.push("/hosted")}
            className="mt-4 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {t("hosted.backToHosted")}
          </button>
        </div>
      </div>
    );
  }

  const hasExistingConfirmation = data.event.confirmedSlotIds.length > 0;

  return (
    <div className="py-8 space-y-6">
      {/* 返回按鈕 */}
      <div className="mb-4">
        <Link
          href={`/hosted/${eventId}`}
          className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span>{t("hosted.backToHosted")}</span>
        </Link>
      </div>

      {/* 標題 */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          {hasExistingConfirmation
            ? t("confirmTime.editTitle")
            : t("confirmTime.title")}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {data.event.title || t("event.untitled")}
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
          {t("confirmTime.description")}
        </p>
      </div>

      {/* 選擇統計 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-blue-700 dark:text-blue-300 font-medium">
              {t("confirmTime.selectedSlots", { count: selectedSlotIds.size })}
            </span>
          </div>
          {selectedSlotIds.size > 0 && (
            <button
              onClick={() => setSelectedSlotIds(new Set())}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {t("confirmTime.clearSelection")}
            </button>
          )}
        </div>
      </div>

      {/* 時段選擇網格 */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
            {t("confirmTime.selectTimeSlots")}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {t("confirmTime.clickToSelect")}
          </p>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto select-none">
            <div className="min-w-fit">
              {/* 日期標題 */}
              <div className="flex">
                <div className="w-20 shrink-0" />
                {dates.map((dateKey) => {
                  const { weekday, day, month } = formatDateHeader(dateKey);
                  return (
                    <div
                      key={dateKey}
                      className="flex-1 min-w-[60px] p-2 text-center mx-0.5"
                    >
                      <div className="text-xs text-gray-500 dark:text-zinc-400 font-medium">
                        {weekday}
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-zinc-100">
                        {day}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-zinc-500">
                        {month}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 時段網格 */}
              <div className="border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                {timeSlots.map((timeSlot, timeIndex) => (
                  <div key={timeIndex} className="flex">
                    <div className="w-20 shrink-0 px-2 py-3 text-xs font-medium text-gray-500 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-800/50 border-r border-gray-200 dark:border-zinc-700 flex items-center">
                      {formatTime(timeSlot.startMinute)}
                    </div>
                    {dates.map((dateKey) => {
                      const slot = slotsByDate[dateKey][timeIndex];
                      const voteCount = votesBySlot[slot.id]?.length || 0;
                      const isSelected = selectedSlotIds.has(slot.id);

                      return (
                        <div
                          key={slot.id}
                          onClick={() => toggleSlot(slot.id)}
                          className={`
                            flex-1 min-w-[60px] min-h-[44px] relative
                            border-r border-b border-gray-100 dark:border-zinc-800
                            cursor-pointer transition-all duration-150
                            ${getHeatmapColor(voteCount, isSelected)}
                            ${getTextColor(voteCount, isSelected)}
                            ${isSelected ? "ring-2 ring-blue-400 dark:ring-blue-500 z-10" : "hover:ring-2 hover:ring-gray-300 dark:hover:ring-zinc-600"}
                          `}
                        >
                          <div className="h-full flex items-center justify-center font-medium text-sm">
                            {isSelected ? (
                              <svg
                                className="w-5 h-5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : voteCount > 0 ? (
                              voteCount
                            ) : (
                              ""
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 圖例 */}
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-500 dark:text-zinc-400">
            <span>{t("joined.legend")}:</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700" />
              <span>0</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-emerald-200 dark:bg-emerald-900/40" />
              <span>{t("joined.few")}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-emerald-500 dark:bg-emerald-600" />
              <span>{t("joined.many")}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-blue-500 dark:bg-blue-600" />
              <span>{t("confirmTime.selected")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 錯誤訊息 */}
      {saveError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-red-600 dark:text-red-400 text-sm">{saveError}</p>
        </div>
      )}

      {/* 操作按鈕 */}
      <div className="flex items-center justify-end gap-4">
        <Link
          href={`/hosted/${eventId}`}
          className="px-6 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          {t("common.cancel")}
        </Link>
        <button
          onClick={() => void handleSave()}
          disabled={saving || selectedSlotIds.size === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          {saving ? t("common.saving") : t("confirmTime.confirm")}
        </button>
      </div>
    </div>
  );
}
