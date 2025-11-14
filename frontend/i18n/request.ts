import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

type Locale = (typeof routing.locales)[number];

export default getRequestConfig(async ({ requestLocale }) => {
  const localeFromRequest = await requestLocale;

  const locale: Locale = routing.locales.includes(localeFromRequest as Locale)
    ? (localeFromRequest as Locale)
    : routing.defaultLocale;

  return {
    locale,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    messages: (await import(`../messages/${locale}.json`)).default as Record<
      string,
      string
    >,
  };
});
