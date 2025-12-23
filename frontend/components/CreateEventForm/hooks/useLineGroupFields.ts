"use client";

import { useCallback } from "react";
import { CreateEventFormData } from "../types";

export function useLineGroupFields(
  setFormData: React.Dispatch<React.SetStateAction<CreateEventFormData>>,
) {
  const handleLineGroupChange = useCallback(
    (groupId: string | null) => {
      setFormData((prev) => ({
        ...prev,
        lineGroupId: groupId,
        selectedLineUserIds: [], // Reset selection when group changes
      }));
    },
    [setFormData],
  );

  const handleSelectedMembersChange = useCallback(
    (lineUserIds: string[]) => {
      setFormData((prev) => ({
        ...prev,
        selectedLineUserIds: lineUserIds,
      }));
    },
    [setFormData],
  );

  return {
    handleLineGroupChange,
    handleSelectedMembersChange,
  };
}
