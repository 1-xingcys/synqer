"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { VoteMode } from "@/types/event";
import type { TimeGranularity } from "@/types/event";
import { GRANULARITY_OPTIONS } from "@/lib/event/eventPreference";
import { cn } from "@/lib/ui/utils";
import { PreferenceRow } from "../PreferenceRow";
import { GridDefaultPreview } from "./GridDefaultPreview";

interface GridDefaultFieldsProps {
  granularity: TimeGranularity;
  voteMode: VoteMode;
  onGranularityChange: (granularity: TimeGranularity) => void;
  onVoteModeChange: (voteMode: VoteMode) => void;
  disabled?: boolean;
  showPreview?: boolean;
}

const VOTE_MODE_SWITCH_ID = "grid-default-vote-mode";

/**
 * How the time grid first appears to participants.
 *
 * These only seed the initial view: participants can still switch granularity
 * and vote mode themselves, and their choice is never persisted. Fully
 * controlled — the caller owns the values and decides whether a change goes
 * into form state or straight to the server.
 */
export function GridDefaultFields({
  granularity,
  voteMode,
  onGranularityChange,
  onVoteModeChange,
  disabled = false,
  showPreview = false,
}: GridDefaultFieldsProps) {
  const t = useTranslations("eventPreference.gridDefault");
  const isAvailableMode = voteMode === VoteMode.AVAILABLE;

  return (
    <div className="space-y-4">
      <PreferenceRow label={t("granularityLabel")}>
        <div className="flex items-center gap-1">
          {GRANULARITY_OPTIONS.map((option) => {
            const isSelected = option === granularity;

            return (
              <Button
                key={option}
                type="button"
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  "h-7 px-2.5 text-xs",
                  !isSelected && "text-muted-foreground",
                )}
                disabled={disabled}
                onClick={() => onGranularityChange(option)}
              >
                {t(`granularity${option}`)}
              </Button>
            );
          })}
        </div>
      </PreferenceRow>

      <PreferenceRow label={t("voteModeLabel")} htmlFor={VOTE_MODE_SWITCH_ID}>
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "text-xs",
              isAvailableMode
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400",
            )}
          >
            {isAvailableMode
              ? t("voteModeAvailableHint")
              : t("voteModeUnavailableHint")}
          </p>
          <Switch
            id={VOTE_MODE_SWITCH_ID}
            checked={isAvailableMode}
            disabled={disabled}
            // Tinted by meaning rather than on/off: both states are a real
            // mode, so neither should read as "unset".
            className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-rose-500 dark:data-[state=checked]:bg-emerald-600 dark:data-[state=unchecked]:bg-rose-500"
            onCheckedChange={(checked) =>
              onVoteModeChange(
                checked ? VoteMode.AVAILABLE : VoteMode.UNAVAILABLE,
              )
            }
          />
        </div>
      </PreferenceRow>

      {showPreview && (
        <GridDefaultPreview granularity={granularity} voteMode={voteMode} />
      )}
    </div>
  );
}
