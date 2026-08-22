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

interface PageMetadata {
  locale: string;
  /** Locale-less path, with a leading slash. `""` is the landing page. */
  path?: string;
  /** The tab. Title on the site. */
  title: string;
  /** For a page whose preview should say something else entirely. */
  shareTitle?: string;
  /** What both `<meta name="description">` and og:description will say. */
  description: string;
  /** The card the preview shows. */
  image: OgImage;
}

export function pageMetadata({
  locale,
  path = "",
  title,
  shareTitle,
  description,
  image,
}: PageMetadata): Metadata {
  return {
    ...pageBlock({
      locale,
      title,
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

/** For a page that cannot name a canonical URL of its own. */
export function privatePageMetadata({
  locale,
  title,
  shareTitle,
  description,
  image,
}: Omit<PageMetadata, "path">): Metadata {
  return {
    ...pageBlock({
      locale,
      title,
      shareTitle,
      description,
      image,
    }),
    alternates: null,
  };
}

function pageBlock({
  locale,
  title,
  shareTitle = title,
  description,
  image,
  url,
}: Omit<PageMetadata, "path"> & { url?: string }): Metadata {
  return {
    title,
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
