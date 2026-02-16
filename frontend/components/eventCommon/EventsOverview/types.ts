import type { AttendedEventApiItem } from "@/hooks/useAttendedEvents";
import type { HostedEventApiItem } from "@/hooks/useHostedEvents";

export type EventRowData = AttendedEventApiItem;
export type HostedEventRowData = HostedEventApiItem;

export enum EventRowMode {
  JOINED = "joined",
  HOSTED = "hosted",
}
