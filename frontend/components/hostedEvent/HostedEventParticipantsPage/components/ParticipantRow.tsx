"use client";

import Image from "next/image";
import { Check, Plus, X } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

interface ParticipantRowProps {
  displayName: string;
  pictureUrl?: string | null;
  isSelected: boolean;
  isRegistered?: boolean;
  hasVoted?: boolean;
  showStatus?: boolean;
  onAdd?: () => void;
  onRemove?: () => void;
  variant?: "add" | "selected" | "toggle";
}

export function ParticipantRow({
  displayName,
  pictureUrl,
  isSelected,
  isRegistered = true,
  hasVoted,
  showStatus = false,
  onAdd,
  onRemove,
  variant = "toggle",
}: ParticipantRowProps) {
  const t = useTranslations();

  const handleClick = () => {
    if (variant === "add" && onAdd && !isSelected) {
      onAdd();
    } else if (variant === "toggle") {
      if (isSelected && onRemove) {
        onRemove();
      } else if (!isSelected && onAdd) {
        onAdd();
      }
    }
  };

  const isClickable =
    variant === "selected"
      ? false
      : variant === "add"
        ? !isSelected && !!onAdd
        : true;

  return (
    <div
      onClick={isClickable ? handleClick : undefined}
      className={`
        flex items-center gap-3 p-3 rounded-lg transition-colors
        ${isClickable ? "cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800" : ""}
        ${variant === "add" && isSelected ? "opacity-50" : ""}
      `}
    >
      {/* Avatar */}
      {pictureUrl && pictureUrl.length > 0 ? (
        <Image
          src={pictureUrl}
          alt={displayName}
          width={40}
          height={40}
          className="w-10 h-10 rounded-full object-cover"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-medium">
          {displayName[0]?.toUpperCase() || "?"}
        </div>
      )}

      {/* Name and Status */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
          {displayName}
        </p>
        {showStatus && (
          <div className="mt-0.5">
            {!isRegistered ? (
              <StatusBadge
                variant="notRegistered"
                label={t("hosted.participantsPage.notRegistered")}
              />
            ) : hasVoted !== undefined ? (
              hasVoted ? (
                <StatusBadge
                  variant="voted"
                  label={t("hosted.participantsPage.voted")}
                />
              ) : (
                <StatusBadge
                  variant="notVoted"
                  label={t("hosted.participantsPage.notVotedYet")}
                />
              )
            ) : null}
          </div>
        )}
      </div>

      {/* Action Icon */}
      {variant === "selected" && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      {variant === "toggle" && (
        <div
          className={`p-1 rounded-full ${
            isSelected ? "text-green-500" : "text-zinc-400"
          }`}
        >
          {isSelected ? (
            <Check className="w-5 h-5" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
        </div>
      )}
      {variant === "add" && (
        <div
          className={`p-1 rounded-full ${
            isSelected ? "text-green-500" : "text-zinc-400"
          }`}
        >
          {isSelected ? (
            <Check className="w-5 h-5" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
        </div>
      )}
    </div>
  );
}
