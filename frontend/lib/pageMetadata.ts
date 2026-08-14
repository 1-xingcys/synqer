import type { Metadata } from "next";
import { DEFAULT_LOCALE, LOCALES } from "@/i18n/locales";
import { brandOgImage } from "@/lib/ogImage";
import { siteUrl } from "@/lib/site";

/** The brand, as it appears in the title bar and in `og:site_name`. */
export const SITE_NAME = "Synqer";

/** The `og:locale` spelling of each of our locales. */
const OG_LOCALES: Record<string, string> = {
  "zh-TW": "zh_TW",
  en: "en_US",
};

/**
 * "<page> | Synqer", the same shape `title.template` gives the tab.
 *
 * og:title has no template mechanism of its own, so pages that want the two to
 * agree compose their share title through here rather than by hand.
 */
export function brandedTitle(name: string): string {
  return `${name} | ${SITE_NAME}`;
}

interface PageIdentity {
  locale: string;
  /** Locale-less path, with a leading slash. `""` is the landing page. */
  path?: string;
  /**
   * The title the share preview shows. The landing page passes the brand line
   * from `seo.og_title`; every other page passes `brandedTitle(its own name)`.
   * It is not the `<title>`, which reads better shorter and is the page's own.
   */
  shareTitle: string;
  /** What both `<meta name="description">` and og:description will say. */
  description: string;
  ogImageAlt: string;
}

/**
 * The half of a page's metadata that says *which page this is*.
 *
 * It cannot live in the locale layout, however tempting that is. Everything
 * declared there is inherited verbatim, so one `canonical` in the layout had
 * /privacy and /terms both telling search engines they were duplicates of the
 * landing page, and pointing `og:url` at it too.
 *
 * Nor can a page declare only the parts it wants to change. Metadata merges
 * *shallowly*: a page that sets `openGraph` replaces the parent's whole object,
 * silently dropping `siteName`, `locale` and the share card. So this returns
 * the block complete, every time, and each page spreads all of it.
 *
 * The `<title>` is deliberately not here — a page states its own, and the
 * `title.template` in the locale layout adds the brand.
 */
export function pageIdentity({
  locale,
  path = "",
  shareTitle,
  description,
  ogImageAlt,
}: PageIdentity): Metadata {
  const image = brandOgImage(locale, ogImageAlt);

  return {
    description,
    alternates: {
      canonical: `/${locale}${path}`,
      languages: {
        ...Object.fromEntries(
          LOCALES.map((alternate) => [alternate, `/${alternate}${path}`]),
        ),
        "x-default": `/${DEFAULT_LOCALE}${path}`,
      },
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: shareTitle,
      description,
      url: siteUrl(`/${locale}${path}`),
      locale: OG_LOCALES[locale] ?? locale,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description,
      images: [image],
    },
  };
}
