"use client";

import { Link } from "@/i18n/routing";
import { useRouter } from "@/i18n/routing";
import { useCallback, type MouseEvent, type ReactNode } from "react";

interface ViewTransition {
  finished: Promise<void>;
}

interface TransitionLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  /** 滑動方向: forward = 往前（舊頁面左移）, back = 往回（舊頁面右移） */
  direction?: "forward" | "back";
}

export function TransitionLink({
  href,
  children,
  className,
  direction = "forward",
}: TransitionLinkProps) {
  const router = useRouter();

  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      // Allow modified clicks (cmd/ctrl+click, middle-click) to open in new tab
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
        return;
      }

      e.preventDefault();

      // Check if View Transitions API is supported
      if (
        typeof document !== "undefined" &&
        "startViewTransition" in document
      ) {
        // Set direction class on html element
        const html = document.documentElement;
        html.classList.remove("slide-forward", "slide-back");
        const directionClass =
          direction === "back" ? "slide-back" : "slide-forward";
        html.classList.add(directionClass);

        const transition = (
          document as Document & {
            startViewTransition: (callback: () => void) => ViewTransition;
          }
        ).startViewTransition(() => {
          router.push(href);
        });

        // Clean up direction class after transition completes
        void transition.finished.then(() => {
          html.classList.remove(directionClass);
        });
      } else {
        // Fallback for browsers that don't support View Transitions
        router.push(href);
      }
    },
    [href, router, direction],
  );

  // Use Link from i18n/routing for proper locale handling
  return (
    <Link href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
