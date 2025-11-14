"use client";

import { useState } from "react";

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

interface Participant {
  userId: string;
  displayName: string;
}

interface HeatmapGridProps {
  slots: TimeSlot[];
  votes: Vote[];
  participants: Participant[];
}

export default function HeatmapGrid({
  slots,
  votes,
  participants,
}: HeatmapGridProps) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // 將 votes 按 slotId 分組，計算每個 slot 的票數
  const votesBySlot = votes.reduce(
    (acc, vote) => {
      if (!acc[vote.slotId]) acc[vote.slotId] = [];
      acc[vote.slotId].push(vote);
      return acc;
    },
    {} as Record<string, Vote[]>,
  );

  // 找出最大票數（用於顏色深淺計算）
  const maxVotes = Math.max(
    ...Object.values(votesBySlot).map((votes) => votes.length),
    1,
  );

  // 將 slots 按日期分組
  const slotsByDate = slots.reduce(
    (acc, slot) => {
      const dateKey = new Date(slot.date).toLocaleDateString("zh-TW");
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(slot);
      return acc;
    },
    {} as Record<string, TimeSlot[]>,
  );

  const dates = Object.keys(slotsByDate);
  const timeSlots = dates.length > 0 ? slotsByDate[dates[0]] : [];

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  // 根據票數計算顏色深淺（0-10 級）
  const getHeatmapColor = (voteCount: number) => {
    if (voteCount === 0) return "bg-gray-100";
    const intensity = Math.min(Math.ceil((voteCount / maxVotes) * 10), 10);
    const colorMap: Record<number, string> = {
      1: "bg-green-100",
      2: "bg-green-200",
      3: "bg-green-300",
      4: "bg-green-400",
      5: "bg-green-500",
      6: "bg-green-600",
      7: "bg-green-700",
      8: "bg-green-800",
      9: "bg-green-900",
      10: "bg-green-950",
    };
    return colorMap[intensity] || "bg-gray-100";
  };

  const getTextColor = (voteCount: number) => {
    const intensity = Math.min(Math.ceil((voteCount / maxVotes) * 10), 10);
    return intensity >= 5 ? "text-white" : "text-gray-900";
  };

  const handleSlotClick = (slotId: string) => {
    setSelectedSlot(slotId === selectedSlot ? null : slotId);
  };

  // 取得有空和沒空的人
  const getSlotDetails = (slotId: string) => {
    const availableUsers = votesBySlot[slotId] || [];
    const availableUserIds = new Set(availableUsers.map((v) => v.userId));
    const unavailableUsers = participants.filter(
      (p) => !availableUserIds.has(p.userId),
    );
    return { availableUsers, unavailableUsers };
  };

  const selectedSlotDetails = selectedSlot
    ? getSlotDetails(selectedSlot)
    : null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">時段熱力圖</h2>
        <p className="text-sm text-gray-600">
          顏色越深表示越多人有空（點擊格子查看詳情）
        </p>
        {/* TODO: 未來可加入 Websocket/SSE 即時同步 */}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="border border-gray-300 bg-gray-50 px-4 py-2 text-left text-sm font-medium text-gray-700">
                時間
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
                  const voteCount = votesBySlot[slot.id]?.length || 0;
                  const isSelected = selectedSlot === slot.id;
                  return (
                    <td
                      key={slot.id}
                      onClick={() => handleSlotClick(slot.id)}
                      className={`border border-gray-300 px-4 py-2 cursor-pointer transition-all ${getHeatmapColor(
                        voteCount,
                      )} ${getTextColor(voteCount)} ${
                        isSelected ? "ring-4 ring-blue-500" : ""
                      }`}
                    >
                      <div className="h-6 flex items-center justify-center font-medium">
                        {voteCount > 0 ? voteCount : ""}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 顯示所選時段的詳細資訊 */}
      {selectedSlotDetails && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">時段詳情</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-green-700 mb-2">
                有空（{selectedSlotDetails.availableUsers.length} 人）
              </h4>
              <ul className="space-y-1">
                {selectedSlotDetails.availableUsers.map((vote) => (
                  <li key={vote.userId} className="text-sm text-gray-700">
                    ✓ {vote.userDisplayName}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-red-700 mb-2">
                沒空（{selectedSlotDetails.unavailableUsers.length} 人）
              </h4>
              <ul className="space-y-1">
                {selectedSlotDetails.unavailableUsers.map((user) => (
                  <li key={user.userId} className="text-sm text-gray-700">
                    ✗ {user.displayName}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
