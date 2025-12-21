"use client";

import { useTranslations } from "next-intl";
import { useRef, useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { TITLE_MAX_LENGTH, DESCRIPTION_MAX_LENGTH } from "./types";

interface GeneralSectionProps {
  title: string;
  description: string;
  titleCharCount: number;
  descriptionCharCount: number;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

export function GeneralSection({
  title,
  description,
  titleCharCount,
  descriptionCharCount,
  onTitleChange,
  onDescriptionChange,
}: GeneralSectionProps) {
  const t = useTranslations();
  const { user } = useAuthContext();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = "auto";
      // Set height to scrollHeight, with min height of 80px
      textarea.style.height = `${Math.max(80, textarea.scrollHeight)}px`;
    }
  }, [description]);

  const isOverTitleLimit = titleCharCount >= TITLE_MAX_LENGTH;
  const isOverDescriptionLimit = descriptionCharCount >= DESCRIPTION_MAX_LENGTH;

  return (
    <div className="rounded-lg py-6 lg:px-6 bg-white dark:bg-zinc-900 relative">
      <div className="flex items-start gap-6">
        {/* Step Number */}
        <div className="shrink-0 flex flex-col items-center relative z-10">
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
          <div className="flex flex-col md:flex-row gap-4">
            {/* Host - Fixed width */}
            <div className="w-full md:w-48 shrink-0">
              <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                {t("createEvent.general.host")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 dark:border-zinc-700 rounded-md bg-gray-50 dark:bg-zinc-800/50">
                {/* Avatar */}
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName || "User"}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                    {(user?.displayName || user?.primaryEmail || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
                <span className="text-gray-900 dark:text-zinc-100 truncate">
                  {user?.displayName || user?.primaryEmail || "You"}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
                {t("createEvent.general.hostDescription")}
              </p>
            </div>

            {/* Event Name - Takes remaining space */}
            <div className="flex-1">
              <label
                htmlFor="title"
                className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5"
              >
                {t("createEvent.general.eventName")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                required
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                className={`w-full px-3 py-1.5 text-sm border rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isOverTitleLimit
                    ? "border-red-400 dark:border-red-500"
                    : "border-gray-300 dark:border-zinc-700"
                }`}
                placeholder={t("createEvent.general.eventNamePlaceholder")}
              />
              <p
                className={`mt-1 text-xs ${
                  isOverTitleLimit
                    ? "text-red-500 dark:text-red-400"
                    : "text-gray-500 dark:text-zinc-400"
                }`}
              >
                {titleCharCount} / {TITLE_MAX_LENGTH}{" "}
                {t("createEvent.general.characters")}
                {isOverTitleLimit && (
                  <span className="ml-1">
                    {t("createEvent.general.charLimitReached")}
                  </span>
                )}
              </p>
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
              ref={textareaRef}
              id="description"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className={`w-full px-3 py-1.5 text-sm border rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none overflow-hidden ${
                isOverDescriptionLimit
                  ? "border-red-400 dark:border-red-500"
                  : "border-gray-300 dark:border-zinc-700"
              }`}
              placeholder={t("createEvent.general.descriptionPlaceholder")}
              style={{ minHeight: "80px" }}
            />
            <p
              className={`mt-1 text-xs ${
                isOverDescriptionLimit
                  ? "text-red-500 dark:text-red-400"
                  : "text-gray-500 dark:text-zinc-400"
              }`}
            >
              {descriptionCharCount} / {DESCRIPTION_MAX_LENGTH}{" "}
              {t("createEvent.general.characters")}
              {isOverDescriptionLimit && (
                <span className="ml-1">
                  {t("createEvent.general.charLimitReached")}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
