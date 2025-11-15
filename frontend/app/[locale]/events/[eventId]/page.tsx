"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import TimeSlotGrid from "@/components/TimeSlotGrid";
import HeatmapGrid from "@/components/HeatmapGrid";

interface TimeSlot {
  id: string;
  eventId: string;
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

interface Event {
  id: string;
  title?: string;
  description?: string;
  startDate: string;
  endDate: string;
  startMinuteOfDay: number;
  endMinuteOfDay: number;
  slotDurationMin: number;
  timeZone: string;
}

interface EventData {
  event: Event;
  slots: TimeSlot[];
  votes: Vote[];
  participants: Participant[];
}

export default function EventPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const { user } = useAuthContext();
  const router = useRouter();

  const [data, setData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"vote" | "heatmap">("vote");

  const fetchEventData = useCallback(async () => {
    try {
      if (!process.env.NEXT_PUBLIC_API) {
        throw new Error("NEXT_PUBLIC_API is not set");
      }
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API}/events/${eventId}`,
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch event data");
      }

      const eventData = (await response.json()) as EventData;
      setData(eventData);
    } catch (err) {
      console.error("載入活動失敗:", err);
      setError("載入活動失敗");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void fetchEventData();
  }, [fetchEventData]);

  const handleSaveVotes = async (selectedSlotIds: string[]) => {
    if (!process.env.NEXT_PUBLIC_API) {
      throw new Error("NEXT_PUBLIC_API is not set");
    }
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API}/events/${eventId}/votes`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ availableSlotIds: selectedSlotIds }),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to save votes");
    }

    // 重新載入資料以更新 heatmap
    void fetchEventData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">載入中...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-red-600">{error || "找不到活動"}</div>
      </div>
    );
  }

  // 取得目前使用者已投票的 slotIds
  const currentUserVotes: string[] = user
    ? data.votes
        .filter((vote) => vote.userId === user.id.toString())
        .map((vote) => vote.slotId)
    : [];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* 返回按鈕 */}
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-4 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          回到主頁
        </button>

        {/* 標題區 */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {data.event.title || "未命名活動"}
          </h1>
          {data.event.description && (
            <p className="text-gray-600 mb-4">{data.event.description}</p>
          )}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div>
              📅 {new Date(data.event.startDate).toLocaleDateString("zh-TW")} ~{" "}
              {new Date(data.event.endDate).toLocaleDateString("zh-TW")}
            </div>
            <div>
              🕐 {Math.floor(data.event.startMinuteOfDay / 60)}:
              {(data.event.startMinuteOfDay % 60).toString().padStart(2, "0")} ~{" "}
              {Math.floor(data.event.endMinuteOfDay / 60)}:
              {(data.event.endMinuteOfDay % 60).toString().padStart(2, "0")}
            </div>
            <div>⏱ {data.event.slotDurationMin} 分鐘/格</div>
            <div>👥 {data.participants.length} 人參與</div>
          </div>

          {/* 分享連結 */}
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">分享連結：</span>
              <button
                onClick={() => {
                  void navigator.clipboard
                    .writeText(window.location.href)
                    .then(() => {
                      alert("已複製連結！");
                    });
                }}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                複製連結
              </button>
            </div>
            <div className="mt-1 text-sm text-gray-700 font-mono break-all">
              {window.location.href}
            </div>
          </div>
        </div>

        {/* Tab 切換 */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("vote")}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "vote"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                我的可用時段
              </button>
              <button
                onClick={() => setActiveTab("heatmap")}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "heatmap"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                熱力圖
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "vote" ? (
              <TimeSlotGrid
                slots={data.slots}
                onSave={handleSaveVotes}
                initialSelectedIds={currentUserVotes}
              />
            ) : (
              <HeatmapGrid
                slots={data.slots}
                votes={data.votes}
                participants={data.participants}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
