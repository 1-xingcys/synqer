import { ReactNode } from "react";
import { headers } from "next/headers";
import { matchesLineUserAgent } from "@/lib/auth-gate";
import { AuthProvider } from "@/contexts/AuthContext";
import { LiffProvider } from "@/contexts/LiffContext";
import { QueryProvider } from "@/components/QueryProvider";
import { LiffPathHandler } from "@/components/LiffPathHandler";
import ProtectedShell from "./ProtectedShell";

interface ProtectedLayoutProps {
  children: ReactNode;
}

/**
 * Everything a signed-in session needs. It lives here rather than in the root
 * layout so the public pages stay free of dynamic APIs and can be prerendered.
 *
 * Reading headers() keeps these routes dynamic, which they already were.
 */
export default async function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  // Detect the LINE in-app browser on the server so LiffPathHandler does not
  // have to wait until hydration to know whether it can render children.
  const isLineClient = matchesLineUserAgent(
    (await headers()).get("user-agent") ?? "",
  );

  return (
    <QueryProvider>
      <LiffProvider>
        <LiffPathHandler isLineClient={isLineClient}>
          <AuthProvider>
            <ProtectedShell>{children}</ProtectedShell>
          </AuthProvider>
        </LiffPathHandler>
      </LiffProvider>
    </QueryProvider>
  );
}
