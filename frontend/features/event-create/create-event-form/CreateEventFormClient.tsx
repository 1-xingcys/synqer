"use client";

import dynamic from "next/dynamic";
import { CreateEventFormSkeleton } from "./CreateEventFormSkeleton";

/**
 * The form's default values come from
 * Intl.DateTimeFormat().resolvedOptions().timeZone, and the server resolves a
 * different time zone than the browser (Cloud Run runs in UTC), so server
 * rendering it would cause a hydration mismatch. The shell (including the LCP
 * elements) is therefore emitted by page.tsx on the server, while the form
 * itself stays client-only.
 */
const CreateEventForm = dynamic(() => import("./index"), {
  ssr: false,
  loading: () => <CreateEventFormSkeleton />,
});

export default function CreateEventFormClient() {
  return <CreateEventForm />;
}
