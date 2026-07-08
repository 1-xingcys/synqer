import { ReactNode } from "react";

export default function UnifiedListLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="py-8 space-y-6">{children}</div>;
}
