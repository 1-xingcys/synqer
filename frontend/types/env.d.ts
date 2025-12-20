/**
 * 環境變數類型定義
 *
 * 在 Next.js 中，NEXT_PUBLIC_ 前綴的變數會暴露給瀏覽器端
 */

declare namespace NodeJS {
  interface ProcessEnv {
    // API 端點
    NEXT_PUBLIC_API: string;

    // LINE LIFF
    /** LINE LIFF App ID（從 LINE Developers Console 取得） */
    NEXT_PUBLIC_LINE_LIFF_ID?: string;

    // 其他環境變數...
    NODE_ENV: "development" | "production" | "test";
  }
}

