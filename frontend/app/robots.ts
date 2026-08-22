import type { MetadataRoute } from "next";
import { LOCALES } from "@/i18n/locales";
import { siteUrl } from "@/lib/seo/site";

export const dynamic = "force-static";

/**
 * The routes of the signed-in app, under every locale.
 *
 * They are not worth crawling and in most cases are not reachable: middleware
 * bounces anything under them without a session cookie, so a crawler that
 * follows one only ever collects a redirect to /login. /login itself is a
 * button and nothing else.
 */
const PRIVATE_PATHS = ["/events", "/new", "/login"] as const;

/** The chat apps' link preview fetchers, which are allowed the event pages. */
const UNFURLER_AGENTS = [
  "facebookexternalhit",
  "Slackbot",
  "Slackbot-LinkExpanding",
  "Twitterbot",
  "Discordbot",
  "TelegramBot",
  "WhatsApp",
  "LinkedInBot",
] as const;

function localised(paths: readonly string[]): string[] {
  return LOCALES.flatMap((locale) => paths.map((path) => `/${locale}${path}`));
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: [...UNFURLER_AGENTS],
        allow: "/",
        disallow: localised(["/new", "/login"]),
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: localised(PRIVATE_PATHS),
      },
    ],
    sitemap: siteUrl("/sitemap.xml"),
  };
}
