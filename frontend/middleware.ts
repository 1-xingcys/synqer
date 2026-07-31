import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { SESSION_COOKIE_NAME, resolveLoginRedirect } from "./lib/auth-gate";

const handleIntl = createIntlMiddleware(routing);

/**
 * 身份驗證分兩層：
 * 1. 這裡只擋「連 session cookie 都沒有」的請求，讓未登入者不必先下載整包 JS
 *    才被導走，受保護頁面也因此能直接 server render。
 * 2. cookie 存在但已失效的情況，仍由 (protected)/layout.tsx 在 /auth/me
 *    回應後導頁。
 */
export default function middleware(request: NextRequest) {
  const redirectTo = resolveLoginRedirect({
    pathname: request.nextUrl.pathname,
    hasSessionCookie: request.cookies.has(SESSION_COOKIE_NAME),
    userAgent: request.headers.get("user-agent") ?? "",
  });

  if (redirectTo) {
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  return handleIntl(request);
}

export const config = {
  matcher: ["/", "/(zh-TW|en)/:path*", "/((?!_next|_vercel|.*\\..*).*)"],
};
