"use client";

import { ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "@/i18n/routing";
import ProtectedHeader from "@/components/layout/header/ProtectedHeader";
import { isEventDetailPagePath } from "@/components/layout/header/pathRules";
import Sidebar from "@/components/layout/Sidebar";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { SESSION_EXPIRED_PARAM } from "@/lib/auth-gate";

interface ProtectedShellProps {
  children: ReactNode;
}

/**
 * Inner component that can consume SidebarContext and render the shared Sidebar.
 */
function ProtectedShellContent({ children }: ProtectedShellProps) {
  const { isOpen, toggle, close } = useSidebar();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
      <ProtectedHeader
        onMenuClick={toggle}
        sticky={!isEventDetailPagePath(pathname)}
      />

      <div className="w-full">
        <div className="flex gap-6 items-start">
          <Sidebar isOpen={isOpen} onClose={close} />

          {/* Main Content */}
          <div className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8">
            <main>{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The interactive half of the protected layout.
 *
 * This no longer blocks the whole page on /auth/me: requests without a session
 * cookie are already redirected to /login by the middleware, so almost every
 * request that reaches here is authenticated. The remaining "cookie exists but
 * is no longer valid" case is handled by the effect below, while the page still
 * renders immediately and user-dependent sections show their own skeletons.
 */
export default function ProtectedShell({ children }: ProtectedShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuthContext();

  useEffect(() => {
    if (!loading && !user) {
      const redirectPath = pathname || "/";
      // The cookie is still in the jar — the API just rejected it. The flag
      // tells the login page not to send us straight back here.
      router.replace(
        `/login?redirect=${encodeURIComponent(redirectPath)}&${SESSION_EXPIRED_PARAM}=1`,
      );
    }
  }, [loading, user, pathname, router]);

  return (
    <SidebarProvider>
      <ProtectedShellContent>{children}</ProtectedShellContent>
    </SidebarProvider>
  );
}
