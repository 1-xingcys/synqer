"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useRouter, usePathname, Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Clock, CheckCheck, CalendarCheck, ClockFading } from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Z_INDEX } from "@/lib/zIndex";
import {
  eventOverviewPath,
  overviewStatusForEventStatus,
  type OverviewStatus,
} from "@/lib/eventRoutes";
import { useMyEvents } from "@/hooks/useMyEvents";
import {
  isHiddenFromAssistiveTech,
  resolveSidebarPresentation,
  type SidebarOpenState,
} from "./sidebarState";

/**
 * Generic Sidebar component.
 * Provides a clean UI structure without depending on specific business logic.
 *
 * Extensibility:
 * 1. Accepts arbitrary menu items through children
 * 2. Supports collapsed/expanded states
 * 3. Responsive design (mobile/desktop)
 */

interface SidebarProps {
  isOpen: SidebarOpenState;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
}

export default function Sidebar({
  isOpen,
  onClose,
  title,
  children,
}: SidebarProps) {
  const { isCollapsed, showOverlay, visibilityClass, widthClass } =
    resolveSidebarPresentation(isOpen);

  // Only affects the accessibility tree, not the appearance, so learning the
  // window size after mount is fine
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // Without children, fall back to the content held in the context
  const { content: contextContent, title: contextTitle } = useSidebar();
  const sidebarContent = children !== undefined ? children : contextContent;
  const sidebarTitle = title !== undefined ? title : contextTitle;

  // Without children, the sidebar content is set up automatically
  useEffect(() => {
    if (children === undefined) {
      // ProtectedSidebarContent sets the content itself
      return;
    }
  }, [children]);

  // Walk the children and pass down the collapsed prop
  const renderedChildren = sidebarContent
    ? Children.map(sidebarContent, (child) => {
        if (isValidElement(child)) {
          // Only pass collapsed to components that accept it (such as
          // SidebarItem); native HTML elements (such as button) are skipped
          if (typeof child.type === "function") {
            // Check whether this is the SidebarItem component
            const componentType = child.type as {
              name?: string;
              displayName?: string;
            };
            const componentName =
              componentType.name || componentType.displayName;
            const childProps = child.props as { collapsed?: boolean };
            if (
              componentName === "SidebarItem" ||
              childProps.collapsed !== undefined
            ) {
              return cloneElement(child, {
                collapsed: isCollapsed,
              } as Partial<unknown>);
            }
          }
        }
        return child;
      })
    : null;

  return (
    <>
      {/* Overlay - tap to close on mobile */}
      {showOverlay && (
        <div
          className={`fixed inset-0 bg-black/50 ${Z_INDEX.SIDEBAR_BACKDROP} lg:hidden`}
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen lg:h-[calc(100vh-73px)]
          w-64 ${widthClass} bg-white dark:bg-zinc-900 
          border-r border-zinc-200 dark:border-zinc-800
          transition-[transform,opacity,width] duration-300 ease-in-out
          ${Z_INDEX.SIDEBAR_PANEL} lg:z-0
          ${visibilityClass}
        `}
        aria-hidden={isHiddenFromAssistiveTech(isOpen, isDesktop)}
      >
        {/* Sidebar Header - shows the title and close button on mobile */}
        {sidebarTitle && (
          <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800 lg:hidden">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {sidebarTitle}
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Close menu"
            >
              <svg
                className="w-5 h-5 text-zinc-600 dark:text-zinc-400"
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
        )}

        {/* Content */}
        <nav className="p-3 space-y-2">
          {children === undefined && <ProtectedSidebarContent />}
          {renderedChildren}
        </nav>
      </aside>
    </>
  );
}

/**
 * SidebarItem component.
 * A menu entry inside the Sidebar.
 */
interface SidebarItemProps {
  icon?: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  collapsed?: boolean;
}

export function SidebarItem({
  icon,
  label,
  active = false,
  onClick,
  collapsed = false,
}: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full h-12 rounded-lg font-medium transition-colors
        ${
          active
            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
            : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        }
        ${collapsed ? "lg:flex lg:items-center lg:justify-center lg:px-2" : "flex items-center gap-3 px-4"}
      `}
    >
      <span className="shrink-0">{icon}</span>
      <span
        className={`
          transition-all duration-200
          ${collapsed ? "lg:hidden" : "whitespace-nowrap"}
        `}
      >
        {label}
      </span>
    </button>
  );
}

/**
 * ProtectedSidebarContent
 * Sets up the Sidebar content for protected pages.
 */
type SidebarView = OverviewStatus;

const OVERVIEW_ITEMS: ReadonlyArray<{
  status: OverviewStatus;
  labelKey: string;
  icon: ReactNode;
}> = [
  {
    status: "voting",
    labelKey: "dashboard.voting",
    icon: <Clock className="w-4 h-4" />,
  },
  {
    status: "voting-ended",
    labelKey: "dashboard.votingEnded",
    icon: <ClockFading className="w-4 h-4" />,
  },
  {
    status: "confirmed",
    labelKey: "dashboard.confirmed",
    icon: <CalendarCheck className="w-4 h-4" />,
  },
  {
    status: "completed",
    labelKey: "dashboard.completed",
    icon: <CheckCheck className="w-4 h-4" />,
  },
];

function ProtectedSidebarContent() {
  const { isOpen, close, setContent, setTitle } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const { isCollapsed } = resolveSidebarPresentation(isOpen);
  // Shares the same list cache as the overview so detail pages can work out
  // which category they belong to.
  const { events } = useMyEvents();

  // Determine the current view:
  // 1. List page /events/<status> -> exact match on that category
  // 2. Detail page /events/<eventId>[/tab] -> highlight the category matching
  //    the event's status
  const currentView = useMemo<SidebarView | null>(() => {
    const overviewMatch = OVERVIEW_ITEMS.find(
      (item) => pathname === eventOverviewPath(item.status),
    );
    if (overviewMatch) return overviewMatch.status;

    const segments = (pathname || "").split("/").filter(Boolean);
    if (segments[0] === "events" && segments[1]) {
      const detailEvent = events.find((e) => e.id === segments[1]);
      if (detailEvent) {
        return overviewStatusForEventStatus(detailEvent.status);
      }
    }
    return null;
  }, [pathname, events]);

  // Set the Sidebar content - every page shows the same dashboard sidebar
  useEffect(() => {
    setTitle(t("dashboard.menu"));

    const menuItems: Array<{
      id: SidebarView;
      label: string;
      icon: ReactNode;
      href: string;
    }> = OVERVIEW_ITEMS.map((item) => ({
      id: item.status,
      label: t(item.labelKey),
      icon: item.icon,
      href: eventOverviewPath(item.status),
    }));

    setContent(
      <>
        {/* Create event button */}
        <Link
          href="/new"
          onClick={() => {
            if (!isDesktop) {
              close();
            }
          }}
          className={`
            w-full h-12 font-medium rounded-lg transition-colors bg-blue-600 hover:bg-blue-700 text-white no-underline
            ${
              isCollapsed && isDesktop
                ? "lg:flex lg:items-center lg:justify-center lg:px-2"
                : "flex items-center gap-3 px-4"
            }
          `}
        >
          <span className="shrink-0">
            <svg
              className="w-5 h-5"
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
          </span>
          <span
            className={`
            transition-all duration-200
            ${isCollapsed && isDesktop ? "lg:hidden" : "whitespace-nowrap"}
          `}
          >
            {t("dashboard.createNewEvent")}
          </span>
        </Link>

        {/* Menu items */}
        {menuItems.map((item) => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={currentView === item.id}
            collapsed={isCollapsed}
            onClick={() => {
              router.push(item.href);
              if (!isDesktop) {
                close();
              }
            }}
          />
        ))}
      </>,
    );
  }, [
    currentView,
    pathname,
    setContent,
    setTitle,
    t,
    router,
    close,
    isDesktop,
    isCollapsed,
  ]);

  // This component renders nothing; it only sets up the sidebar content
  return null;
}
