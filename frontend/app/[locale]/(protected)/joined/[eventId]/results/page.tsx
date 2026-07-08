import { redirect } from "@/i18n/routing";
import { legacyDetailRedirect } from "@/lib/eventRoutes";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; eventId: string }>;
}) {
  const { locale, eventId } = await params;
  redirect({ href: legacyDetailRedirect(eventId, "results"), locale });
}
