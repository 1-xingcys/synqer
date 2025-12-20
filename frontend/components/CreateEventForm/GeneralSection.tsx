"use client";

import { useTranslations } from "next-intl";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDownIcon } from "lucide-react";

interface GeneralSectionProps {
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

export function GeneralSection({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
}: GeneralSectionProps) {
  const t = useTranslations();
  const { user } = useAuthContext();

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Host */}
            <div>
              <label
                htmlFor="host"
                className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5"
              >
                {t("createEvent.general.host")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
                  >
                    <span>
                      {user?.displayName || user?.primaryEmail || "You"}
                    </span>
                    <ChevronDownIcon className="h-4 w-4 opacity-50" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-[--radix-dropdown-menu-trigger-width]"
                >
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
                {t("createEvent.general.eventName")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                required
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
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
              value={description}
              onChange={(e) => {
                if (e.target.value.length <= 350) {
                  onDescriptionChange(e.target.value);
                }
              }}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder={t("createEvent.general.descriptionPlaceholder")}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
              {description.length} / 350 {t("createEvent.general.characters")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
