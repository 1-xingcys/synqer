import { HostedCategoryPageContent } from "@/components/HostedEventsOverview";
import { EventStatus } from "@/types/event";

export default function HostedVotingEventsPage() {
  return <HostedCategoryPageContent category={EventStatus.VOTING} />;
}
