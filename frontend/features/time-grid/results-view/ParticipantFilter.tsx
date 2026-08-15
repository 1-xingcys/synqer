"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Participant } from "../types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Z_INDEX } from "@/lib/ui/zIndex";

interface ParticipantFilterProps {
  participants: Participant[];
  selectedParticipants: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
}

export function ParticipantFilter({
  participants,
  selectedParticipants,
  onSelectionChange,
}: ParticipantFilterProps) {
  const t = useTranslations("joined");
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allSelected = selectedParticipants.size === participants.length;
  const noneSelected = selectedParticipants.size === 0;
  const someSelected = !allSelected && !noneSelected;

  // Filter participants by search query
  const filteredParticipants = useMemo(() => {
    if (!searchQuery.trim()) return participants;
    const query = searchQuery.toLowerCase();
    return participants.filter((p) =>
      p.displayName.toLowerCase().includes(query),
    );
  }, [participants, searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const toggleParticipant = (userId: string) => {
    const newSelection = new Set(selectedParticipants);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    onSelectionChange(newSelection);
  };

  const selectAll = () => {
    onSelectionChange(new Set(participants.map((p) => p.userId)));
  };

  const clearAll = () => {
    onSelectionChange(new Set());
  };

  // Get display text for the button
  const getButtonText = () => {
    if (allSelected) return t("results.allParticipants");
    if (noneSelected) return t("results.noParticipants");
    if (selectedParticipants.size === 1) {
      const selected = participants.find((p) =>
        selectedParticipants.has(p.userId),
      );
      return selected?.displayName ?? t("results.oneParticipant");
    }
    return t("results.participantsSelected", {
      count: selectedParticipants.size,
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg
          border transition-all
          ${
            isOpen
              ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
              : someSelected
                ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300"
                : "bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700"
          }
        `}
      >
        {/* Filter Icon */}
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
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        <span className="max-w-[120px] sm:max-w-[180px] truncate">
          {getButtonText()}
        </span>
        {/* Indicator dot for partial selection */}
        {someSelected && (
          <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
        )}
        {/* Chevron */}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={`absolute top-full right-0 mt-2 ${Z_INDEX.DROPDOWN_OVER_GRID} w-72 sm:w-80 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-gray-200 dark:border-zinc-700 overflow-hidden`}
        >
          {/* Search */}
          <div className="p-3 border-b border-gray-100 dark:border-zinc-700">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
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
                placeholder={t("results.searchParticipants")}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-zinc-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/50">
            <button
              onClick={selectAll}
              disabled={allSelected}
              className="px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("results.selectAll")}
            </button>
            <span className="text-gray-300 dark:text-zinc-600">|</span>
            <button
              onClick={clearAll}
              disabled={noneSelected}
              className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("results.clearAll")}
            </button>
            <span className="ml-auto text-xs text-gray-500 dark:text-zinc-500">
              {selectedParticipants.size}/{participants.length}
            </span>
          </div>

          {/* Participant List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredParticipants.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-gray-500 dark:text-zinc-400">
                {t("results.noParticipantsFound")}
              </div>
            ) : (
              <div className="py-1">
                {filteredParticipants.map((participant) => {
                  const isSelected = selectedParticipants.has(
                    participant.userId,
                  );
                  return (
                    <button
                      key={participant.userId}
                      onClick={() => toggleParticipant(participant.userId)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2 text-left transition-colors
                        ${
                          isSelected
                            ? "bg-emerald-50 dark:bg-emerald-900/20"
                            : "hover:bg-gray-50 dark:hover:bg-zinc-700/50"
                        }
                      `}
                    >
                      {/* Checkbox */}
                      <div
                        className={`
                          w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors
                          ${
                            isSelected
                              ? "bg-emerald-500 dark:bg-emerald-600 border-emerald-500 dark:border-emerald-600"
                              : "border-gray-300 dark:border-zinc-600"
                          }
                        `}
                      >
                        {isSelected && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      {/* Avatar */}
                      <Avatar className="w-7 h-7 shrink-0">
                        <AvatarImage
                          src={participant.pictureUrl}
                          alt={participant.displayName}
                        />
                        <AvatarFallback className="bg-linear-to-br from-gray-200 to-gray-300 dark:from-zinc-600 dark:to-zinc-700 text-xs font-semibold text-gray-600 dark:text-zinc-300">
                          {participant.displayName[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {/* Name */}
                      <span
                        className={`text-sm truncate ${
                          isSelected
                            ? "text-emerald-700 dark:text-emerald-300 font-medium"
                            : "text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {participant.displayName}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
