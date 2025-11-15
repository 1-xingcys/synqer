"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    startTime: "09:00",
    endTime: "18:00",
    slotDurationMin: 15,
    timeZone: "Asia/Taipei",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    void (async () => {
      try {
        const response = await fetch("http://localhost:4000/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // 帶上 cookie
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error("Failed to create event");
        }

        const result = (await response.json()) as { eventId: string };
        // 成功後跳轉到活動頁面
        router.push(`/events/${result.eventId}`);
      } catch (error) {
        console.error("建立活動失敗:", error);
        alert("建立活動失敗，請重試");
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">建立新活動</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 活動標題 */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                活動標題
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
                placeholder="例如：團隊聚餐時間投票"
              />
            </div>

            {/* 活動描述 */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                活動描述
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
                placeholder="選填"
              />
            </div>

            {/* 日期範圍 */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-gray-700"
                >
                  開始日期
                </label>
                <input
                  type="date"
                  id="startDate"
                  required
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
                />
              </div>

              <div>
                <label
                  htmlFor="endDate"
                  className="block text-sm font-medium text-gray-700"
                >
                  結束日期
                </label>
                <input
                  type="date"
                  id="endDate"
                  required
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
                />
              </div>
            </div>

            {/* 時間範圍 */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="startTime"
                  className="block text-sm font-medium text-gray-700"
                >
                  每日開始時間
                </label>
                <input
                  type="time"
                  id="startTime"
                  required
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
                />
              </div>

              <div>
                <label
                  htmlFor="endTime"
                  className="block text-sm font-medium text-gray-700"
                >
                  每日結束時間
                </label>
                <input
                  type="time"
                  id="endTime"
                  required
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
                />
              </div>
            </div>

            {/* 時間間隔 */}
            <div>
              <label
                htmlFor="slotDurationMin"
                className="block text-sm font-medium text-gray-700"
              >
                時間間隔（分鐘）
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border"
              >
                <option value={15}>15 分鐘</option>
                <option value={30}>30 分鐘</option>
                <option value={60}>60 分鐘</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                目前版本固定為 15 分鐘，未來可調整
              </p>
            </div>

            {/* 提交按鈕 */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "建立中..." : "建立活動"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
