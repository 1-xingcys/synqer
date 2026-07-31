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
