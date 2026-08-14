import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { LOCALES } from "@/i18n/locales";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SITE_URL } from "@/lib/site";
import { SITE_NAME, pageIdentity } from "@/lib/pageMetadata";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Per-locale metadata, and the defaults every page below inherits.
 *
 * It has to be generated rather than stated: a single hard-coded title left
 * the English page describing itself in Chinese, and left both pages without a
 * canonical URL, hreflang alternates or a share card.
 *
 * `title.template` is what gives the rest of the site "<page> | Synqer". It
 * applies only to children, so this segment states its own through
 * `title.default` — the landing page is the site, and reads better without the
 * brand appended to a title that already opens with it.
 *
 * The identity block belongs to the landing page specifically, not to the
 * layout: a canonical URL declared here would be inherited verbatim by every
 * page below, each one claiming to be a duplicate of the landing page.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });

  return {
    metadataBase: new URL(SITE_URL),
    applicationName: SITE_NAME,
    title: {
      default: t("title"),
      template: `%s | ${SITE_NAME}`,
    },
    icons: {
      icon: "/synqer.png",
      shortcut: "/synqer.png",
      apple: "/synqer.png",
    },
    ...pageIdentity({
      locale,
      // The tab reads "首頁 | Synqer"; a share preview saying that would be
      // useless, so the brand line is a key of its own.
      shareTitle: t("og_title"),
      description: t("description"),
      ogImageAlt: t("ogImageAlt"),
    }),
  };
}

/** Lets the public pages under this layout be prerendered, one per locale. */
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

/**
 * The root layout is deliberately free of dynamic APIs and of every provider
 * that only the app itself needs. Reading headers() or cookies() here would
 * opt the whole tree out of static rendering, including the public pages that
 * have nothing to do with a session.
 *
 * Auth, LIFF and react-query live in (protected)/layout.tsx instead.
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "en" | "zh-TW")) {
    notFound();
  }

  // Without this next-intl treats the render as dynamic and nothing below can
  // be prerendered.
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* liff.init() fetches its platform extensions from this host; the
            handshake costs ~1.4s cold, so start it alongside our own JS.
            React hoists these into <head>. */}
        <link rel="preconnect" href="https://static.line-scdn.net" />
        <link rel="dns-prefetch" href="https://static.line-scdn.net" />
        <ThemeProvider>
          <NextIntlClientProvider messages={messages}>
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
