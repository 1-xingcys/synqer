import { getTranslations } from "next-intl/server";
import CreateEventFormClient from "@/components/CreateEventForm/CreateEventFormClient";

/**
 * 頁面外殼刻意留在 server component：標題與說明是 LCP 元素，讓它們進到 SSR
 * HTML 才能在 FCP 就畫出來，不必等表單的 chunk 或 /auth/me。
 */
export default async function NewEventPage() {
  const t = await getTranslations();

  return (
    <div className="max-w-4xl mx-auto py-8 pr-4">
      <div className="md:ml-6 lg:ml-18">
        <h1 className="text-2xl font-semibold text-foreground mb-1">
          {t("createEvent.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("createEvent.description")}
        </p>
      </div>

      <CreateEventFormClient />
    </div>
  );
}
