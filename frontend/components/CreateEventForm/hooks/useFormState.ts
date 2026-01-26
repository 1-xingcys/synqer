"use client";

import { useState } from "react";
import { CreateEventFormData } from "../types";
import { getDefaultStartDateTime } from "./utils";

function getInitialFormData(): CreateEventFormData {
  const { date: defaultDate, time: defaultTime } = getDefaultStartDateTime();

  return {
    title: "",
    description: "",
    startDate: defaultDate,
    endDate: defaultDate,
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
