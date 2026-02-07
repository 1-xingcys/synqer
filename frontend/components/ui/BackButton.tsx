"use client";

import { TransitionLink } from "@/components/ui/TransitionLink";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  href: string;
  label: string;
  className?: string;
}

export function BackButton({ href, label, className = "" }: BackButtonProps) {
  return (
    <TransitionLink
      href={href}
      className={`inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors ${className}`}
      direction="back"
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </TransitionLink>
  );
}
