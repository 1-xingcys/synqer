"use client";

import { useTranslations } from "next-intl";
import { useAuthContext } from "@/contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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

export default function UserMenu() {
  const t = useTranslations();
  const { user, logout } = useAuthContext();
  const { isInClient: isInLiff } = useLiff();

  if (!user) return null;

  // 從 displayName 或 email 取得首字作為 fallback
  const getInitials = () => {
    const name = user.displayName || user.primaryEmail || "U";
    return name.charAt(0).toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="使用者選單"
        >
          <Avatar className="size-9 cursor-pointer hover:opacity-80 transition-opacity">
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
      <DropdownMenuContent align="end" className="w-56">
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
        {/* 在 LIFF 環境中不顯示登出按鈕，保持始終登入狀態 */}
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
