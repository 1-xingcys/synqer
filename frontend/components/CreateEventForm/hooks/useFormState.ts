"use client";

import { useState } from "react";
import { CreateEventFormData, DEFAULT_EVENT_TYPE } from "../types";
import { getDefaultStartDateTime } from "./utils";

function getInitialFormData(): CreateEventFormData {
  const { date: defaultDate, time: defaultTime } = getDefaultStartDateTime();

  return {
    eventType: DEFAULT_EVENT_TYPE,
    title: "",
    description: "",
    startDate: defaultDate,
    endDate: defaultDate,
    weekdays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
    startTime: defaultTime,
    endTime: "24:00",
    timeZone: "Asia/Taipei",
    votingDeadline: defaultDate,
    votingDeadlineTime: defaultTime,
    votingDeadlineManuallySet: false,
    lineGroupId: null,
    selectedLineUserIds: [],
  };
}

export function useFormState() {
  const [formData, setFormData] = useState<CreateEventFormData>(() =>
    getInitialFormData(),
  );
  const [loading, setLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  return {
    formData,
    setFormData,
    loading,
    setLoading,
    showCancelConfirm,
    setShowCancelConfirm,
  };
}
