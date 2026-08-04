import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import Logo from "@/components/layout/Logo";
import SettingsMenu from "./SettingsMenu";

interface PublicHeaderProps {
  /**
   * Suppresses the call to action on the login page, which is already the
   * destination it points at.
   */
  isLoginPage?: boolean;
}

/**
 * Header for the pages that carry no session.
 *
 * It deliberately does not know whether the visitor is signed in: these pages
 * are prerendered, and asking would mean a client-side /auth/me round trip that
 * blocks the first paint. The call to action always points at /login, which
 * forwards an existing session into the app on the server.
 */
export default async function PublicHeader({
  isLoginPage = false,
}: PublicHeaderProps) {
  const t = await getTranslations("landing");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-4">
        <div className="flex items-center justify-between">
          {/* Logo - 左側固定位置 */}
          <div className="flex items-center gap-2">
            <Logo height={30} href="/" />
          </div>

          <div className="flex items-center gap-3 lg:gap-4">
            {!isLoginPage && (
              <Link
                href="/login"
                className="px-4 py-2 lg:px-5 lg:py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t("startUsing")}
              </Link>
            )}
            <SettingsMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
