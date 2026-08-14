import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import PublicHeader from "@/components/layout/header/PublicHeader";
import Footer from "@/components/layout/footer";
import { LiffPathHandler } from "@/components/providers/LiffPathHandler";
import { UsageFlow } from "@/features/landing/UsageFlow";
import { siteUrl } from "@/lib/site";

const LINE_OA_URL = "https://line.me/R/ti/p/@453ykpnm";

function LineGlyph({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  );
}

function CheckGlyph({ className }: { className: string }) {
  return (
    <svg
      className={className}
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
  );
}

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

/**
 * Animated grid background.
 */
function AnimatedGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-white dark:to-zinc-900" />

      {/* Animated grid lines */}
      <svg
        className="hidden md:block absolute inset-0 w-full h-full opacity-[0.03] dark:opacity-[0.05]"
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

      {/* Floating shapes - using Synqer colors */}
      <FloatingIcon
        className="hidden md:block md:top-[18%] md:left-[10%]"
        delay={0.2}
      >
        <div
          className="w-9 h-9 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-xl backdrop-blur-sm flex items-center justify-center"
          style={{
            background:
              "linear-gradient(to bottom right, rgba(103, 128, 199, 0.2), rgba(103, 128, 199, 0.1))",
            borderColor: "rgba(103, 128, 199, 0.2)",
            borderWidth: 1,
          }}
        >
          <svg
            className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7"
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
        className="hidden md:block md:top-[24%] md:right-[12%]"
        delay={0.4}
      >
        <div
          className="w-9 h-9 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full backdrop-blur-sm flex items-center justify-center"
          style={{
            background:
              "linear-gradient(to bottom right, rgba(120, 176, 224, 0.2), rgba(120, 176, 224, 0.1))",
            borderColor: "rgba(120, 176, 224, 0.2)",
            borderWidth: 1,
          }}
        >
          <svg
            className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7"
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

      <FloatingIcon
        className="hidden lg:block bottom-[18%] left-[8%]"
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
          <CheckGlyph className="w-5 h-5" />
        </div>
      </FloatingIcon>

      {/* Gradient orbs - using Synqer colors */}
      <div
        className="absolute top-1/4 -left-10 md:-left-32 w-64 h-64 md:w-72 md:h-72 lg:w-96 lg:h-96 rounded-full blur-3xl"
        style={{
          backgroundColor: "rgba(103, 128, 199, 0.16)",
          animation: "pulse 8s ease-in-out infinite",
        }}
      />
      <div
        className="absolute bottom-1/4 -right-10 md:-right-32 w-64 h-64 md:w-72 md:h-72 lg:w-96 lg:h-96 rounded-full blur-3xl"
        style={{
          backgroundColor: "rgba(120, 176, 224, 0.16)",
          animation: "pulse 8s ease-in-out infinite 2s",
        }}
      />
    </div>
  );
}

/**
 * The marketing page, prerendered per locale.
 *
 * It used to wait on /auth/me before painting anything, so the first thing a
 * visitor with no session saw was a spinner. Nothing here depends on the
 * session any more: the web call to action points at /login, which forwards an
 * existing session into the app on the server.
 *
 * LiffPathHandler still wraps the content because this URL is the LIFF entry
 * point and the LINE Login callback target.
 */
export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("landing");
  const tSeo = await getTranslations("seo");

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Synqer",
    url: siteUrl(`/${locale}`),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: tSeo("description"),
    inLanguage: locale,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "TWD",
    },
  };

  return (
    <LiffPathHandler>
      <script
        type="application/ld+json"
        // Values are our own literals and translated copy, never user input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="bg-white dark:bg-zinc-900">
        <PublicHeader />

        <section className="relative flex h-[60vh] lg:h-[50vh] overflow-visible justify-center items-end">
          <AnimatedGrid />

          <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-3 md:mb-4 animate-fade-in-up-delay-1">
              <span className="text-zinc-900 dark:text-zinc-100">
                {t("hero.titlePart1")}
              </span>
              <br />
              <span
                className="bg-clip-text text-transparent bg-size-[200%_auto]"
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
            <p className="text-sm sm:text-base md:text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto mb-6 md:mb-8 leading-relaxed animate-fade-in-up-delay-2">
              {t("hero.subtitle")}
            </p>

            {/* CTA Buttons. The primary one is the LINE official account: it is
                the shortest path to a first event, and the one the product is
                built around. */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-up-delay-3">
              <a
                href={LINE_OA_URL}
                target="_blank"
                rel="noopener noreferrer"
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
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </div>
                {/* Button content */}
                <span className="relative flex items-center gap-2">
                  <LineGlyph className="w-4 h-4 md:w-5 md:h-5" />
                  {t("hero.getStarted")}
                </span>
              </a>

              <Link
                href="/login"
                className="group px-5 py-2.5 md:px-6 md:py-3 text-sm md:text-base font-semibold text-zinc-700 dark:text-zinc-300 rounded-lg md:rounded-xl border-2 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-300"
              >
                <span className="flex items-center gap-2">
                  {t("hero.learnMore")}
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
              </Link>
            </div>
          </div>
        </section>

        <main className="px-4 sm:px-6 lg:px-8 pb-8">
          <div className="max-w-7xl mx-auto">
            <UsageFlow />
          </div>
        </main>

        <Footer />
      </div>
    </LiffPathHandler>
  );
}
