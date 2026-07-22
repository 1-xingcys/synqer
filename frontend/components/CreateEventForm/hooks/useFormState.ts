"use client";

import { useState } from "react";
import {
  CreateEventFormData,
  DEFAULT_EVENT_TYPE,
  DEFAULT_END_TIME,
  DEFAULT_START_TIME,
  DEFAULT_WEEKDAYS,
} from "../types";
import { getTodayInTimeZone } from "./utils";
import { resolveDefaultTimeZone } from "@/lib/time";

function getInitialFormData(): CreateEventFormData {
  const timeZone = resolveDefaultTimeZone();
  const today = getTodayInTimeZone(timeZone);

  return {
    eventType: DEFAULT_EVENT_TYPE,
    title: "",
    description: "",
    startDate: today,
    endDate: new Date(today),
    weekdays: [...DEFAULT_WEEKDAYS],
    startTime: DEFAULT_START_TIME,
    endTime: DEFAULT_END_TIME,
    timeZone,
    votingDeadlineEnabled: false,
    votingDeadline: null,
    votingDeadlineTime: null,
    lineGroupId: null,
    selectedLineUserIds: [],
  };
}

function cloneFormData(formData: CreateEventFormData): CreateEventFormData {
  return {
    ...formData,
    startDate: formData.startDate ? new Date(formData.startDate) : null,
    endDate: formData.endDate ? new Date(formData.endDate) : null,
    weekdays: [...formData.weekdays],
    votingDeadline: formData.votingDeadline
      ? new Date(formData.votingDeadline)
      : null,
    selectedLineUserIds: [...formData.selectedLineUserIds],
  };
}

export function useFormState() {
  const [initialFormData] = useState<CreateEventFormData>(() =>
    getInitialFormData(),
  );
  const [formData, setFormData] = useState<CreateEventFormData>(() =>
    cloneFormData(initialFormData),
  );
  const [loading, setLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  return {
    initialFormData,
    formData,
    setFormData,
    loading,
    setLoading,
    showCancelConfirm,
    setShowCancelConfirm,
  };
}
