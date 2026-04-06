"use client";

import { useState } from "react";
import {
  CreateEventFormData,
  DEFAULT_EVENT_TYPE,
  DEFAULT_WEEKDAYS,
} from "../types";
import { getDefaultStartDateTime } from "./utils";

function getInitialFormData(): CreateEventFormData {
  const { date: defaultDate, time: defaultTime } = getDefaultStartDateTime();

  return {
    eventType: DEFAULT_EVENT_TYPE,
    title: "",
    description: "",
    startDate: defaultDate,
    endDate: defaultDate,
    weekdays: [...DEFAULT_WEEKDAYS],
    startTime: defaultTime,
    endTime: "24:00",
    timeZone: "Asia/Taipei",
    votingDeadlineEnabled: false,
    votingDeadline: null,
    votingDeadlineTime: defaultTime,
    votingDeadlineManuallySet: false,
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
