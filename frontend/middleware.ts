import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// 只處理國際化，身份驗證交給 (protected)/layout.tsx 處理
export default createIntlMiddleware(routing);

export const config = {
  matcher: ["/", "/(zh-TW|en)/:path*", "/((?!_next|_vercel|.*\\..*).*)"],
};
