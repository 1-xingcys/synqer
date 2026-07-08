import { redirect } from "@/i18n/routing";
import { legacyOverviewRedirect } from "@/lib/eventRoutes";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: legacyOverviewRedirect("voting-ended"), locale });
}
