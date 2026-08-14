import EventListPage from "@/features/event-list";
import { overviewMetadata } from "@/features/event-list/metadata";

export const generateMetadata = overviewMetadata("completed");

export default function Page() {
  return <EventListPage status="completed" />;
}
