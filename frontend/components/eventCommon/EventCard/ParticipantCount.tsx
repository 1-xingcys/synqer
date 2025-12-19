"use client";

import { useTranslations } from "next-intl";

interface ParticipantCountProps {
  count: number;
}

export default function ParticipantCount({ count }: ParticipantCountProps) {
  const t = useTranslations();

  return (
    <span className="flex items-center gap-1.5">
      <svg
        className="w-4 h-4"
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
      {t("dashboard.participants", { count })}
    </span>
  );
}
