"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { BarChart3, Vote, Clock, CheckCircle, CircleCheck } from "lucide-react";
import { EventRowMode } from "./types";

interface EventsLayoutProps {
  children: ReactNode;
  mode: EventRowMode;
  translationNamespace?: string;
}

export default function EventsLayout({
  children,
  mode,
  translationNamespace = "joinedEvents",
}: EventsLayoutProps) {
  const pathname = usePathname();
  const t = useTranslations(translationNamespace);

  const basePath = mode === EventRowMode.JOINED ? "/joined" : "/hosted";

  // Determine active tab based on pathname
  const getActiveTab = () => {
    if (pathname?.endsWith("/voting")) return "voting";
    if (pathname?.endsWith("/voting-ended")) return "votingEnded";
    if (pathname?.endsWith("/confirmed")) return "confirmed";
    if (pathname?.endsWith("/completed")) return "completed";
    return "overview";
  };

  const activeTab = getActiveTab();

  const tabs = [
    {
      id: "overview",
      label: t("tabs.overview"),
      href: basePath,
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: "voting",
      label: t("tabs.voting"),
      href: `${basePath}/voting`,
      icon: <Vote className="w-4 h-4" />,
    },
    {
      id: "votingEnded",
      label: t("tabs.votingEnded"),
      href: `${basePath}/voting-ended`,
      icon: <Clock className="w-4 h-4" />,
    },
    {
      id: "confirmed",
      label: t("tabs.confirmed"),
      href: `${basePath}/confirmed`,
      icon: <CheckCircle className="w-4 h-4" />,
    },
    {
      id: "completed",
      label: t("tabs.completed"),
      href: `${basePath}/completed`,
      icon: <CircleCheck className="w-4 h-4" />,
    },
  ];

  return (
    <div className="py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          {t("title")}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          {t("description")}
        </p>
      </div>

      {/* Tab Navigation - GitHub style */}
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <nav className="flex gap-1 -mb-px overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={`
                inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
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
