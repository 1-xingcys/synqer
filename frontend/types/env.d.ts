/**
 * Environment variable types.
 *
 * In Next.js, variables prefixed NEXT_PUBLIC_ are exposed to the browser.
 */

declare namespace NodeJS {
  interface ProcessEnv {
    /** API base, shared by the browser and the server, so it must be absolute */
    NEXT_PUBLIC_API: string;

    /** LINE LIFF App ID, from the LINE Developers Console */
    NEXT_PUBLIC_LINE_LIFF_ID?: string;

    // Other environment variables...
    NODE_ENV: "development" | "production" | "test";
  }
}
