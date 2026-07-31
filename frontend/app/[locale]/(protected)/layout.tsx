"use client";

import { ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "@/i18n/routing";
import Header from "@/components/Header";
import Sidebar from "@/components/ui/Sidebar";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { useAuthContext } from "@/contexts/AuthContext";

interface ProtectedLayoutProps {
  children: ReactNode;
}

/**
 * ProtectedLayoutContent
 * Inner component that can consume SidebarContext and render the shared Sidebar.
 */
function ProtectedLayoutContent({ children }: ProtectedLayoutProps) {
  const { isOpen, toggle, close } = useSidebar();

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
      <Header variant="protected" onMenuClick={toggle} />

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
 * ProtectedLayout
 * Provides the shared layout structure for every protected page.
 *
 * This no longer blocks the whole page on /auth/me: requests without a session
 * cookie are already redirected to /login by the middleware, so almost every
 * request that reaches here is authenticated. The remaining "cookie exists but
 * is no longer valid" case is handled by the effect below, while the page still
 * renders immediately and user-dependent sections show their own skeletons.
 */
export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuthContext();

  useEffect(() => {
    if (!loading && !user) {
      const redirectPath = pathname || "/";
      router.replace(`/login?redirect=${encodeURIComponent(redirectPath)}`);
    }
  }, [loading, user, pathname, router]);

  return (
    <SidebarProvider>
      <ProtectedLayoutContent>{children}</ProtectedLayoutContent>
    </SidebarProvider>
  );
}
