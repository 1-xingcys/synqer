import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// 不需要身份驗證的路徑（不包含語系前綴）
const publicPaths = ["/", "/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 先處理國際化
  const intlMiddleware = createIntlMiddleware(routing);
  const response = intlMiddleware(request) || NextResponse.next();

  // 提取不含語系的路徑
  const pathWithoutLocale = pathname.replace(/^\/(zh-TW|en)/, "") || "/";

  // 檢查是否為公開路徑
  const isPublicPath = publicPaths.some(
    (path) =>
      pathWithoutLocale === path || pathWithoutLocale.startsWith(path + "/"),
  );

  // 如果不是公開路徑，則需要驗證
  if (!isPublicPath) {
    // 檢查 session cookie
    const sessionCookie = request.cookies.get("connect.sid");

    if (!sessionCookie) {
      // 重定向到登入頁面並帶上 redirect 參數
      const url = request.nextUrl.clone();
      url.pathname = `/login`;
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/", "/(zh-TW|en)/:path*", "/((?!_next|_vercel|.*\\..*).*)"],
};
