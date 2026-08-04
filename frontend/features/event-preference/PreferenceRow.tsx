"use client";

import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

interface PreferenceRowProps {
  label: string;
  /** Set when the row's control is a single labelable element. */
  htmlFor?: string;
  /** Sits beside the label, for preferences that need more than a label. */
  hint?: ReactNode;
  children: ReactNode;
}

/**
 * One preference: a description on the left, its control on the right.
 *
 * Every preference reads the same way, so the layout lives here rather than in
 * each field group.
 */
export function PreferenceRow({
  label,
  htmlFor,
  hint,
  children,
}: PreferenceRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex shrink-0 items-center">
        <Label htmlFor={htmlFor}>{label}</Label>
        {hint}
      </div>
      {children}
    </div>
  );
}
