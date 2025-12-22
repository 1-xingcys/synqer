// Re-export shared components from eventCommon for convenience
export {
  EventRow,
  EventSection,
  EventListWithPagination,
  EmptyState,
  EventsLayout,
} from "@/components/eventCommon/EventsOverview";

// Re-export types from eventCommon
export type {
  EventRowData,
  HostedEventRowData,
  EventRowHost,
  EventCategory,
} from "@/components/eventCommon/EventsOverview";

// Export hosted-specific components
export { default as HostedEventsLayout } from "./HostedEventsLayout";
export { default as HostedOverviewContent } from "./HostedOverviewContent";
export { default as HostedCategoryPageContent } from "./HostedCategoryPageContent";

// Default export for backwards compatibility
export { default } from "./HostedOverviewContent";
