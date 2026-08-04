import { cookies } from "next/headers";
import { redirect } from "@/i18n/routing";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/locales";
import LoginPage from "@/features/auth/LoginPage";
import {
  SESSION_COOKIE_NAME,
  SESSION_EXPIRED_PARAM,
  resolveSignedInRedirect,
  validateRedirectPath,
} from "@/lib/auth-gate";

/**
 * Unlike its neighbours this page is rendered per request rather than
 * prerendered: it has to read `?redirect` to build the provider links, and the
 * session cookie to decide whether to show itself at all.
 */
export default async function Login({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  const query = await searchParams;

  const requested = typeof query.redirect === "string" ? query.redirect : null;

  const signedInDestination = resolveSignedInRedirect({
    hasSessionCookie: (await cookies()).has(SESSION_COOKIE_NAME),
    redirect: requested,
    sessionExpired: query[SESSION_EXPIRED_PARAM] !== undefined,
  });

  if (signedInDestination) {
    redirect({
      href: signedInDestination,
      locale: isLocale(locale) ? locale : DEFAULT_LOCALE,
    });
  }

  return <LoginPage redirectPath={validateRedirectPath(requested)} />;
}
