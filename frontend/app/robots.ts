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

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: LOCALES.flatMap((locale) =>
        PRIVATE_PATHS.map((path) => `/${locale}${path}`),
      ),
    },
    sitemap: siteUrl("/sitemap.xml"),
  };
}
