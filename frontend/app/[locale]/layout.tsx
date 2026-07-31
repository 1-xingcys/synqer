import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { matchesLineUserAgent } from "@/lib/auth-gate";
import { AuthProvider } from "@/contexts/AuthContext";
import { LiffProvider } from "@/contexts/LiffContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { QueryProvider } from "@/components/QueryProvider";
import { DebugWrapper } from "@/components/DebugConsole/DebugWrapper";
import { LiffPathHandler } from "@/components/LiffPathHandler";
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

export const metadata: Metadata = {
  title: "Synqer - 輕鬆管理您的活動",
  description: "Synqer 讓活動管理變得簡單而有效率，讓您專注於最重要的事情",
  icons: {
    icon: "/synqer.png",
    shortcut: "/synqer.png",
    apple: "/synqer.png",
  },
};

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

  const messages = await getMessages();

  // Detect the LINE in-app browser on the server so LiffPathHandler does not
  // have to wait until hydration to know whether it can render children.
  const isLineClient = matchesLineUserAgent(
    (await headers()).get("user-agent") ?? "",
  );

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
          <QueryProvider>
            <NextIntlClientProvider messages={messages}>
              <LiffProvider>
                <LiffPathHandler isLineClient={isLineClient}>
                  <AuthProvider>
                    <DebugWrapper>{children}</DebugWrapper>
                  </AuthProvider>
                </LiffPathHandler>
              </LiffProvider>
            </NextIntlClientProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
