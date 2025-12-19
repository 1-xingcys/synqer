"use client";

import { ReactNode } from "react";
import { useParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

interface HostedEventLayoutProps {
  children: ReactNode;
}

export default function HostedEventLayout({
  children,
}: HostedEventLayoutProps) {
  const params = useParams();
  const pathname = usePathname();
  const t = useTranslations("hosted");
  const eventId = params.eventId as string;

  // Determine active tab based on pathname
  const getActiveTab = () => {
    if (pathname?.endsWith("/participants")) return "participants";
    if (pathname?.endsWith("/settings")) return "settings";
    return "overview";
  };

  const activeTab = getActiveTab();

  const tabs = [
    {
      id: "overview",
      label: t("overview"),
      href: `/hosted/${eventId}`,
      icon: (
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
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      id: "participants",
      label: t("participants"),
      href: `/hosted/${eventId}/participants`,
      icon: (
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
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
    {
      id: "settings",
      label: t("settings"),
      href: `/hosted/${eventId}/settings`,
      icon: (
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
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="py-8 space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/hosted"
          className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          {t("backToHosted")}
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <nav className="flex gap-1 -mb-px">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={`
                inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-600"
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
}
