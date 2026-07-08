"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";
import { Info, Users, Settings, BarChart3, Vote } from "lucide-react";

export interface NavTab {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface EventDetailNavProps {
  tabs: NavTab[];
}

export function EventDetailNav({ tabs }: EventDetailNavProps) {
  const pathname = usePathname();

  // Determine active tab based on pathname
  const getActiveTabId = () => {
    // Match exact/full tab href first (works with locale prefix via endsWith)
    const sortedTabs = [...tabs].sort((a, b) => b.href.length - a.href.length);
    for (const tab of sortedTabs) {
      if (pathname === tab.href || pathname?.endsWith(tab.href)) return tab.id;
    }
    // Default to first tab (overview)
    return tabs[0]?.id || "";
  };

  const activeTab = getActiveTabId();

  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800">
      <nav className="flex gap-1 -mb-px">
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
  );
}

export const NavIcons = {
  overview: <Info className="w-4 h-4" />,
  vote: <Vote className="w-4 h-4" />,
  participants: <Users className="w-4 h-4" />,
  settings: <Settings className="w-4 h-4" />,
  results: <BarChart3 className="w-4 h-4" />,
};
