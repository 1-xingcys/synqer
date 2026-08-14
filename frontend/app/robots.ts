import type { MetadataRoute } from "next";
import { LOCALES } from "@/i18n/locales";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";

/**
 * The routes of the signed-in app, under every locale.
 *
 * They are not worth crawling and in most cases are not reachable: middleware
 * bounces anything under them without a session cookie, so a crawler that
 * follows one only ever collects a redirect to /login. /login itself is a
 * button and nothing else.
 *
 * The backend is not listed. It answers on api.synqer.club, a different
 * origin, and this file only governs its own — nginx.conf's /api prefix is a
 * local development detail that production never sees.
 */
const PRIVATE_PATHS = ["/events", "/new", "/login"] as const;

/**
 * The chat apps' link preview fetchers, which are allowed the event pages.
 *
 * Most of them read robots.txt before fetching, so letting them past the
 * middleware is not on its own enough — a disallowed path is one they decline
 * to preview at all. They get their own group here, and a named group replaces
 * the wildcard one for the agent it names rather than adding to it, so this is
 * the whole of what they are told.
 *
 * Search engines stay in the wildcard group. An event's name and schedule are
 * public to whoever holds the link, which is not the same as being public to
 * whoever searches — a preview reaches the chat someone chose to paste it in,
 * and an index reaches everyone.
 *
 * /new and /login remain closed to everybody: neither is ever shared, and
 * neither has anything to preview.
 */
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

/**
 * Prefix matching is all robots.txt has, so allowing the bare event link also
 * allows its tabs. That costs nothing: a tab previews as the same event, and
 * the results tab is shared deliberately anyway.
 */
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
