import { CategoryPageContent } from "@/components/JoinedEventsOverview";
import { EventStatus } from "@/types/event";

export default function VotingEventsPage() {
  return <CategoryPageContent category={EventStatus.VOTING} />;
}
