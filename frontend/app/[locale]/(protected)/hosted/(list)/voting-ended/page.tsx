import { HostedCategoryPageContent } from "@/components/HostedEventsOverview";
import { EventStatus } from "@/types/event";

export default function HostedVotingEndedEventsPage() {
  return <HostedCategoryPageContent category={EventStatus.VOTING_ENDED} />;
}
