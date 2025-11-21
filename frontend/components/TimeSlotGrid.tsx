"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface TimeSlot {
  id: string;
  date: string;
  startMinute: number;
  endMinute: number;
  index: number;
}

interface TimeSlotGridProps {
  slots: TimeSlot[];
  onSave: (selectedSlotIds: string[]) => Promise<void>;
  initialSelectedIds?: string[];
}

export default function TimeSlotGrid({
  slots,
  onSave,
  initialSelectedIds = [],
}: TimeSlotGridProps) {
  const t = useTranslations("event");
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(
    new Set(initialSelectedIds),
  );
  const [saving, setSaving] = useState(false);

  // 將 slots 按日期分組
  const slotsByDate = slots.reduce(
    (acc, slot) => {
      const dateKey = new Date(slot.date).toLocaleDateString();
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(slot);
      return acc;
    },
    {} as Record<string, TimeSlot[]>,
  );

  const dates = Object.keys(slotsByDate);

  // 取得所有時間段（假設每天時間段相同）
  const timeSlots = dates.length > 0 ? slotsByDate[dates[0]] : [];

  const toggleSlot = (slotId: string) => {
    const newSelected = new Set(selectedSlots);
    if (newSelected.has(slotId)) {
      newSelected.delete(slotId);
    } else {
      newSelected.add(slotId);
    }
    setSelectedSlots(newSelected);
  };

  const handleSave = () => {
    setSaving(true);
    void (async () => {
      try {
        await onSave(Array.from(selectedSlots));
        alert(t("saveSuccess"));
      } catch (error) {
        console.error("Save error:", error);
        alert(t("saveError"));
      } finally {
        setSaving(false);
      }
    })();
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          {t("selectAvailableSlots")}
        </h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? t("saving") : t("save")}
        </button>
      </div>

      <div className="text-sm text-gray-600 mb-4">
        {t("clickToSelect")}
        {/* TODO: 未來可加入拖曳多選功能 */}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="border border-gray-300 bg-gray-50 px-4 py-2 text-left text-sm font-medium text-gray-700">
                {t("time")}
              </th>
              {dates.map((date) => (
                <th
                  key={date}
                  className="border border-gray-300 bg-gray-50 px-4 py-2 text-center text-sm font-medium text-gray-700"
                >
                  {date}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((timeSlot, timeIndex) => (
              <tr key={timeIndex}>
                <td className="border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                  {formatTime(timeSlot.startMinute)} -{" "}
                  {formatTime(timeSlot.endMinute)}
                </td>
                {dates.map((date) => {
                  const slot = slotsByDate[date][timeIndex];
                  const isSelected = selectedSlots.has(slot.id);
                  return (
                    <td
                      key={slot.id}
                      onClick={() => toggleSlot(slot.id)}
                      className={`border border-gray-300 px-4 py-2 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-white hover:bg-gray-100"
                      }`}
                    >
                      <div className="h-6"></div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-gray-600">
        {t("selectedCount", { count: selectedSlots.size })}
      </div>
    </div>
  );
}
