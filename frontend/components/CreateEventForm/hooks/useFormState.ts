"use client";

import { useState } from "react";
import { CreateEventFormData } from "../types";
import { getToday, getDefaultStartTime } from "./utils";

function getInitialFormData(): CreateEventFormData {
  const defaultStartTime = getDefaultStartTime();

  return {
    title: "",
    description: "",
    startDate: getToday(),
    endDate: getToday(),
    startTime: defaultStartTime,
    endTime: "24:00",
    timeZone: "Asia/Taipei",
    votingDeadline: getToday(),
    votingDeadlineTime: defaultStartTime,
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
