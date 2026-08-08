import Logo from "@/components/layout/Logo";
import SettingsMenu from "./SettingsMenu";

/**
 * Header for the pages that carry no session.
 *
 */
export default function PublicHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo height={30} href="/" />
          </div>

          <div className="flex items-center gap-3 lg:gap-4">
            <SettingsMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
