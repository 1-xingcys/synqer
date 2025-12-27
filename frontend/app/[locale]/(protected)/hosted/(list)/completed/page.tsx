import { HostedCategoryPageContent } from "@/components/HostedEventsOverview";
import { EventStatus } from "@/types/event";

export default function HostedCompletedEventsPage() {
  return <HostedCategoryPageContent category={EventStatus.COMPLETED} />;
}
