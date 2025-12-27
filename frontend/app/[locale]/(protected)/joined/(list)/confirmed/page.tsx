import { CategoryPageContent } from "@/components/JoinedEventsOverview";
import { EventStatus } from "@/types/event";

export default function ConfirmedEventsPage() {
  return <CategoryPageContent category={EventStatus.CONFIRMED} />;
}
