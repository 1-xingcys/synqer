"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useAuthContext } from "@/contexts/AuthContext";
import CreateEventForm from "@/components/CreateEventForm";

export default function NewEventPage() {
  return <CreateEventForm />;
}

