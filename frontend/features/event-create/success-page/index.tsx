"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useEventDetail } from "@/hooks/useEventDetail";
import { useAuth } from "@/hooks/useAuth";
import { DEFAULT_OVERVIEW_PATH } from "@/lib/eventRoutes";
import { LoadingState } from "@/components/ui/loading-state";
import { CreateEventShareContent, useCreateEventShare } from "./share";

/**
 * The last screen of event creation. A host arriving here wants one thing —
 * to get the invite in front of people.
 */
export default function CreateEventSuccessPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;
  const t = useTranslations("createEvent.success");
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();
  const { data, isLoading, error } = useEventDetail(eventId);

  useEffect(() => {
    if (error) {
      router.replace(DEFAULT_OVERVIEW_PATH);
    }
  }, [error, router]);

  const eventData = data?.event;
  const eventTitle = eventData?.title ?? "";

  const share = useCreateEventShare({
    eventId,
    eventTitle,
    hostName: user?.displayName || "",
    hostAvatarUrl: user?.avatarUrl || undefined,
    votingDeadline: eventData?.votingDeadline || undefined,
    timeZone: eventData?.timeZone || undefined,
    lineGroupId: eventData?.lineGroupId,
    linkedGroupName: data?.lineGroup?.groupName,
    locale,
  });

  if (isLoading) {
    return <LoadingState viewport="section" spinnerTone="neutral" />;
  }

  if (!eventData) {
    return null;
  }

  return (
    // Header included, this screen is exactly one viewport tall: the invite is
    // the only thing to do here, so nothing should sit below the fold.
    <div className="min-h-[calc(100dvh-var(--header-height))] w-full max-w-md mx-auto py-10 px-6 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-8 space-y-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
      </div>

      <div className="w-full">
        <CreateEventShareContent
          eventTitle={eventTitle}
          votingDeadline={eventData.votingDeadline || undefined}
          locale={locale}
          shareText={share.shareText}
          shareTextCopied={share.shareTextCopied}
          canNativeShareText={share.canNativeShareText}
          canShareToLine={share.canShareToLine}
          linkedGroupName={share.linkedGroupName}
          hasLinkedGroup={share.hasLinkedGroup}
          lineShareStatus={share.lineShareStatus}
          onShareShareText={share.handleShareShareText}
          onShareToLine={share.handleShareToLine}
        />
      </div>
    </div>
  );
}
