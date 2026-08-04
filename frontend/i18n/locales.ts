/**
 * The locale list, free of any next-intl import.
 *
 * Middleware, LIFF path handling and next-intl's routing config all need it,
 * and only this module is safe to pull into plain unit tests.
 */
export const LOCALES = ["en", "zh-TW"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "zh-TW";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/**
 * Split a pathname into its locale prefix and the locale-less remainder.
 * "/zh-TW/new" -> { locale: "zh-TW", path: "/new" }
 */
export function splitLocale(pathname: string): {
  locale: string | null;
  path: string;
} {
  for (const locale of LOCALES) {
    if (pathname === `/${locale}`) {
      return { locale, path: "/" };
    }
    if (pathname.startsWith(`/${locale}/`)) {
      return { locale, path: pathname.slice(locale.length + 1) };
    }
  }
  return { locale: null, path: pathname };
}
