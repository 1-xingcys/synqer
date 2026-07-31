"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuthContext } from "@/contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { LogOutIcon } from "lucide-react";
import { useLiff } from "@/hooks/useLiff";
import { cn } from "@/lib/utils";

export default function UserMenu() {
  const t = useTranslations();
  const { user, loading, logout } = useAuthContext();
  const { isInClient: isInLiff } = useLiff();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // The placeholder matches the avatar size so the header layout stays the same
  // before and after /auth/me responds
  if (loading) return <Skeleton className="size-9 rounded-full" />;

  if (!user) return null;

  // Use the first character of displayName or email as the fallback
  const getInitials = () => {
    const name = user.displayName || user.primaryEmail || "U";
    return name.charAt(0).toUpperCase();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange} modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          ref={triggerRef}
          className={cn(
            "rounded-full hover:ring-3 hover:ring-zinc-300 hover:dark:ring-zinc-600",
            open && "ring-2 sm:ring-3 ring-zinc-300 dark:ring-zinc-600",
          )}
          aria-label="使用者選單"
        >
          <Avatar className="size-9 cursor-pointer transition-opacity">
            {user.avatarUrl ? (
              <AvatarImage
                src={user.avatarUrl}
                alt={user.displayName ?? "User"}
              />
            ) : null}
            <AvatarFallback className="bg-blue-600 text-white text-sm font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56"
        onCloseAutoFocus={(e: Event) => e.preventDefault()}
      >
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.displayName || "使用者"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.primaryEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <LanguageSwitcher asSubmenu />
        <ThemeSwitcher asSubmenu />
        {/* Hide the logout button inside LIFF so the user stays signed in */}
        {!isInLiff && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => void logout()}
              variant="destructive"
              className="cursor-pointer"
            >
              <LogOutIcon className="mr-2 h-4 w-4" />
              {t("auth.logout")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
