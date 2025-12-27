import { CategoryPageContent } from "@/components/JoinedEventsOverview";
import { EventStatus } from "@/types/event";

export default function VotingEndedEventsPage() {
  return <CategoryPageContent category={EventStatus.VOTING_ENDED} />;
}
