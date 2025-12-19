"use client";

import { useTranslations } from "next-intl";

interface ActionButtonProps {
  variant: "hosted" | "joined";
}

export default function ActionButton({ variant }: ActionButtonProps) {
  const t = useTranslations();

  const isHosted = variant === "hosted";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
        isHosted
          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
          : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
      }`}
    >
      {isHosted ? t("hosted.manageEvent") : t("joined.viewEvent")}
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </span>
  );
}
