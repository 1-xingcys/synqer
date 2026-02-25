"use client";

import { useTranslations } from "next-intl";
import { useAuthContext } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TITLE_MAX_LENGTH } from "./types";
import { cn } from "@/lib/utils";
import { LineGroupSection } from "./LineGroupSection";
import { useFormStateContext } from "./CreateEventFormContext";
import { useTextFields } from "./hooks/useTextFields";
import { useLineGroupFields } from "./hooks/useLineGroupFields";

export function GeneralSection() {
  const t = useTranslations();
  const { user } = useAuthContext();

  const { formData, setFormData } = useFormStateContext();

  const { titleCharCount, updateTitle } = useTextFields(formData, setFormData);

  const { handleLineGroupChange, handleSelectedMembersChange } =
    useLineGroupFields(setFormData);

  const isOverTitleLimit = titleCharCount >= TITLE_MAX_LENGTH;

  return (
    <div className="rounded-lg py-6 lg:px-6 bg-white dark:bg-zinc-900 relative">
      <div className="flex items-start gap-6">
        {/* Step Number */}
        <div className="shrink-0 flex flex-col items-center relative z-10">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
            1
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-foreground mb-1">
              {t("createEvent.general.title")}
            </h2>
          </div>

          {/* Host and Event Name side by side */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Host - Fixed width */}
            <div className="w-full md:w-48 shrink-0 space-y-1.5">
              <Label>
                {t("createEvent.general.host")}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2 px-3 h-9 border border-input rounded-md bg-muted/50">
                <Avatar className="h-5 w-5">
                  <AvatarImage
                    src={user?.avatarUrl || undefined}
                    alt={user?.displayName || "User"}
                  />
                  <AvatarFallback className="text-xs">
                    {(user?.displayName || user?.primaryEmail || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-foreground truncate">
                  {user?.displayName || user?.primaryEmail || "You"}
                </span>
              </div>
            </div>

            {/* Event Name - Takes remaining space */}
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="title">
                {t("createEvent.general.eventName")}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateTitle(e.target.value)}
                placeholder={t("createEvent.general.eventNamePlaceholder")}
                className={cn(
                  isOverTitleLimit &&
                    "border-destructive focus-visible:ring-destructive/20",
                )}
              />
              <p
                className={cn(
                  "text-xs",
                  isOverTitleLimit
                    ? "text-destructive"
                    : "text-muted-foreground",
                )}
              >
                {titleCharCount} / {TITLE_MAX_LENGTH}{" "}
                {t("createEvent.general.characters")}
                {isOverTitleLimit && (
                  <span className="ml-1">
                    {t("createEvent.general.charLimitReached")}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* LINE Group Selection (only for LINE users) */}
          <LineGroupSection
            selectedGroupId={formData.lineGroupId}
            selectedMemberIds={formData.selectedLineUserIds}
            onGroupChange={handleLineGroupChange}
            onMembersChange={handleSelectedMembersChange}
          />
        </div>
      </div>
    </div>
  );
}
