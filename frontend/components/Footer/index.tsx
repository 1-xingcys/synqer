"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/routing";

export default function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="w-full bg-zinc-100 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Main Content Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left Section: Logo + Social Icons */}
          <div className="flex items-center gap-4">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Image
                src="/synqer.png"
                alt="Synqer Logo"
                width={30}
                height={30}
                className="object-contain"
              />
              <span
                className="text-xl font-bold bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #6780c7, #78b0e0)",
                }}
              >
                Synqer
              </span>
            </Link>

            {/* Social Icons */}
            <div className="flex items-center gap-2">
              {/* Email */}
              <a
                href="mailto:synqer@googlegroups.com"
                className="w-9 h-9 rounded-md bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center"
                title={t("email")}
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
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </a>

              {/* LINE Official Account */}
              <a
                href="https://line.me/R/ti/p/@453ykpnm"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-md bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center"
                title={t("lineOfficialAccount")}
              >
                <svg
                  className="w-5 h-5 text-zinc-600 dark:text-zinc-400"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                </svg>
              </a>
            </div>
          </div>

          {/* Right Section: Links */}
          <div className="flex items-center gap-4">
            {/* Navigation Links */}
            <nav className="flex items-center gap-4">
              <Link
                href="/privacy"
                className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 text-sm font-medium transition-colors"
              >
                {t("privacyPolicy")}
              </Link>
              <span className="text-zinc-300 dark:text-zinc-600">•</span>
              <Link
                href="/terms"
                className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 text-sm font-medium transition-colors"
              >
                {t("termsOfUse")}
              </Link>
            </nav>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <p className="text-center text-zinc-500 dark:text-zinc-500 text-xs">
            {t("copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
}
