import { ReactNode } from "react";

/**
 * Public pages carry no session and no LIFF context, so this layout adds
 * nothing. It exists to keep them out of (protected), whose layout is what
 * makes those routes dynamic.
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
