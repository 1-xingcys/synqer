"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { VoteMode } from "@/types/event";
import type { TimeGranularity } from "@/components/eventCommon/timeGrid/types";
import { GRANULARITY_OPTIONS } from "@/lib/eventPreference";
import { cn } from "@/lib/utils";
import { PreferencePreviewGrid } from "./PreferencePreviewGrid";

interface EventPreferenceFieldsProps {
  granularity: TimeGranularity;
  voteMode: VoteMode;
  onGranularityChange: (granularity: TimeGranularity) => void;
  onVoteModeChange: (voteMode: VoteMode) => void;
  disabled?: boolean;
  showPreviewGrid?: boolean;
}

const VOTE_MODE_SWITCH_ID = "event-preference-vote-mode";

/**
 * The shared body of the event preference settings, used by both the create
 * form and the hosted settings page. Fully controlled: the caller owns the
 * values and decides whether a change goes into form state or straight to the
 * server.
 */
export function EventPreferenceFields({
  granularity,
  voteMode,
  onGranularityChange,
  onVoteModeChange,
  disabled = false,
  showPreviewGrid = false,
}: EventPreferenceFieldsProps) {
  const t = useTranslations("eventPreference");
  const isAvailableMode = voteMode === VoteMode.AVAILABLE;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Label className="shrink-0">{t("defaultGranularityLabel")}</Label>
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
      </div>

      <div className="flex items-center justify-between gap-4">
        <Label className="shrink-0" htmlFor={VOTE_MODE_SWITCH_ID}>
          {t("defaultVoteModeLabel")}
        </Label>
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
      </div>

      {showPreviewGrid && (
        <PreferencePreviewGrid granularity={granularity} voteMode={voteMode} />
      )}
    </div>
  );
}
