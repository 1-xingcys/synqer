"use client";

import { useState } from "react";
import {
  CreateEventFormData,
  DEFAULT_EVENT_TYPE,
  DEFAULT_END_TIME,
  DEFAULT_START_TIME,
  DEFAULT_WEEKDAYS,
} from "../types";
import { withSyncedVotingDeadline } from "./utils";
import { resolveDefaultTimeZone } from "@/lib/time";
import { todayInZone } from "@/lib/time";
import {
  DEFAULT_GRANULARITY,
  DEFAULT_SHARE_VOTE_TO_CHAT,
  DEFAULT_VOTE_MODE,
} from "@/lib/eventPreference";

function getInitialFormData(): CreateEventFormData {
  const timeZone = resolveDefaultTimeZone();
  const today = todayInZone(timeZone);

  return withSyncedVotingDeadline({
    eventType: DEFAULT_EVENT_TYPE,
    title: "",
    description: "",
    startDate: today,
    endDate: today,
    weekdays: [...DEFAULT_WEEKDAYS],
    startTime: DEFAULT_START_TIME,
    endTime: DEFAULT_END_TIME,
    timeZone,
    defaultGranularityMin: DEFAULT_GRANULARITY,
    defaultVoteMode: DEFAULT_VOTE_MODE,
    shareVoteToChat: DEFAULT_SHARE_VOTE_TO_CHAT,
    votingDeadlineEnabled: false,
    votingDeadline: null,
    votingDeadlineTime: null,
    votingDeadlineTouched: false,
    lineGroupId: null,
    selectedLineUserIds: [],
  });
}

function cloneFormData(formData: CreateEventFormData): CreateEventFormData {
  return {
    ...formData,
    weekdays: [...formData.weekdays],
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
