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

/** "<page> | Synqer", the shape every title on the site takes. */
export function brandedTitle(name: string): string {
  return `${name} | ${SITE_NAME}`;
}

interface PageIdentity {
  locale: string;
  /** Locale-less path, with a leading slash. `""` is the landing page. */
  path?: string;
  /** The title the share preview shows. */
  shareTitle: string;
  /** What both `<meta name="description">` and og:description will say. */
  description: string;
  /** The card the preview shows. */
  image: OgImage;
}

/** The half of a page's metadata that says *which page this is. */
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

/** The same block for a page that cannot name a canonical URL of its own. */
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
