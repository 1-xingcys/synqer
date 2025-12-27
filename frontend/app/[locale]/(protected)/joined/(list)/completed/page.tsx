import { CategoryPageContent } from "@/components/JoinedEventsOverview";
import { EventStatus } from "@/types/event";

export default function CompletedEventsPage() {
  return <CategoryPageContent category={EventStatus.COMPLETED} />;
}
