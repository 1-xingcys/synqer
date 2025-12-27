// Re-export shared components from eventCommon
export {
  EventRow,
  EventSection,
  EventListWithPagination,
  EmptyState,
  EventsLayout,
  EventStatus,
} from "@/components/eventCommon/EventsOverview";

// Re-export types from eventCommon
export type {
  EventRowData,
  HostedEventRowData,
  EventRowHost,
} from "@/components/eventCommon/EventsOverview";

// Export joined-specific components
export { default as JoinedEventsLayout } from "./JoinedEventsLayout";
export { default as OverviewContent } from "./OverviewContent";
export { default as CategoryPageContent } from "./CategoryPageContent";

// Default export is now the OverviewContent for backwards compatibility
export { default } from "./OverviewContent";
