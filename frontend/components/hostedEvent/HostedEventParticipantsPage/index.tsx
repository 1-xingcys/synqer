"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthContext } from "@/contexts/AuthContext";
import { useHostedEventDetail } from "@/hooks/useHostedEventDetail";
import {
  useLineGroups,
  useLineGroupMembers,
  type LineGroupMember,
} from "@/hooks/useLineGroups";
import { useUserSearch, type SearchedUser } from "@/hooks/useUserSearch";
import Image from "next/image";

interface SelectedParticipant {
  id?: string;
  lineUserId?: string;
  userId?: string;
  displayName: string;
  pictureUrl?: string | null;
}

export default function HostedEventParticipantsPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const t = useTranslations();
  const { user } = useAuthContext();
  const {
    data: eventData,
    loading: eventLoading,
    refetch,
  } = useHostedEventDetail(eventId);
  const { groups, loading: groupsLoading } = useLineGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const { members, loading: membersLoading } =
    useLineGroupMembers(selectedGroupId);
  const {
    results: searchResults,
    loading: searchLoading,
    search,
    clearResults,
  } = useUserSearch();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<
    SelectedParticipant[]
  >([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Check if user is LINE-linked
  const isLineLinked = user?.providers?.includes("line") ?? false;

  // Default tab: LINE Groups for LINE users, Search for others
  const [activeTab, setActiveTab] = useState<"search" | "line">(
    isLineLinked ? "line" : "search",
  );

  // Update default tab when user data loads
  useEffect(() => {
    if (user) {
      setActiveTab(isLineLinked ? "line" : "search");
    }
  }, [user, isLineLinked]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        void search(searchQuery);
      } else {
        clearResults();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, search, clearResults]);

  // Initialize selected participants from event data
  useEffect(() => {
    if (eventData?.expectedParticipants) {
      setSelectedParticipants(
        eventData.expectedParticipants.map((p) => ({
          id: p.id,
          lineUserId: p.lineUserId,
          userId: p.userId,
          displayName: p.displayName || "Unknown",
          pictureUrl: p.pictureUrl,
        })),
      );
    }
  }, [eventData]);

  const handleSelectGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
  };

  const handleAddUser = useCallback(
    (user: SearchedUser) => {
      // Check if already added
      const exists = selectedParticipants.some((p) => p.userId === user.id);
      if (exists) return;

      setSelectedParticipants((prev) => [
        ...prev,
        {
          userId: user.id,
          displayName: user.displayName || user.primaryEmail || "Unknown",
          pictureUrl: user.avatarUrl,
        },
      ]);
    },
    [selectedParticipants],
  );

  const handleAddMember = useCallback(
    (member: LineGroupMember) => {
      // Check if already added
      const exists = selectedParticipants.some(
        (p) =>
          p.lineUserId === member.lineUserId ||
          (member.linkedUser && p.userId === member.linkedUser.id),
      );
      if (exists) return;

      setSelectedParticipants((prev) => [
        ...prev,
        {
          lineUserId: member.lineUserId,
          userId: member.linkedUser?.id,
          displayName:
            member.linkedUser?.displayName || member.displayName || "Unknown",
          pictureUrl: member.linkedUser?.avatarUrl || member.pictureUrl,
        },
      ]);
    },
    [selectedParticipants],
  );

  const handleRemoveParticipant = (index: number) => {
    setSelectedParticipants(selectedParticipants.filter((_, i) => i !== index));
  };

  const handleAddAllFromGroup = () => {
    const newParticipants: SelectedParticipant[] = [];
    members.forEach((member) => {
      const exists = selectedParticipants.some(
        (p) =>
          p.lineUserId === member.lineUserId ||
          (member.linkedUser && p.userId === member.linkedUser.id),
      );
      if (!exists) {
        newParticipants.push({
          lineUserId: member.lineUserId,
          userId: member.linkedUser?.id,
          displayName:
            member.linkedUser?.displayName || member.displayName || "Unknown",
          pictureUrl: member.linkedUser?.avatarUrl || member.pictureUrl,
        });
      }
    });
    setSelectedParticipants([...selectedParticipants, ...newParticipants]);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API}/events/${eventId}/participants`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            participants: selectedParticipants.map((p) => ({
              lineUserId: p.lineUserId,
              userId: p.userId,
            })),
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to save participants");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      void refetch();
    } catch (error) {
      console.error("Failed to save participants:", error);
    } finally {
      setSaving(false);
    }
  };

  if (eventLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-zinc-600 dark:text-zinc-400">
          {t("common.loading")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {t("hosted.participantsPage.title")}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {t("hosted.participantsPage.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Add Participants */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {/* Tab Navigation - Only show tabs if LINE linked */}
          {isLineLinked ? (
            <div className="border-b border-zinc-200 dark:border-zinc-800">
              <nav className="flex">
                {/* LINE Groups tab (left) for LINE users */}
                <button
                  onClick={() => setActiveTab("line")}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === "line"
                      ? "border-b-2 border-green-500 text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-900/10"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.349 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                    </svg>
                    {t("hosted.participantsPage.lineGroups")}
                  </div>
                </button>
                {/* Search Users tab (right) for LINE users */}
                <button
                  onClick={() => setActiveTab("search")}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === "search"
                      ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
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
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    {t("hosted.participantsPage.searchUsers")}
                  </div>
                </button>
              </nav>
            </div>
          ) : (
            /* Header for non-LINE users (no tabs, just title) */
            <div className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {t("hosted.participantsPage.searchUsers")}
              </div>
            </div>
          )}

          <div className="p-6">
            {/* Search Users Tab - Show for non-LINE users OR when search tab is active */}
            {(!isLineLinked || activeTab === "search") && (
              <div className="space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("hosted.participantsPage.searchPlaceholder")}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Search Results */}
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {searchLoading ? (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">
                      {t("common.loading")}
                    </p>
                  ) : searchQuery.length < 2 ? (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">
                      {t("hosted.participantsPage.searchHint")}
                    </p>
                  ) : searchResults.length === 0 ? (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">
                      {t("hosted.participantsPage.noResults")}
                    </p>
                  ) : (
                    searchResults.map((user) => {
                      const isSelected = selectedParticipants.some(
                        (p) => p.userId === user.id,
                      );
                      return (
                        <button
                          key={user.id}
                          onClick={() => handleAddUser(user)}
                          disabled={isSelected}
                          className={`
                            w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left
                            ${
                              isSelected
                                ? "bg-green-50 dark:bg-green-900/20 opacity-50 cursor-not-allowed"
                                : "hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                            }
                          `}
                        >
                          {user.avatarUrl ? (
                            <Image
                              src={user.avatarUrl}
                              alt={user.displayName || ""}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                              {user.displayName?.[0]?.toUpperCase() ||
                                user.primaryEmail?.[0]?.toUpperCase() ||
                                "?"}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                              {user.displayName || "No name"}
                            </p>
                            {user.primaryEmail && (
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                {user.primaryEmail}
                              </p>
                            )}
                          </div>
                          {isSelected ? (
                            <svg
                              className="w-5 h-5 text-green-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-5 h-5 text-zinc-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* LINE Groups Tab - Only show for LINE users when line tab is active */}
            {isLineLinked && activeTab === "line" && (
              <div className="space-y-4">
                {/* Group Selection */}
                <div>
                  <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    {t("hosted.participantsPage.selectLineGroup")}
                  </h4>
                  {groupsLoading ? (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {t("common.loading")}
                    </p>
                  ) : groups.length === 0 ? (
                    <div className="text-center py-6">
                      <svg
                        className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-3"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.349 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                      </svg>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {t("hosted.participantsPage.noLineGroups")}
                      </p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                        {t("hosted.participantsPage.noLineGroupsHint")}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {groups.map((group) => (
                        <button
                          key={group.id}
                          onClick={() => handleSelectGroup(group.id)}
                          className={`
                            w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left
                            ${
                              selectedGroupId === group.id
                                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                            }
                          `}
                        >
                          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <svg
                              className="w-5 h-5 text-green-600 dark:text-green-400"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.349 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                              {group.groupName || group.lineGroupId}
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              {group.memberCount}{" "}
                              {t("hosted.participantsPage.members")}
                            </p>
                          </div>
                          {selectedGroupId === group.id && (
                            <svg
                              className="w-5 h-5 text-green-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Group Members */}
                {selectedGroupId && (
                  <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {t("hosted.participantsPage.groupMembers")}
                      </h4>
                      <button
                        onClick={handleAddAllFromGroup}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        {t("hosted.participantsPage.addAll")}
                      </button>
                    </div>

                    {membersLoading ? (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">
                        {t("common.loading")}
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {members.map((member) => {
                          const isSelected = selectedParticipants.some(
                            (p) =>
                              p.lineUserId === member.lineUserId ||
                              (member.linkedUser &&
                                p.userId === member.linkedUser.id),
                          );
                          return (
                            <button
                              key={member.id}
                              onClick={() => handleAddMember(member)}
                              disabled={isSelected}
                              className={`
                                w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left
                                ${
                                  isSelected
                                    ? "bg-green-50 dark:bg-green-900/20 opacity-50 cursor-not-allowed"
                                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                }
                              `}
                            >
                              {member.pictureUrl ? (
                                <Image
                                  src={member.pictureUrl}
                                  alt={member.displayName || ""}
                                  width={40}
                                  height={40}
                                  className="w-8 h-8 rounded-full"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 text-xs font-medium">
                                  {member.displayName?.[0]?.toUpperCase() ||
                                    "?"}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-zinc-700 dark:text-zinc-300 truncate">
                                  {member.linkedUser?.displayName ||
                                    member.displayName ||
                                    "Unknown"}
                                </p>
                                {!member.isLinked && (
                                  <p className="text-xs text-amber-600 dark:text-amber-400">
                                    {t("hosted.participantsPage.notRegistered")}
                                  </p>
                                )}
                              </div>
                              {isSelected && (
                                <svg
                                  className="w-4 h-4 text-green-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Selected Participants */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              {t("hosted.participantsPage.selectedParticipants")}
            </h3>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              ({selectedParticipants.length})
            </span>
          </div>

          {selectedParticipants.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {t("hosted.participantsPage.noParticipants")}
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                {t("hosted.participantsPage.addParticipantsHint")}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {selectedParticipants.map((participant, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800"
                >
                  {participant.pictureUrl ? (
                    <Image
                      src={participant.pictureUrl}
                      alt={participant.displayName || ""}
                      width={40}
                      height={40}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-medium">
                      {participant.displayName[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate block">
                      {participant.displayName}
                    </span>
                    {participant.lineUserId && !participant.userId && (
                      <span className="text-xs text-amber-600 dark:text-amber-400">
                        {t("hosted.participantsPage.notRegistered")}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveParticipant(index)}
                    className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Save Button */}
          <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {t("common.saving")}
                </>
              ) : saveSuccess ? (
                <>
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {t("event.saveSuccess")}
                </>
              ) : (
                t("hosted.participantsPage.saveParticipants")
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
