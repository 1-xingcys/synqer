import type { MetadataRoute } from "next";
import { LOCALES, DEFAULT_LOCALE } from "@/i18n/locales";
import { siteUrl } from "@/lib/seo/site";

/** Every public route. The app itself is behind a session and is not indexed. */
const PUBLIC_PATHS = ["", "/privacy", "/terms"] as const;

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.flatMap((path) =>
    LOCALES.map((locale) => ({
      url: siteUrl(`/${locale}${path}`),
      changeFrequency: "monthly" as const,
      // The landing page is the entry point; the legal pages are not.
      priority: path === "" ? 1 : 0.5,
      alternates: {
        languages: {
          ...Object.fromEntries(
            LOCALES.map((alternate) => [
              alternate,
              siteUrl(`/${alternate}${path}`),
            ]),
          ),
          "x-default": siteUrl(`/${DEFAULT_LOCALE}${path}`),
        },
      },
    })),
  );
}
