"use client";

import dynamic from "next/dynamic";
import { CreateEventFormSkeleton } from "./CreateEventFormSkeleton";

/**
 * 表單的預設值來自 Intl.DateTimeFormat().resolvedOptions().timeZone，server
 * 與瀏覽器算出來的時區不同（Cloud Run 是 UTC），一起 SSR 會造成 hydration
 * mismatch。所以外殼（含 LCP 元素）由 page.tsx 在 server 端輸出，表單本體
 * 維持 client-only。
 */
const CreateEventForm = dynamic(() => import("./index"), {
  ssr: false,
  loading: () => <CreateEventFormSkeleton />,
});

export default function CreateEventFormClient() {
  return <CreateEventForm />;
}
