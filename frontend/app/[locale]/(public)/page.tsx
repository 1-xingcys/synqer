"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useAuthContext } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";

// Floating calendar/schedule icon component with animation
function FloatingIcon({
  className,
  delay,
  children,
}: {
  className: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`absolute opacity-0 ${className}`}
      style={{
        animation: `float 6s ease-in-out infinite, fadeIn 1s ease-out ${delay}s forwards`,
      }}
    >
      {children}
    </div>
  );
}

// Animated grid background
function AnimatedGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-white dark:to-zinc-900" />

      {/* Animated grid lines */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.03] dark:opacity-[0.05]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="grid"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-zinc-900 dark:text-zinc-100"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Floating shapes - using Synqer colors, hidden on mobile */}
      <FloatingIcon
        className="hidden md:block top-[15%] left-[10%]"
        delay={0.2}
      >
        <div
          className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl backdrop-blur-sm flex items-center justify-center"
          style={{
            background:
              "linear-gradient(to bottom right, rgba(103, 128, 199, 0.2), rgba(103, 128, 199, 0.1))",
            borderColor: "rgba(103, 128, 199, 0.2)",
            borderWidth: 1,
          }}
        >
          <svg
            className="w-6 h-6 lg:w-7 lg:h-7"
            style={{ color: "rgba(103, 128, 199, 0.6)" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      </FloatingIcon>

      <FloatingIcon
        className="hidden md:block top-[25%] right-[15%]"
        delay={0.4}
      >
        <div
          className="w-14 h-14 lg:w-16 lg:h-16 rounded-full backdrop-blur-sm flex items-center justify-center"
          style={{
            background:
              "linear-gradient(to bottom right, rgba(120, 176, 224, 0.2), rgba(120, 176, 224, 0.1))",
            borderColor: "rgba(120, 176, 224, 0.2)",
            borderWidth: 1,
          }}
        >
          <svg
            className="w-7 h-7 lg:w-8 lg:h-8"
            style={{ color: "rgba(120, 176, 224, 0.6)" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </div>
      </FloatingIcon>

      <FloatingIcon
        className="hidden lg:block bottom-[30%] left-[8%]"
        delay={0.6}
      >
        <div
          className="w-10 h-10 rounded-xl backdrop-blur-sm flex items-center justify-center rotate-12"
          style={{
            background:
              "linear-gradient(to bottom right, rgba(103, 128, 199, 0.15), rgba(120, 176, 224, 0.1))",
            borderColor: "rgba(103, 128, 199, 0.2)",
            borderWidth: 1,
          }}
        >
          <svg
            className="w-5 h-5"
            style={{ color: "rgba(103, 128, 199, 0.6)" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      </FloatingIcon>

      <FloatingIcon
        className="hidden lg:block bottom-[25%] right-[12%]"
        delay={0.8}
      >
        <div
          className="w-10 h-10 rounded-lg backdrop-blur-sm flex items-center justify-center -rotate-6"
          style={{
            background:
              "linear-gradient(to bottom right, rgba(120, 176, 224, 0.15), rgba(103, 128, 199, 0.1))",
            borderColor: "rgba(120, 176, 224, 0.2)",
            borderWidth: 1,
          }}
        >
          <svg
            className="w-5 h-5"
            style={{ color: "rgba(120, 176, 224, 0.6)" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </FloatingIcon>

      <FloatingIcon className="hidden lg:block top-[45%] left-[20%]" delay={1}>
        <div
          className="w-8 h-8 rounded-full backdrop-blur-sm"
          style={{
            background:
              "linear-gradient(to bottom right, rgba(103, 128, 199, 0.2), rgba(120, 176, 224, 0.1))",
            borderColor: "rgba(103, 128, 199, 0.2)",
            borderWidth: 1,
          }}
        />
      </FloatingIcon>

      <FloatingIcon
        className="hidden lg:block top-[60%] right-[25%]"
        delay={1.2}
      >
        <div
          className="w-6 h-6 rounded-lg rotate-45"
          style={{
            background:
              "linear-gradient(to bottom right, rgba(120, 176, 224, 0.2), rgba(103, 128, 199, 0.1))",
            borderColor: "rgba(120, 176, 224, 0.2)",
            borderWidth: 1,
          }}
        />
      </FloatingIcon>

      {/* Gradient orbs - using Synqer colors */}
      <div
        className="absolute top-1/4 -left-16 md:-left-32 w-48 h-48 md:w-72 md:h-72 lg:w-96 lg:h-96 rounded-full blur-3xl"
        style={{
          backgroundColor: "rgba(103, 128, 199, 0.1)",
          animation: "pulse 8s ease-in-out infinite",
        }}
      />
      <div
        className="absolute bottom-1/4 -right-16 md:-right-32 w-48 h-48 md:w-72 md:h-72 lg:w-96 lg:h-96 rounded-full blur-3xl"
        style={{
          backgroundColor: "rgba(120, 176, 224, 0.1)",
          animation: "pulse 8s ease-in-out infinite 2s",
        }}
      />
    </div>
  );
}

export default function LandingPage() {
  const t = useTranslations("landing");
  const commonT = useTranslations("common");
  const router = useRouter();
  const { user, loading } = useAuthContext();
  const [mounted, setMounted] = useState(false);

  // Set mounted state on client-side only
  if (typeof window !== "undefined" && !mounted) {
    void Promise.resolve().then(() => setMounted(true));
  }

  const handleGetStarted = useCallback(() => {
    if (user) {
      router.push("/joined");
    } else {
      router.push("/login");
    }
  }, [user, router]);

  const scrollToContent = () => {
    const howItWorksSection = document.getElementById("how-it-works");
    if (howItWorksSection) {
      howItWorksSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
          <p className="text-zinc-600 dark:text-zinc-400">
            {commonT("loading")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900">
      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(3deg);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.1);
          }
        }
        @keyframes bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        .animate-fade-in-up-delay-1 {
          animation: fadeInUp 0.8s ease-out 0.2s forwards;
          opacity: 0;
        }
        .animate-fade-in-up-delay-2 {
          animation: fadeInUp 0.8s ease-out 0.4s forwards;
          opacity: 0;
        }
        .animate-fade-in-up-delay-3 {
          animation: fadeInUp 0.8s ease-out 0.6s forwards;
          opacity: 0;
        }
      `}</style>

      <Header variant="public" />

      {/* Hero Section - Full Viewport */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
        <AnimatedGrid />

        {/* Main Content */}
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 mb-4 md:mb-6 ${mounted ? "animate-fade-in-up" : "opacity-0"}`}
          >
            <span className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 bg-green-500"></span>
            </span>
            <span className="text-xs md:text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {t("hero.badge")}
            </span>
          </div>

          {/* Main Heading */}
          <h1
            className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-3 md:mb-4 ${mounted ? "animate-fade-in-up-delay-1" : "opacity-0"}`}
          >
            <span className="text-zinc-900 dark:text-zinc-100">
              {t("hero.titlePart1")}
            </span>
            <br />
            <span
              className="bg-clip-text text-transparent bg-[length:200%_auto]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, #6780c7, #78b0e0, #6780c7)",
                animation: "shimmer 3s linear infinite",
              }}
            >
              {t("hero.titlePart2")}
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className={`text-sm sm:text-base md:text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto mb-6 md:mb-8 leading-relaxed ${mounted ? "animate-fade-in-up-delay-2" : "opacity-0"}`}
          >
            {t("hero.subtitle")}
          </p>

          {/* CTA Buttons */}
          <div
            className={`flex flex-col sm:flex-row items-center justify-center gap-3 ${mounted ? "animate-fade-in-up-delay-3" : "opacity-0"}`}
          >
            <button
              onClick={handleGetStarted}
              className="group relative px-5 py-2.5 md:px-6 md:py-3 text-sm md:text-base font-semibold text-white rounded-lg md:rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#6780c7]/25"
            >
              {/* Button background with Synqer gradient */}
              <div
                className="absolute inset-0 transition-transform duration-300 group-hover:scale-110"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #6780c7, #78b0e0)",
                }}
              />
              {/* Shine effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </div>
              {/* Button content */}
              <span className="relative flex items-center gap-2">
                {t("hero.getStarted")}
                <svg
                  className="w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </span>
            </button>

            <button
              onClick={scrollToContent}
              className="group px-5 py-2.5 md:px-6 md:py-3 text-sm md:text-base font-semibold text-zinc-700 dark:text-zinc-300 rounded-lg md:rounded-xl border-2 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-300"
            >
              <span className="flex items-center gap-2">
                {t("hero.learnMore")}
                <svg
                  className="w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 group-hover:translate-y-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </span>
            </button>
          </div>
        </div>

        {/* Scroll Indicator - hidden on mobile */}
        <div
          className="hidden sm:flex absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-1.5 cursor-pointer"
          onClick={scrollToContent}
          style={{ animation: "bounce 2s ease-in-out infinite" }}
        >
          <span className="text-xs md:text-sm text-zinc-500 dark:text-zinc-500">
            {t("hero.scroll")}
          </span>
          <div className="w-5 h-8 md:w-6 md:h-10 rounded-full border-2 border-zinc-300 dark:border-zinc-600 flex items-start justify-center p-1.5 md:p-2">
            <div className="w-1 h-2 md:w-1.5 md:h-3 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* How It Works Section */}
          <div id="how-it-works" className="py-16 md:py-24">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-3 md:mb-4">
                {t("howItWorks.title")}
              </h2>
              <p className="text-base md:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                {t("howItWorks.subtitle")}
              </p>
            </div>

            {/* Mobile Layout - Vertical Timeline (like create event form) */}
            <div className="lg:hidden relative max-w-md mx-auto">
              {/* Vertical connecting line */}
              <div className="absolute left-5 top-10 bottom-10 w-0.5 bg-linear-to-b from-blue-300 via-amber-300 via-green-300 to-zinc-300 dark:from-blue-700 dark:via-amber-700 dark:via-green-700 dark:to-zinc-600" />

              {/* Step 1 */}
              <div className="relative flex items-start gap-4 pb-8">
                <div className="shrink-0 relative z-10">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-800 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-300 text-base font-bold">
                    1
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                    {t("howItWorks.step1.title")}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {t("howItWorks.step1.description")}
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative flex items-start gap-4 pb-8">
                <div className="shrink-0 relative z-10">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-200 dark:border-amber-800 rounded-full flex items-center justify-center text-amber-700 dark:text-amber-300 text-base font-bold">
                    2
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                    {t("howItWorks.step2.title")}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {t("howItWorks.step2.description")}
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative flex items-start gap-4 pb-8">
                <div className="shrink-0 relative z-10">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-800 rounded-full flex items-center justify-center text-green-700 dark:text-green-300 text-base font-bold">
                    3
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                    {t("howItWorks.step3.title")}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {t("howItWorks.step3.description")}
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative flex items-start gap-4">
                <div className="shrink-0 relative z-10">
                  <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-full flex items-center justify-center text-zinc-600 dark:text-zinc-400 text-base font-bold">
                    4
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                    {t("howItWorks.step4.title")}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {t("howItWorks.step4.description")}
                  </p>
                </div>
              </div>
            </div>

            {/* Desktop Layout - Horizontal with connecting lines */}
            <div className="hidden lg:block">
              <div className="relative flex justify-between items-start max-w-5xl mx-auto">
                {/* Horizontal connecting line - Light mode */}
                <div
                  className="absolute top-6 left-[calc(12.5%+1.75rem)] right-[calc(12.5%+1.75rem)] h-0.5 dark:hidden"
                  style={{
                    background:
                      "linear-gradient(to right, #93c5fd 0%, #93c5fd 25%, #fcd34d 25%, #fcd34d 50%, #86efac 50%, #86efac 75%, #a1a1aa 75%, #a1a1aa 100%)",
                  }}
                />
                {/* Horizontal connecting line - Dark mode */}
                <div
                  className="absolute top-6 left-[calc(12.5%+1.75rem)] right-[calc(12.5%+1.75rem)] h-0.5 hidden dark:block"
                  style={{
                    background:
                      "linear-gradient(to right, #1d4ed8 0%, #1d4ed8 25%, #d97706 25%, #d97706 50%, #15803d 50%, #15803d 75%, #52525b 75%, #52525b 100%)",
                  }}
                />

                {/* Step 1 */}
                <div className="relative flex flex-col items-center text-center w-1/4 px-4">
                  <div className="relative z-10 w-12 h-12 bg-blue-100 dark:bg-zinc-900 border-2 border-blue-200 dark:border-blue-500 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-400 text-lg font-bold mb-4">
                    1
                  </div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                    {t("howItWorks.step1.title")}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {t("howItWorks.step1.description")}
                  </p>
                </div>

                {/* Step 2 */}
                <div className="relative flex flex-col items-center text-center w-1/4 px-4">
                  <div className="relative z-10 w-12 h-12 bg-amber-100 dark:bg-zinc-900 border-2 border-amber-200 dark:border-amber-500 rounded-full flex items-center justify-center text-amber-700 dark:text-amber-400 text-lg font-bold mb-4">
                    2
                  </div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                    {t("howItWorks.step2.title")}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {t("howItWorks.step2.description")}
                  </p>
                </div>

                {/* Step 3 */}
                <div className="relative flex flex-col items-center text-center w-1/4 px-4">
                  <div className="relative z-10 w-12 h-12 bg-green-100 dark:bg-zinc-900 border-2 border-green-200 dark:border-green-500 rounded-full flex items-center justify-center text-green-700 dark:text-green-400 text-lg font-bold mb-4">
                    3
                  </div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                    {t("howItWorks.step3.title")}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {t("howItWorks.step3.description")}
                  </p>
                </div>

                {/* Step 4 */}
                <div className="relative flex flex-col items-center text-center w-1/4 px-4">
                  <div className="relative z-10 w-12 h-12 bg-zinc-100 dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-500 rounded-full flex items-center justify-center text-zinc-600 dark:text-zinc-400 text-lg font-bold mb-4">
                    4
                  </div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                    {t("howItWorks.step4.title")}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {t("howItWorks.step4.description")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* LINE Integration Section */}
          <div className="pb-24">
            <div className="bg-gradient-to-br from-[#06C755]/10 to-[#06C755]/5 dark:from-[#06C755]/20 dark:to-[#06C755]/5 rounded-2xl p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                {/* Text Content */}
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#06C755] text-white text-sm font-medium rounded-full mb-4">
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                    </svg>
                    LINE
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                    {t("lineIntegration.title")}
                  </h2>
                  <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                    {t("lineIntegration.description")}
                  </p>
                  <ul className="space-y-3 text-left">
                    <li className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-[#06C755] mt-0.5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {t("lineIntegration.feature1")}
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-[#06C755] mt-0.5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {t("lineIntegration.feature2")}
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-[#06C755] mt-0.5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {t("lineIntegration.feature3")}
                      </span>
                    </li>
                  </ul>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center">
                  <div className="bg-white p-4 rounded-xl shadow-lg">
                    <Image
                      src="/qrcode.png"
                      alt="LINE Official Account QR Code"
                      width={180}
                      height={180}
                      className="rounded-lg"
                    />
                  </div>
                  <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400 text-center">
                    {t("lineIntegration.scanQR")}
                  </p>
                  <a
                    href="https://line.me/R/ti/p/@453ykpnm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 px-6 py-3 bg-[#06C755] text-white font-medium rounded-lg hover:bg-[#05b34c] transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                    </svg>
                    {t("lineIntegration.addFriend")}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
