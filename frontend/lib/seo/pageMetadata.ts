import type { Metadata } from "next";
import { DEFAULT_LOCALE, LOCALES } from "@/i18n/locales";
import type { OgImage } from "@/lib/seo/ogImage";
import { siteUrl } from "@/lib/seo/site";

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
  /**
   * The card the preview shows. Passed in rather than assumed: the brand card
   * is a build artefact shared by every page that has nothing of its own,
   * while an event page points at a card drawn for that event.
   */
  image: OgImage;
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
  image,
}: PageIdentity): Metadata {
  return {
    ...shareBlock({
      locale,
      shareTitle,
      description,
      image,
      url: siteUrl(`/${locale}${path}`),
    }),
    alternates: {
      canonical: `/${locale}${path}`,
      languages: {
        ...Object.fromEntries(
          LOCALES.map((alternate) => [alternate, `/${alternate}${path}`]),
        ),
        "x-default": `/${DEFAULT_LOCALE}${path}`,
      },
    },
  };
}

/**
 * The same block for a page that cannot name a canonical URL of its own.
 *
 * The event detail tabs are declared by one layout, which does not know which
 * tab it is wrapping. A canonical stated there would be inherited by all five,
 * each one announcing itself as a duplicate of the others — the bug
 * {@link pageIdentity} exists to prevent, reintroduced one level down. They are
 * disallowed in robots.txt and have no search result to lose by staying silent.
 *
 * What they do need is the share block. Without it they inherit the landing
 * page's, so an event link previews with the product pitch instead of the
 * event.
 *
 * Staying silent about the canonical URL is not the same as not having one:
 * the locale layout declares the landing page's identity, which every page
 * that does not override it inherits — so silence here would have each tab
 * announcing itself as a duplicate of the landing page rather than of nothing.
 * `null` is how metadata is declined rather than merely left unsaid.
 */
export function privatePageShare({
  locale,
  shareTitle,
  description,
  image,
}: Omit<PageIdentity, "path">): Metadata {
  return {
    ...shareBlock({ locale, shareTitle, description, image }),
    alternates: null,
  };
}

/**
 * og:url is the only difference between the two, and it is optional — a
 * preview falls back to the URL it was handed.
 */
function shareBlock({
  locale,
  shareTitle,
  description,
  image,
  url,
}: Omit<PageIdentity, "path"> & { url?: string }): Metadata {
  return {
    description,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: shareTitle,
      description,
      ...(url ? { url } : {}),
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
