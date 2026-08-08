import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { LOCALES, DEFAULT_LOCALE } from "@/i18n/locales";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SITE_URL, siteUrl } from "@/lib/site";
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

/** The `og:locale` spelling of each of our locales. */
const OG_LOCALES: Record<string, string> = {
  "zh-TW": "zh_TW",
  en: "en_US",
};

/**
 * Per-locale metadata.
 *
 * It has to be generated rather than stated: a single hard-coded title left
 * the English page describing itself in Chinese, and left both pages without a
 * canonical URL, hreflang alternates or a share card.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });

  const title = t("title");
  const description = t("description");

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    applicationName: "Synqer",
    icons: {
      icon: "/synqer.png",
      shortcut: "/synqer.png",
      apple: "/synqer.png",
    },
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ...Object.fromEntries(
          LOCALES.map((alternate) => [alternate, `/${alternate}`]),
        ),
        "x-default": `/${DEFAULT_LOCALE}`,
      },
    },
    openGraph: {
      type: "website",
      siteName: "Synqer",
      title,
      description,
      url: siteUrl(`/${locale}`),
      locale: OG_LOCALES[locale] ?? locale,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
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
