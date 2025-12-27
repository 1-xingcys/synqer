import { HostedCategoryPageContent } from "@/components/HostedEventsOverview";
import { EventStatus } from "@/types/event";

export default function HostedConfirmedEventsPage() {
  return <HostedCategoryPageContent category={EventStatus.CONFIRMED} />;
}
