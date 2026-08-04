import { getTranslations, setRequestLocale } from "next-intl/server";
import PublicHeader from "@/components/layout/header/PublicHeader";
import Footer from "@/components/layout/footer";
import { Link } from "@/i18n/routing";

/** Static content with no session and no interaction: prerendered per locale. */
export default async function TermsOfUsePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("terms");

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-b from-zinc-50 to-white dark:from-black dark:to-zinc-900">
      <PublicHeader />

      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              {t("title")}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              {t("lastUpdated")}
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-zinc dark:prose-invert max-w-none">
            {/* Introduction */}
            <section className="mb-10">
              <p className="text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {t("intro")}
              </p>
            </section>

            {/* Section 1 */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold">
                  1
                </span>
                {t("sections.acceptance.title")}
              </h2>
              <div className="pl-11">
                <p className="text-zinc-600 dark:text-zinc-300">
                  {t("sections.acceptance.description")}
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400 text-sm font-bold">
                  2
                </span>
                {t("sections.services.title")}
              </h2>
              <div className="pl-11">
                <p className="text-zinc-600 dark:text-zinc-300 mb-4">
                  {t("sections.services.description")}
                </p>
                <ul className="space-y-2">
                  {(t.raw("sections.services.items") as string[]).map(
                    (item: string, index: number) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-zinc-600 dark:text-zinc-300"
                      >
                        <span className="text-purple-500 mt-1">•</span>
                        {item}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400 text-sm font-bold">
                  3
                </span>
                {t("sections.account.title")}
              </h2>
              <div className="pl-11">
                <p className="text-zinc-600 dark:text-zinc-300 mb-4">
                  {t("sections.account.description")}
                </p>
                <ul className="space-y-2">
                  {(t.raw("sections.account.items") as string[]).map(
                    (item: string, index: number) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-zinc-600 dark:text-zinc-300"
                      >
                        <span className="text-green-500 mt-1">•</span>
                        {item}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-400 text-sm font-bold">
                  4
                </span>
                {t("sections.conduct.title")}
              </h2>
              <div className="pl-11">
                <p className="text-zinc-600 dark:text-zinc-300 mb-4">
                  {t("sections.conduct.description")}
                </p>
                <ul className="space-y-2">
                  {(t.raw("sections.conduct.items") as string[]).map(
                    (item: string, index: number) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-zinc-600 dark:text-zinc-300"
                      >
                        <span className="text-amber-500 mt-1">•</span>
                        {item}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </section>

            {/* Section 5 */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-rose-100 dark:bg-rose-900/30 rounded-lg flex items-center justify-center text-rose-600 dark:text-rose-400 text-sm font-bold">
                  5
                </span>
                {t("sections.intellectual.title")}
              </h2>
              <div className="pl-11">
                <p className="text-zinc-600 dark:text-zinc-300">
                  {t("sections.intellectual.description")}
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center text-cyan-600 dark:text-cyan-400 text-sm font-bold">
                  6
                </span>
                {t("sections.disclaimer.title")}
              </h2>
              <div className="pl-11">
                <p className="text-zinc-600 dark:text-zinc-300">
                  {t("sections.disclaimer.description")}
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-sm font-bold">
                  7
                </span>
                {t("sections.liability.title")}
              </h2>
              <div className="pl-11">
                <p className="text-zinc-600 dark:text-zinc-300">
                  {t("sections.liability.description")}
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center text-teal-600 dark:text-teal-400 text-sm font-bold">
                  8
                </span>
                {t("sections.termination.title")}
              </h2>
              <div className="pl-11">
                <p className="text-zinc-600 dark:text-zinc-300">
                  {t("sections.termination.description")}
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center text-orange-600 dark:text-orange-400 text-sm font-bold">
                  9
                </span>
                {t("sections.changes.title")}
              </h2>
              <div className="pl-11">
                <p className="text-zinc-600 dark:text-zinc-300">
                  {t("sections.changes.description")}
                </p>
              </div>
            </section>

            {/* Contact */}
            <section className="mt-12 p-6 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                {t("contact.title")}
              </h2>
              <p className="text-zinc-600 dark:text-zinc-300 mb-4">
                {t("contact.description")}
              </p>
              <a
                href="mailto:synqer@googlegroups.com"
                className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
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
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                synqer@googlegroups.com
              </a>
            </section>

            {/* Back to Home */}
            <div className="mt-12 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                {t("backToHome")}
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
